import {
  AFAdvisor,
  AFRecord,
  AFReincidente,
  GroupSpeechAverages,
  ParetoAFItem,
  ParetoSoulItem,
  ProcessedReport,
  RawRow,
  ReportKpis,
  SoulAdvisor,
  SpeechMetrics,
  SupervisorSummary,
} from '@quality/types/report';
import {
  antiguedadCategoria,
  cleanMonth,
  formatDate,
  monthSortKey,
  normalizeText,
  parseExcelDate,
  parsePercent,
  titleCase,
} from './utils';

const TODAY_REFERENCE = new Date('2026-03-12T00:00:00');

function getValue(row: RawRow, candidates: string[]): unknown {
  const key = candidates.find((candidate) => candidate in row);
  return key ? row[key] : '';
}

function computeGroupAverage(items: Array<{ speech: SpeechMetrics | null }>, key: keyof Omit<SpeechMetrics, 'interactions'>): number | null {
  const values = items
    .map((item) => item.speech?.[key] ?? null)
    .filter((value): value is number => value !== null);

  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildSpeechMap(rows: RawRow[]): Record<string, SpeechMetrics> {
  const accumulator: Record<string, { eSum: number; eCount: number; nSum: number; nCount: number; fSum: number; fCount: number }> = {};

  rows.forEach((row) => {
    const cedula = normalizeText(getValue(row, ['Doc Asesor', 'doc_asesor', 'Cedula', 'Documento Asesor Auditado']));
    if (!cedula) return;

    accumulator[cedula] ??= { eSum: 0, eCount: 0, nSum: 0, nCount: 0, fSum: 0, fCount: 0 };
    const bucket = accumulator[cedula];

    const eno = parsePercent(getValue(row, ['Agente Enojado', 'agente_enojado']));
    const neg = parsePercent(getValue(row, ['Agente Negativo Sent', 'agente_negativo_sent', 'Agente Negativo']));
    const finRaw = getValue(row, ['Fin Sent Clien', 'fin_sent_clien', 'Fin Sent Cliente']);
    const fin = finRaw === null || finRaw === undefined || finRaw === ''
      ? null
      : String(finRaw).trim().toLowerCase() === 'negativo'
        ? 100
        : 0;

    if (eno !== null) {
      bucket.eSum += eno;
      bucket.eCount += 1;
    }
    if (neg !== null) {
      bucket.nSum += neg;
      bucket.nCount += 1;
    }
    if (fin !== null) {
      bucket.fSum += fin;
      bucket.fCount += 1;
    }
  });

  return Object.fromEntries(
    Object.entries(accumulator).map(([cedula, value]) => [
      cedula,
      {
        enojado: value.eCount ? Math.round((value.eSum / value.eCount) * 10) / 10 : null,
        negativo: value.nCount ? Math.round((value.nSum / value.nCount) * 10) / 10 : null,
        fin: value.fCount ? Math.round((value.fSum / value.fCount) * 10) / 10 : null,
        interactions: Math.max(value.eCount, value.nCount, value.fCount),
      },
    ]),
  );
}

export function processReportData(soulRows: RawRow[], antiRows: RawRow[], speechRows: RawRow[] = []): ProcessedReport {
  const speechMap = buildSpeechMap(speechRows);

  const advisorMap: Record<
    string,
    {
      nombre: string;
      supervisor: string;
      fechaIngreso: unknown;
      monIds: Set<string>;
      meses: Set<string>;
      speech: SpeechMetrics | null;
    }
  > = {};

  soulRows.forEach((row) => {
    const cedula = normalizeText(getValue(row, ['Documento Asesor Auditado', 'Cedula', 'Documento']));
    if (!cedula) return;

    advisorMap[cedula] ??= {
      nombre: titleCase(getValue(row, ['Nombre Del Asesor Auditado', 'Asesor', 'Nombre'])),
      supervisor: titleCase(getValue(row, ['Nombre Del Jefe Inmediato', 'Supervisor'])),
      fechaIngreso: getValue(row, ['Fecha Ingreso', 'Fecha de ingreso']),
      monIds: new Set<string>(),
      meses: new Set<string>(),
      speech: speechMap[cedula] ?? null,
    };

    const auditId = normalizeText(getValue(row, ['ID Mios Consecutivo Único De Auditoría', 'ID', 'Id']));
    if (auditId) advisorMap[cedula].monIds.add(auditId);

    const month = cleanMonth(getValue(row, ['Mes']));
    if (month && month !== '—') advisorMap[cedula].meses.add(month);
  });

  const critMap: Record<string, Record<string, Set<string>>> = {};
  const monWithCriticos: Record<string, Set<string>> = {};

  soulRows.forEach((row) => {
    const cedula = normalizeText(getValue(row, ['Documento Asesor Auditado', 'Cedula', 'Documento']));
    const critica = normalizeText(getValue(row, ['¿Afectación critica?', 'Afectación critica', 'Critico'])).toLowerCase();
    if (!cedula || critica !== 'si') return;

    const causal = normalizeText(getValue(row, ['Afectaciones', 'Afectaciones Subitems', 'Causal']));
    const auditId = normalizeText(getValue(row, ['ID Mios Consecutivo Único De Auditoría', 'ID', 'Id']));
    if (!causal || !auditId) return;

    critMap[cedula] ??= {};
    critMap[cedula][causal] ??= new Set<string>();
    critMap[cedula][causal].add(auditId);

    monWithCriticos[cedula] ??= new Set<string>();
    monWithCriticos[cedula].add(auditId);
  });

  const soulAdvisors: SoulAdvisor[] = Object.entries(critMap)
    .flatMap(([cedula, causalesMap]) => {
      const causales = Object.entries(causalesMap)
        .filter(([, ids]) => ids.size >= 2)
        .map(([causal, ids]) => ({ causal, mon: ids.size }))
        .sort((a, b) => b.mon - a.mon);

      if (!causales.length) return [];

      const advisor = advisorMap[cedula];
      const fechaIngreso = parseExcelDate(advisor?.fechaIngreso);
      const antMonths = fechaIngreso
        ? Math.max(0, Math.round((TODAY_REFERENCE.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        : 0;

      return [{
        cedula,
        nombre: advisor?.nombre || cedula,
        supervisor: advisor?.supervisor || '—',
        antCat: antiguedadCategoria(antMonths),
        antMonths,
        totalMon: advisor?.monIds.size || 0,
        monCriticos: monWithCriticos[cedula]?.size || 0,
        numCausales: causales.length,
        totalMonAfectaciones: causales.reduce((sum, item) => sum + item.mon, 0),
        causales,
        meses: [...(advisor?.meses ?? [])].sort((left, right) => monthSortKey(left) - monthSortKey(right)),
        speech: advisor?.speech || null,
        malasPracticas: '',
        totalRegAf: 0,
        coincidencia: false,
      } satisfies SoulAdvisor];
    })
    .sort((left, right) => right.numCausales - left.numCausales || right.totalMonAfectaciones - left.totalMonAfectaciones);

  const soulReincidentesSet = new Set(soulAdvisors.map((advisor) => advisor.cedula));

  const afMap: Record<
    string,
    {
      nombre: string;
      supervisor: string;
      antiguedad: string;
      registros: AFRecord[];
      tipoCount: Record<string, number>;
    }
  > = {};

  antiRows.forEach((row) => {
    const cedula = normalizeText(getValue(row, ['Cedula', 'Cédula']));
    if (!cedula) return;

    afMap[cedula] ??= {
      nombre: titleCase(getValue(row, ['Asesor', 'Nombre Del Asesor Auditado', 'Nombre'])),
      supervisor: titleCase(getValue(row, ['Supervisor', 'Nombre Del Jefe Inmediato'])),
      antiguedad: normalizeText(getValue(row, ['Antiguedad', 'Antigüedad'])) || '—',
      registros: [],
      tipoCount: {},
    };

    const tipo = normalizeText(getValue(row, ['Tipo de mala practica', 'Tipo de mala práctica'])) || '—';
    const record: AFRecord = {
      tipo,
      descripcion: normalizeText(getValue(row, ['Descripción', 'Descripcion'])) || '—',
      observacion: normalizeText(getValue(row, ['Observacion', 'Observación'])) || '—',
      fecha: formatDate(getValue(row, ['Fecha de monitoreo', 'Fecha de Monitoreo'])),
      idLlamada: normalizeText(getValue(row, ['ID  llamada', 'ID llamada'])) || '—',
    };

    afMap[cedula].registros.push(record);
    afMap[cedula].tipoCount[tipo] = (afMap[cedula].tipoCount[tipo] || 0) + 1;
  });

  const reincidentesAf: AFReincidente[] = [];
  const reincidentesAfSet = new Set<string>();

  Object.entries(afMap).forEach(([cedula, advisor]) => {
    Object.entries(advisor.tipoCount).forEach(([tipo, count]) => {
      if (count < 2) return;
      reincidentesAf.push({
        cedula,
        nombre: advisor.nombre,
        supervisor: advisor.supervisor,
        antiguedad: advisor.antiguedad,
        tipo,
        numRegistros: count,
        registros: advisor.registros.filter((record) => record.tipo === tipo),
        speech: speechMap[cedula] ?? null,
      });
      reincidentesAfSet.add(cedula);
    });
  });

  reincidentesAf.sort((left, right) => right.numRegistros - left.numRegistros || left.nombre.localeCompare(right.nombre));

  const afAdvisors: AFAdvisor[] = Object.entries(afMap)
    .map(([cedula, advisor]) => ({
      cedula,
      nombre: advisor.nombre,
      supervisor: advisor.supervisor,
      antiguedad: advisor.antiguedad,
      tipos: Object.keys(advisor.tipoCount).join(' | '),
      totalReg: advisor.registros.length,
      esReincidenteAf: reincidentesAfSet.has(cedula),
      esReincidenteSoul: soulReincidentesSet.has(cedula),
      registros: advisor.registros,
      speech: speechMap[cedula] ?? null,
    }))
    .sort((left, right) => right.totalReg - left.totalReg || left.nombre.localeCompare(right.nombre));

  const afPresenceMap = new Map(afAdvisors.map((advisor) => [advisor.cedula, advisor]));
  soulAdvisors.forEach((advisor) => {
    const afAdvisor = afPresenceMap.get(advisor.cedula);
    if (!afAdvisor) return;
    advisor.coincidencia = true;
    advisor.totalRegAf = afAdvisor.totalReg;
    advisor.malasPracticas = afAdvisor.tipos;
  });

  const paretoSoulMap: Record<string, { asesores: number; monitoreos: number }> = {};
  soulAdvisors.forEach((advisor) => {
    advisor.causales.forEach((item) => {
      paretoSoulMap[item.causal] ??= { asesores: 0, monitoreos: 0 };
      paretoSoulMap[item.causal].asesores += 1;
      paretoSoulMap[item.causal].monitoreos += item.mon;
    });
  });

  const sortedParetoSoul = Object.entries(paretoSoulMap)
    .map(([causal, values]) => ({ causal, asesores: values.asesores, monitoreos: values.monitoreos }))
    .sort((left, right) => right.asesores - left.asesores || right.monitoreos - left.monitoreos);

  const totalParetoSoul = sortedParetoSoul.reduce((sum, item) => sum + item.asesores, 0) || 1;
  let paretoSoulAccumulator = 0;
  const paretoSoul: ParetoSoulItem[] = sortedParetoSoul.map((item) => {
    paretoSoulAccumulator += (item.asesores / totalParetoSoul) * 100;
    return {
      causal: item.causal,
      asesores: item.asesores,
      monitoreos: item.monitoreos,
      porcentaje: Math.round(((item.asesores / totalParetoSoul) * 100) * 10) / 10,
      porcentajeAcumulado: Math.round(paretoSoulAccumulator * 10) / 10,
    };
  });

  const paretoAfMap: Record<string, { asesores: Set<string>; registros: number }> = {};
  Object.entries(afMap).forEach(([cedula, advisor]) => {
    Object.entries(advisor.tipoCount).forEach(([tipo, count]) => {
      paretoAfMap[tipo] ??= { asesores: new Set<string>(), registros: 0 };
      paretoAfMap[tipo].asesores.add(cedula);
      paretoAfMap[tipo].registros += count;
    });
  });

  const sortedParetoAf = Object.entries(paretoAfMap)
    .map(([tipo, values]) => ({ tipo, asesores: values.asesores.size, registros: values.registros }))
    .sort((left, right) => right.asesores - left.asesores || right.registros - left.registros);

  const totalParetoAf = sortedParetoAf.reduce((sum, item) => sum + item.asesores, 0) || 1;
  let paretoAfAccumulator = 0;
  const paretoAf: ParetoAFItem[] = sortedParetoAf.map((item) => {
    paretoAfAccumulator += (item.asesores / totalParetoAf) * 100;
    return {
      tipo: item.tipo,
      asesores: item.asesores,
      registros: item.registros,
      porcentaje: Math.round(((item.asesores / totalParetoAf) * 100) * 10) / 10,
      porcentajeAcumulado: Math.round(paretoAfAccumulator * 10) / 10,
    };
  });

  const supervisorAccumulator: Record<string, { reincidentes: number; causalesSum: number; conAf: number; totalMonAfectaciones: number }> = {};
  soulAdvisors.forEach((advisor) => {
    supervisorAccumulator[advisor.supervisor] ??= { reincidentes: 0, causalesSum: 0, conAf: 0, totalMonAfectaciones: 0 };
    supervisorAccumulator[advisor.supervisor].reincidentes += 1;
    supervisorAccumulator[advisor.supervisor].causalesSum += advisor.numCausales;
    supervisorAccumulator[advisor.supervisor].totalMonAfectaciones += advisor.totalMonAfectaciones;
    if (advisor.coincidencia) supervisorAccumulator[advisor.supervisor].conAf += 1;
  });

  const totalPerSupervisor: Record<string, number> = {};
  Object.values(advisorMap).forEach((advisor) => {
    totalPerSupervisor[advisor.supervisor] = (totalPerSupervisor[advisor.supervisor] || 0) + 1;
  });

  const supervisores: SupervisorSummary[] = Object.entries(supervisorAccumulator)
    .map(([supervisor, values]) => ({
      supervisor,
      reincidentes: values.reincidentes,
      causalesPromedio: Math.round((values.causalesSum / values.reincidentes) * 10) / 10,
      conAntifraude: values.conAf,
      totalMonAfectaciones: values.totalMonAfectaciones,
      totalAsesores: totalPerSupervisor[supervisor] || 0,
      porcentajeEquipo: Math.round((values.reincidentes / Math.max(totalPerSupervisor[supervisor] || 1, 1)) * 1000) / 10,
    }))
    .sort((left, right) => right.reincidentes - left.reincidentes || left.supervisor.localeCompare(right.supervisor));

  const noReincidentesSoul = Object.entries(advisorMap)
    .filter(([cedula]) => !soulReincidentesSet.has(cedula))
    .map(([, advisor]) => ({ speech: advisor.speech }));
  const sinAf = Object.entries(advisorMap)
    .filter(([cedula]) => !afMap[cedula])
    .map(([, advisor]) => ({ speech: advisor.speech }));

  const speechStats = {
    reincidentesSoul: {
      enojado: computeGroupAverage(soulAdvisors, 'enojado'),
      negativo: computeGroupAverage(soulAdvisors, 'negativo'),
      fin: computeGroupAverage(soulAdvisors, 'fin'),
    } satisfies GroupSpeechAverages,
    noReincidentesSoul: {
      enojado: computeGroupAverage(noReincidentesSoul, 'enojado'),
      negativo: computeGroupAverage(noReincidentesSoul, 'negativo'),
      fin: computeGroupAverage(noReincidentesSoul, 'fin'),
    } satisfies GroupSpeechAverages,
    conAf: {
      enojado: computeGroupAverage(afAdvisors, 'enojado'),
      negativo: computeGroupAverage(afAdvisors, 'negativo'),
      fin: computeGroupAverage(afAdvisors, 'fin'),
    } satisfies GroupSpeechAverages,
    sinAf: {
      enojado: computeGroupAverage(sinAf, 'enojado'),
      negativo: computeGroupAverage(sinAf, 'negativo'),
      fin: computeGroupAverage(sinAf, 'fin'),
    } satisfies GroupSpeechAverages,
    topEnojado: Object.entries(advisorMap)
      .filter(([, advisor]) => advisor.speech?.enojado !== null && advisor.speech?.enojado !== undefined)
      .map(([cedula, advisor]) => ({
        cedula,
        nombre: advisor.nombre,
        supervisor: advisor.supervisor,
        speech: advisor.speech as SpeechMetrics,
        isReincidenteSoul: soulReincidentesSet.has(cedula),
        inAf: Boolean(afMap[cedula]),
      }))
      .sort((left, right) => (right.speech.enojado || 0) - (left.speech.enojado || 0))
      .slice(0, 10),
  };

  const allMeses = Array.from(
    new Set([
      ...soulRows.map((row) => cleanMonth(getValue(row, ['Mes']))),
      ...antiRows.map((row) => cleanMonth(getValue(row, ['Mes']))),
    ].filter((month) => month && month !== '—')),
  ).sort((left, right) => monthSortKey(left) - monthSortKey(right));

  const supervisoresList = Array.from(
    new Set(Object.values(advisorMap).map((advisor) => advisor.supervisor).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));

  const totalMonitoreos = new Set(
    soulRows
      .map((row) => normalizeText(getValue(row, ['ID Mios Consecutivo Único De Auditoría', 'ID', 'Id'])))
      .filter(Boolean),
  ).size;

  const kpis: ReportKpis = {
    totalAsesores: Object.keys(advisorMap).length,
    asesoresConCriticos: Object.keys(monWithCriticos).length,
    reincidentesCriticos: soulAdvisors.length,
    totalAf: Object.keys(afMap).length,
    reincidentesAf: reincidentesAfSet.size,
    coincidencias: soulAdvisors.filter((advisor) => advisor.coincidencia).length,
    totalMonitoreos,
    causalesUnicas: paretoSoul.length,
    spConDatos: soulAdvisors.filter((advisor) => advisor.speech).length,
    spTotal: Object.keys(speechMap).length,
    hasSpeech: speechRows.length > 0,
    mesesLabel: allMeses.join(', '),
  };

  return {
    kpis,
    soulAdvisors,
    paretoSoul,
    paretoAf,
    reincidentesAf,
    afAdvisors,
    supervisores,
    supervisoresList,
    meses: allMeses,
    speechStats,
  };
}
