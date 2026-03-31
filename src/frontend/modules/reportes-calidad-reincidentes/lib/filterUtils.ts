import { Asesor, CausalSummary, ReportData, ReportFilters, SupervisorSummary, TipoError } from '@reincidentes/types';
import { formatShortName } from './utils';

const supervisorColors = [
  'rgba(15, 23, 42, 0.92)',
  'rgba(227, 91, 91, 0.9)',
  'rgba(15, 23, 42, 0.78)',
  'rgba(243, 167, 167, 0.95)',
  'rgba(15, 23, 42, 0.6)',
  'rgba(227, 91, 91, 0.68)',
];

export const defaultAntiguedad = ['nuevo', 'formacion', 'intermedio', 'veterano'] as const;

export function getActiveReincidentes(data: ReportData, tipo: TipoError): Asesor[] {
  if (tipo === 'critico') return data.reincidentesCrit;
  if (tipo === 'no_critico') return data.reincidentesNC;
  return data.reincidentesAll;
}

export function getActiveCausales(asesor: Asesor, tipo: TipoError) {
  if (tipo === 'critico') return asesor.causales;
  if (tipo === 'no_critico') return asesor.causalesNC;
  return asesor.causalesAll;
}

export function getActiveReinc(asesor: Asesor, tipo: TipoError): number {
  if (tipo === 'critico') return asesor.total_reinc;
  if (tipo === 'no_critico') return asesor.total_reinc_nc;
  return asesor.total_reinc + asesor.total_reinc_nc;
}

export function matchesAsesorFilters(asesor: Asesor, filters: ReportFilters): boolean {
  const search = filters.sr.trim().toLowerCase();

  if (filters.meses.length && !filters.meses.some((month) => asesor.meses.includes(month))) return false;
  if (filters.sups.length && !filters.sups.includes(asesor.supervisor)) return false;
  if (filters.ants.length && !filters.ants.includes(asesor.perfil)) return false;
  if (search && !asesor.nombre.toLowerCase().includes(search) && !asesor.doc.includes(search)) return false;

  return true;
}

export function getAsesorEventCount(asesor: Asesor, tipo: TipoError, meses: string[] = []): number {
  return getActiveCausales(asesor, tipo)
    .filter((causal) => !meses.length || meses.some((month) => causal.meses.includes(month)))
    .reduce((sum, causal) => sum + causal.n, 0);
}

export function buildCausalesSummary(
  data: ReportData,
  tipo: TipoError,
  filters: ReportFilters,
): CausalSummary[] {
  const causalTotals: Record<string, number> = {};
  const causalAgents: Record<string, Set<string>> = {};
  const causalCategory: Record<string, string> = {};
  const search = filters.sr.trim().toLowerCase();

  getActiveReincidentes(data, tipo)
    .filter((asesor) => matchesAsesorFilters(asesor, filters))
    .forEach((asesor) => {
      getActiveCausales(asesor, tipo)
        .filter((causal) => {
          const monthOk = !filters.meses.length || filters.meses.some((month) => causal.meses.includes(month));
          const searchOk = !search || causal.c.toLowerCase().includes(search);
          return monthOk && searchOk;
        })
        .forEach((causal) => {
          causalTotals[causal.c] = (causalTotals[causal.c] || 0) + causal.n;
          causalCategory[causal.c] = causal.cat;
          causalAgents[causal.c] ??= new Set<string>();
          causalAgents[causal.c].add(asesor.nombre);
        });
    });

  const sorted = Object.entries(causalTotals).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  let acumulado = 0;

  return sorted.map(([causal, count]) => {
    acumulado += count;
    return {
      c: causal,
      n: count,
      cat: causalCategory[causal],
      pct: total ? Math.round((count / total) * 1000) / 10 : 0,
      acum: total ? Math.round((acumulado / total) * 1000) / 10 : 0,
      asesores: [...(causalAgents[causal] ?? [])],
    };
  });
}

export function buildSupervisorSummary(data: ReportData, tipo: TipoError, meses: string[], selectedSups: string[]): SupervisorSummary[] {
  const supList = Object.keys(data.supRaw).filter((sup) => !selectedSups.length || selectedSups.includes(sup));

  return supList
    .map((supervisor, index) => {
      const raw = data.supRaw[supervisor];
      const activeData =
        tipo === 'critico'
          ? raw.reincData
          : tipo === 'no_critico'
            ? raw.reincDataNC
            : [...new Map([...raw.reincData, ...raw.reincDataNC].map((asesor) => [asesor.doc, asesor])).values()];

      let reinc = 0;
      let eventos = 0;
      activeData.forEach((asesor) => {
        const asesorEventos = getAsesorEventCount(asesor, tipo, meses);
        if (asesorEventos > 0) {
          reinc += 1;
          eventos += asesorEventos;
        }
      });

      const pct = raw.asesores ? Math.round((reinc / raw.asesores) * 1000) / 10 : 0;
      const tasa = raw.mon ? Math.round((eventos / raw.mon) * 1000) / 10 : 0;

      return {
        s: supervisor,
        asesores: raw.asesores,
        mon: raw.mon,
        reinc,
        eventos,
        pct,
        tasa,
        color: supervisorColors[index % supervisorColors.length],
        data: activeData,
      };
    })
    .sort((a, b) => b.eventos - a.eventos);
}

export function buildTopCausalesByAsesor(asesores: Asesor[], tipo: TipoError, meses: string[]) {
  const totals: Record<string, number> = {};
  const agents: Record<string, Set<string>> = {};

  asesores.forEach((asesor) => {
    getActiveCausales(asesor, tipo)
      .filter((causal) => !meses.length || meses.some((month) => causal.meses.includes(month)))
      .forEach((causal) => {
        totals[causal.c] = (totals[causal.c] || 0) + causal.n;
        agents[causal.c] ??= new Set<string>();
        agents[causal.c].add(asesor.nombre);
      });
  });

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([causal, count]) => ({ causal, count, asesores: agents[causal] ? [...agents[causal]] : [] }));
}

export function getRankClass(index: number): string {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return '';
}

export function formatSupervisorLabel(supervisor: string): string {
  return formatShortName(supervisor);
}
