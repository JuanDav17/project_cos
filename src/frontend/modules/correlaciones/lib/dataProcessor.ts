import { AsesorCorrelacion, CorrelacionData, Promedios, RawRow } from '@correlaciones/types';

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function normalize(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const EFECTIVIDAD_PLACEHOLDER_NAMES: Record<string, string> = {
  '5639820': 'Mauricio Andres Vega',
  '1000620791': 'Andres Felipe Rojas',
  '1000240263': 'Natalia Fernanda Rios',
  '1000329232': 'Andres Camilo Silva',
  '1000694755': 'Kevin Alejandro Ruiz',
  '1000731209': 'Laura Marcela Vargas',
  '1001047132': 'Laura Daniela Medina',
  '1010039762': 'Paula Andrea Romero',
  '1016594042': 'Valentina Marcela Lopez',
  '1019762213': 'Juliana Paola Castro',
  '1019047541': 'Carlos Andres Prieto',
  '1019110650': 'Diana Carolina Mendoza',
  '1021397519': 'Sebastian Felipe Moreno',
  '1022927487': 'Cristian David Herrera',
  '1034660899': 'Daniela Alejandra Gomez',
  '1233892487': 'Camila Andrea Torres',
};

/* ── 1. Auditorias ────────────────────────────────────────────────────────── */

interface AudData {
  calProm: number;
  monitoreos: number;
  itemsNoCumple: number;
  totalItems: number;
  pctNoCumple: number;
  criticosEnCero: number;
  nombre: string;
  supervisor: string;
}

function processAuditorias(rows: RawRow[]): Map<string, AudData> {
  const byAsesor = new Map<string, Map<number, { cal: number; hasCritico: boolean; items: { nc: number; total: number }[] }>>();
  const nombres = new Map<string, { nombre: string; supervisor: string }>();

  for (const row of rows) {
    const doc = str(row.cedula_asesor);
    if (!doc) continue;

    const id = num(row.id);
    if (!nombres.has(doc)) {
      nombres.set(doc, {
        nombre: normalize(str(row.nombre_asesor)),
        supervisor: normalize(str(row.nombre_del_jefe_inmediato)),
      });
    }

    if (!byAsesor.has(doc)) byAsesor.set(doc, new Map());
    const monMap = byAsesor.get(doc)!;
    if (!monMap.has(id)) {
      monMap.set(id, { cal: num(row.calificacion_del_monitoreo), hasCritico: false, items: [] });
    }
    const mon = monMap.get(id)!;

    const critico = str(row.critico).toLowerCase();
    if (critico === 'critico') mon.hasCritico = true;

    const nc = num(row.no_cumple);
    mon.items.push({ nc, total: 1 });
  }

  const result = new Map<string, AudData>();
  for (const [doc, monMap] of byAsesor) {
    let sumCal = 0;
    let countMon = 0;
    let itemsNC = 0;
    let totalItems = 0;
    let criticosEnCero = 0;

    for (const [, mon] of monMap) {
      const cal = mon.hasCritico ? 0 : mon.cal;
      sumCal += cal;
      countMon++;
      if (mon.hasCritico) criticosEnCero++;
      for (const item of mon.items) {
        itemsNC += item.nc;
        totalItems += item.total;
      }
    }

    const info = nombres.get(doc) || { nombre: '', supervisor: '' };
    result.set(doc, {
      calProm: countMon > 0 ? sumCal / countMon : 0,
      monitoreos: countMon,
      itemsNoCumple: itemsNC,
      totalItems,
      pctNoCumple: totalItems > 0 ? (itemsNC / totalItems) * 100 : 0,
      criticosEnCero,
      nombre: info.nombre,
      supervisor: info.supervisor,
    });
  }
  return result;
}

/* ── 2. Celula Antifraude ─────────────────────────────────────────────────── */

interface AntifData {
  malaPracticas: number;
  tipos: Record<string, number>;
  nombre: string;
  supervisor: string;
}

function processAntifraude(rows: RawRow[]): Map<string, AntifData> {
  const result = new Map<string, AntifData>();

  for (const row of rows) {
    const doc = str(row.cedula);
    if (!doc) continue;

    if (!result.has(doc)) {
      result.set(doc, {
        malaPracticas: 0,
        tipos: {},
        nombre: normalize(str(row.asesor)),
        supervisor: normalize(str(row.supervisor)),
      });
    }
    const data = result.get(doc)!;

    const esMala = str(row.mala_practica).toUpperCase() === 'SI';
    if (esMala) {
      data.malaPracticas++;
      let tipo = normalize(str(row.tipo_de_mala_practica));
      if (tipo.toLowerCase().includes('empat')) tipo = 'Falta de Empatia';
      if (tipo.toLowerCase().includes('evas')) tipo = 'Evasion';
      if (tipo.toLowerCase().includes('fraud')) tipo = 'Fraude';
      data.tipos[tipo] = (data.tipos[tipo] || 0) + 1;
    }
  }
  return result;
}

/* ── 3. Efectividad ───────────────────────────────────────────────────────── */

interface EfecData {
  retenidos: number;
  intenciones: number;
  pct: number;
  nombre: string;
}

function processEfectividad(rows: RawRow[]): Map<string, EfecData> {
  const result = new Map<string, EfecData>();

  for (const row of rows) {
    const doc = str(row.doc_asesor);
    if (!doc) continue;

    if (!result.has(doc)) {
      result.set(doc, {
        retenidos: 0,
        intenciones: 0,
        pct: 0,
        nombre: normalize(EFECTIVIDAD_PLACEHOLDER_NAMES[doc] ?? ''),
      });
    }
    const data = result.get(doc)!;
    data.retenidos += num(row.retenidos);
    data.intenciones += num(row.cantidad_intenciones);
  }

  for (const [, data] of result) {
    data.pct = data.intenciones > 0 ? (data.retenidos / data.intenciones) * 100 : 0;
  }
  return result;
}

/* ── 4. Voz Cliente ───────────────────────────────────────────────────────── */

interface VozData {
  distribucion: Record<string, number>;
  totalLlamadas: number;
  finEmoNeg: number;
  nombre: string;
  supervisor: string;
}

function processVozCliente(rows: RawRow[]): Map<string, VozData> {
  const byAsesor = new Map<string, { dist: Record<string, number>; total: number; negCount: number; nombre: string; supervisor: string }>();

  for (const row of rows) {
    const doc = str(row.doc_asesor);
    if (!doc) continue;

    if (!byAsesor.has(doc)) {
      byAsesor.set(doc, {
        dist: {},
        total: 0,
        negCount: 0,
        nombre: normalize(str(row.asesor)),
        supervisor: normalize(str(row.supervisor)),
      });
    }
    const data = byAsesor.get(doc)!;
    data.total++;

    const voz = str(row.voz_cliente);
    if (voz) data.dist[voz] = (data.dist[voz] || 0) + 1;

    const finEmo = str(row.fin_emo_agent).toLowerCase();
    if (finEmo === 'triste' || finEmo === 'enojado') data.negCount++;
  }

  const result = new Map<string, VozData>();
  for (const [doc, data] of byAsesor) {
    result.set(doc, {
      distribucion: data.dist,
      totalLlamadas: data.total,
      finEmoNeg: data.total > 0 ? (data.negCount / data.total) * 100 : 0,
      nombre: data.nombre,
      supervisor: data.supervisor,
    });
  }
  return result;
}

/* ── 5. NPS / FCR ─────────────────────────────────────────────────────────── */

interface NpsData {
  nps: number;
  fcr: number;
  nombre: string;
}

function processNpsFcr(rows: RawRow[]): Map<string, NpsData> {
  const result = new Map<string, NpsData>();
  for (const row of rows) {
    const doc = str(row.docasesor);
    if (!doc) continue;
    result.set(doc, {
      nps: num(row.nps),
      fcr: num(row.solucion),
      nombre: normalize(str(row.nombres_apellidos)),
    });
  }
  return result;
}

/* ── 6. Score ponderado ───────────────────────────────────────────────────── */

function computeScore(a: Omit<AsesorCorrelacion, 'scoreGlobal' | 'cuartil' | 'dimensionesAlerta'>): number {
  const sEfec = Math.min(100, Math.max(0, a.efecPctEfectividad));
  const sCal = Math.min(100, Math.max(0, a.audCalificacionProm));
  const sNps = Math.min(100, Math.max(0, ((a.nps + 1) / 2) * 100));
  const sFcr = Math.min(100, Math.max(0, a.fcr * 100));
  const sVoz = Math.min(100, Math.max(0, 100 - a.vozFinEmoNeg));
  const sAntif = Math.min(100, Math.max(0, 100 - a.antifMalaPracticas * 25));

  return sEfec * 0.30 + sCal * 0.25 + sNps * 0.15 + sFcr * 0.15 + sVoz * 0.10 + sAntif * 0.05;
}

/* ── 7. Cuartiles por dimension ───────────────────────────────────────────── */

function getQuartile(value: number, sorted: number[]): 1 | 2 | 3 | 4 {
  if (sorted.length === 0) return 2;
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q2 = sorted[Math.floor(sorted.length * 0.50)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  if (value <= q1) return 1;
  if (value <= q2) return 2;
  if (value <= q3) return 3;
  return 4;
}

function getDimensionAlerts(a: AsesorCorrelacion, thresholds: {
  calQ1: number; efecQ1: number; npsQ1: number; fcrQ1: number;
}): string[] {
  const alerts: string[] = [];
  if (a.audCalificacionProm > 0 && a.audCalificacionProm <= thresholds.calQ1) alerts.push('Calidad');
  if (a.efecPctEfectividad > 0 && a.efecPctEfectividad <= thresholds.efecQ1) alerts.push('Efectividad');
  if (a.nps !== 0 && a.nps <= thresholds.npsQ1) alerts.push('NPS');
  if (a.fcr > 0 && a.fcr <= thresholds.fcrQ1) alerts.push('FCR');
  if (a.antifMalaPracticas >= 2) alerts.push('Antifraude');
  if (a.vozFinEmoNeg > 30) alerts.push('Sentimiento');
  return alerts;
}

/* ── Main processor ───────────────────────────────────────────────────────── */

export function processCorrelaciones(sources: {
  auditorias: RawRow[];
  antifraude: RawRow[];
  efectividad: RawRow[];
  vozCliente: RawRow[];
  npsFcr: RawRow[];
}): CorrelacionData {
  const audMap = processAuditorias(sources.auditorias);
  const antifMap = processAntifraude(sources.antifraude);
  const efecMap = processEfectividad(sources.efectividad);
  const vozMap = processVozCliente(sources.vozCliente);
  const npsMap = processNpsFcr(sources.npsFcr);

  // Collect all unique docs
  const allDocs = new Set<string>();
  for (const map of [audMap, antifMap, efecMap, vozMap, npsMap]) {
    for (const doc of map.keys()) allDocs.add(doc);
  }

  // Build asesores
  const asesores: AsesorCorrelacion[] = [];
  for (const doc of allDocs) {
    const aud = audMap.get(doc);
    const antif = antifMap.get(doc);
    const efec = efecMap.get(doc);
    const voz = vozMap.get(doc);
    const npsData = npsMap.get(doc);

    const nombre = aud?.nombre || antif?.nombre || voz?.nombre || npsData?.nombre || efec?.nombre || doc;
    const supervisor = aud?.supervisor || antif?.supervisor || voz?.supervisor || '';

    const base: Omit<AsesorCorrelacion, 'scoreGlobal' | 'cuartil' | 'dimensionesAlerta'> = {
      doc,
      nombre,
      supervisor,
      audCalificacionProm: aud?.calProm ?? 0,
      audMonitoreos: aud?.monitoreos ?? 0,
      audItemsNoCumple: aud?.itemsNoCumple ?? 0,
      audTotalItems: aud?.totalItems ?? 0,
      audPctNoCumple: aud?.pctNoCumple ?? 0,
      audCriticosEnCero: aud?.criticosEnCero ?? 0,
      antifMalaPracticas: antif?.malaPracticas ?? 0,
      antifTipos: antif?.tipos ?? {},
      efecRetenidos: efec?.retenidos ?? 0,
      efecIntenciones: efec?.intenciones ?? 0,
      efecPctEfectividad: efec?.pct ?? 0,
      vozDistribucion: voz?.distribucion ?? {},
      vozTotalLlamadas: voz?.totalLlamadas ?? 0,
      vozFinEmoNeg: voz?.finEmoNeg ?? 0,
      nps: npsData?.nps ?? 0,
      fcr: npsData?.fcr ?? 0,
    };

    const scoreGlobal = computeScore(base);

    asesores.push({
      ...base,
      scoreGlobal: Math.round(scoreGlobal * 100) / 100,
      cuartil: 2,
      dimensionesAlerta: [],
    });
  }

  // Compute cuartiles
  const sortedScores = asesores.map((a) => a.scoreGlobal).sort((a, b) => a - b);
  for (const a of asesores) {
    a.cuartil = getQuartile(a.scoreGlobal, sortedScores);
  }

  // Compute dimension Q1 thresholds
  const calScores = asesores.filter((a) => a.audCalificacionProm > 0).map((a) => a.audCalificacionProm).sort((a, b) => a - b);
  const efecScores = asesores.filter((a) => a.efecPctEfectividad > 0).map((a) => a.efecPctEfectividad).sort((a, b) => a - b);
  const npsScores = asesores.filter((a) => a.nps !== 0).map((a) => a.nps).sort((a, b) => a - b);
  const fcrScores = asesores.filter((a) => a.fcr > 0).map((a) => a.fcr).sort((a, b) => a - b);

  const thresholds = {
    calQ1: calScores[Math.floor(calScores.length * 0.25)] ?? 0,
    efecQ1: efecScores[Math.floor(efecScores.length * 0.25)] ?? 0,
    npsQ1: npsScores[Math.floor(npsScores.length * 0.25)] ?? 0,
    fcrQ1: fcrScores[Math.floor(fcrScores.length * 0.25)] ?? 0,
  };

  for (const a of asesores) {
    a.dimensionesAlerta = getDimensionAlerts(a, thresholds);
  }

  // Sort by scoreGlobal descending
  asesores.sort((a, b) => b.scoreGlobal - a.scoreGlobal);

  // Supervisors
  const supervisores = [...new Set(asesores.map((a) => a.supervisor).filter(Boolean))].sort();

  // Promedios
  const withCal = asesores.filter((a) => a.audCalificacionProm > 0);
  const withEfec = asesores.filter((a) => a.efecPctEfectividad > 0);
  const withNps = asesores.filter((a) => a.nps !== 0);
  const withFcr = asesores.filter((a) => a.fcr > 0);
  const withVoz = asesores.filter((a) => a.vozTotalLlamadas > 0);

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

  const promedios: Promedios = {
    calidad: Math.round(avg(withCal.map((a) => a.audCalificacionProm)) * 100) / 100,
    efectividad: Math.round(avg(withEfec.map((a) => a.efecPctEfectividad)) * 100) / 100,
    nps: Math.round(avg(withNps.map((a) => a.nps)) * 1000) / 1000,
    fcr: Math.round(avg(withFcr.map((a) => a.fcr)) * 1000) / 1000,
    antifraude: asesores.filter((a) => a.antifMalaPracticas > 0).length,
    vozNeg: Math.round(avg(withVoz.map((a) => a.vozFinEmoNeg)) * 100) / 100,
  };

  // Reincidentes: 2+ dimensiones en alerta
  const reincidentes = asesores
    .filter((a) => a.dimensionesAlerta.length >= 2)
    .sort((a, b) => b.dimensionesAlerta.length - a.dimensionesAlerta.length);

  return {
    asesores,
    supervisores,
    promedios,
    reincidentes,
    totalAsesores: asesores.length,
    totalConAuditorias: audMap.size,
    totalConEfectividad: efecMap.size,
    totalConNps: npsMap.size,
    totalConAntifraude: antifMap.size,
    totalConVoz: vozMap.size,
  };
}
