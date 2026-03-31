import * as XLSX from 'xlsx';
import { Asesor, Causal, Meta, RawRow, ReportData, SupervisorRaw } from '@reincidentes/types';
import { detectCat, normalize, parseDate, perfilKey, perfilLbl } from './utils';

const COL = {
  id: 'ID Mios Consecutivo Único De Auditoría',
  asesor: 'Nombre Del Asesor Auditado',
  doc: 'Documento Asesor Auditado',
  sup: 'Nombre Del Jefe Inmediato',
  ingreso: 'Fecha Ingreso',
  fechaAud: 'Fecha Llamada Auditada',
  cal: 'Calificación Del Monitoreo',
  critico: '¿Afectación critica?',
  causal: 'Afectaciones Subitems',
  empresa: 'Empresa',
  campana: 'Nombre Matriz',
} as const;

const REQUIRED_KEYS: Array<keyof typeof COL> = ['id', 'asesor', 'doc', 'sup', 'ingreso', 'fechaAud', 'cal', 'critico', 'causal'];

function resolveColumns(sampleRow: RawRow): Record<keyof typeof COL, string> {
  const keys = Object.keys(sampleRow);
  const colMap = {} as Record<keyof typeof COL, string>;

  (Object.entries(COL) as Array<[keyof typeof COL, string]>).forEach(([key, value]) => {
    const exact = keys.find((candidate) => candidate === value);
    const fuzzy =
      exact ||
      keys.find((candidate) =>
        candidate.toLowerCase().includes(value.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase()),
      );
    colMap[key] = fuzzy || '';
  });

  const missing = REQUIRED_KEYS.filter((key) => !colMap[key]);
  if (missing.length) {
    throw new Error(
      `Columnas requeridas no encontradas: ${missing.map((key) => COL[key]).join(', ')}`,
    );
  }

  return colMap;
}

export function readFile(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) {
          throw new Error('El archivo no contiene hojas para procesar.');
        }
        const ws = wb.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true }) as RawRow[];
        if (!rows.length) {
          throw new Error('El archivo no contiene filas de datos.');
        }
        resolve(rows);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('No se pudo interpretar el archivo.'));
      }
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });
}

export async function processData(rows: RawRow[], fileName: string): Promise<ReportData> {
  if (!rows.length) {
    throw new Error('No hay registros para procesar.');
  }

  const today = new Date();
  const sampleRow = rows[0] ?? {};
  const colMap = resolveColumns(sampleRow);

  const metaRow = rows.find((row) => row[colMap.empresa] || row[colMap.campana]) ?? sampleRow;
  const meta: Meta = {
    empresa: normalize(metaRow[colMap.empresa]) || 'GroupCOS',
    campana: normalize(metaRow[colMap.campana]) || '',
    archivo: fileName,
  };

  const idMesMap: Record<string, string> = {};
  const asesorMap: Record<
    string,
    {
      doc: string;
      nombre: string;
      supervisor: string;
      antiguedad: number;
      perfil: Asesor['perfil'];
      perfilLbl: string;
      ids: Set<string>;
      cal: number[];
      critMap: Record<string, Set<string>>;
      critMapNC: Record<string, Set<string>>;
    }
  > = {};

  for (const row of rows) {
    const id = String(row[colMap.id] ?? '').trim();
    if (!id) continue;

    const fechaAud = parseDate(row[colMap.fechaAud]);
    const mes = fechaAud
      ? `${fechaAud.getFullYear()}-${String(fechaAud.getMonth() + 1).padStart(2, '0')}`
      : null;
    if (mes && !idMesMap[id]) idMesMap[id] = mes;

    const doc = String(row[colMap.doc] ?? '').trim();
    if (!doc) continue;

    if (!asesorMap[doc]) {
      const fechaIngreso = parseDate(row[colMap.ingreso]);
      const antiguedad = fechaIngreso
        ? Math.max(0, Math.round((today.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const perfil = perfilKey(antiguedad);
      asesorMap[doc] = {
        doc,
        nombre: normalize(row[colMap.asesor]),
        supervisor: normalize(row[colMap.sup]),
        antiguedad,
        perfil,
        perfilLbl: perfilLbl(perfil),
        ids: new Set<string>(),
        cal: [],
        critMap: {},
        critMapNC: {},
      };
    }

    const asesor = asesorMap[doc];
    asesor.ids.add(id);

    const calVal = Number.parseFloat(String(row[colMap.cal] ?? '').replace(',', '.'));
    if (!Number.isNaN(calVal)) {
      asesor.cal.push(calVal);
    }

    const criticoVal = String(row[colMap.critico] ?? '').trim().toLowerCase();
    const esCritico = criticoVal === 'si' || criticoVal === 'sí';
    const esNoCritico = criticoVal === 'no';
    const causal = String(row[colMap.causal] ?? '').trim().replace(/&quot;/g, '"');

    if (!causal || causal === '.' || causal === '..1') continue;

    if (esCritico) {
      asesor.critMap[causal] ??= new Set<string>();
      asesor.critMap[causal].add(id);
    } else if (esNoCritico) {
      asesor.critMapNC[causal] ??= new Set<string>();
      asesor.critMapNC[causal].add(id);
    }
  }

  const asesores: Asesor[] = Object.values(asesorMap).map((asesor) => {
    const monUnicos = asesor.ids.size;
    const meses = [...new Set([...asesor.ids].map((id) => idMesMap[id]).filter(Boolean))] as string[];
    const cal = asesor.cal.length
      ? Math.round((asesor.cal.reduce((sum, value) => sum + value, 0) / asesor.cal.length) * 10) / 10
      : 0;

    const buildCausales = (
      source: Record<string, Set<string>>,
      tipo: Causal['tipo'],
    ): Causal[] =>
      Object.entries(source)
        .filter(([, ids]) => ids.size >= 2)
        .map(([c, ids]) => ({
          c,
          n: ids.size,
          cat: detectCat(c),
          meses: [...new Set([...ids].map((id) => idMesMap[id]).filter(Boolean))],
          tipo,
        }));

    const causales = buildCausales(asesor.critMap, 'critico');
    const causalesNC = buildCausales(asesor.critMapNC, 'no_critico');

    return {
      doc: asesor.doc,
      nombre: asesor.nombre,
      supervisor: asesor.supervisor,
      antiguedad: asesor.antiguedad,
      perfil: asesor.perfil,
      perfilLbl: asesor.perfilLbl,
      mon: monUnicos,
      meses,
      cal,
      causales,
      causalesNC,
      causalesAll: [...causales, ...causalesNC],
      total_reinc: causales.reduce((sum, causal) => sum + causal.n, 0),
      total_reinc_nc: causalesNC.reduce((sum, causal) => sum + causal.n, 0),
    };
  });

  const reincidentesCrit = asesores
    .filter((asesor) => asesor.causales.length > 0)
    .sort((a, b) => b.total_reinc - a.total_reinc);
  const reincidentesNC = asesores
    .filter((asesor) => asesor.causalesNC.length > 0)
    .sort((a, b) => b.total_reinc_nc - a.total_reinc_nc);
  const reincidentesAll = [...new Map([...reincidentesCrit, ...reincidentesNC].map((a) => [a.doc, a])).values()].sort(
    (a, b) => b.total_reinc + b.total_reinc_nc - (a.total_reinc + a.total_reinc_nc),
  );

  const supRaw: Record<string, SupervisorRaw> = {};
  asesores.forEach((asesor) => {
    supRaw[asesor.supervisor] ??= { asesores: 0, mon: 0, reincData: [], reincDataNC: [] };
    supRaw[asesor.supervisor].asesores += 1;
    supRaw[asesor.supervisor].mon += asesor.mon;
    if (asesor.causales.length > 0) supRaw[asesor.supervisor].reincData.push(asesor);
    if (asesor.causalesNC.length > 0) supRaw[asesor.supervisor].reincDataNC.push(asesor);
  });

  const allMeses = [...new Set(Object.values(idMesMap))].sort();
  const mesLabels: Record<string, string> = {};
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  allMeses.forEach((monthKey) => {
    const [year, month] = monthKey.split('-');
    mesLabels[monthKey] = `${monthNames[Number.parseInt(month, 10) - 1]} ${year}`;
  });

  const supervisores = [...new Set(asesores.map((asesor) => asesor.supervisor))].sort();

  return {
    meta,
    asesores,
    reincidentes: reincidentesCrit,
    reincidentesCrit,
    reincidentesNC,
    reincidentesAll,
    supRaw,
    allMeses,
    mesLabels,
    supervisores,
    totalMon: Object.keys(idMesMap).length,
    totalAsesores: asesores.length,
  };
}
