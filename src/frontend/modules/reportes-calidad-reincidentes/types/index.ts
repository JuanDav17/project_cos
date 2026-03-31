export interface RawRow {
  [key: string]: unknown;
}

export interface Meta {
  empresa: string;
  campana: string;
  archivo: string;
}

export interface Causal {
  c: string;
  n: number;
  cat: string;
  meses: string[];
  tipo: 'critico' | 'no_critico';
}

export type PerfilAntiguedad = 'nuevo' | 'formacion' | 'intermedio' | 'veterano';
export type TipoError = 'all' | 'critico' | 'no_critico';

export interface Asesor {
  doc: string;
  nombre: string;
  supervisor: string;
  antiguedad: number;
  perfil: PerfilAntiguedad;
  perfilLbl: string;
  mon: number;
  meses: string[];
  cal: number;
  causales: Causal[];
  causalesNC: Causal[];
  causalesAll: Causal[];
  total_reinc: number;
  total_reinc_nc: number;
}

export interface SupervisorRaw {
  asesores: number;
  mon: number;
  reincData: Asesor[];
  reincDataNC: Asesor[];
}

export interface ReportData {
  meta: Meta;
  asesores: Asesor[];
  reincidentes: Asesor[];
  reincidentesCrit: Asesor[];
  reincidentesNC: Asesor[];
  reincidentesAll: Asesor[];
  supRaw: Record<string, SupervisorRaw>;
  allMeses: string[];
  mesLabels: Record<string, string>;
  supervisores: string[];
  totalMon: number;
  totalAsesores: number;
}

export interface ReportFilters {
  meses: string[];
  sups: string[];
  ants: PerfilAntiguedad[];
  sr: string;
}

export interface SupervisorSummary {
  s: string;
  asesores: number;
  mon: number;
  reinc: number;
  eventos: number;
  pct: number;
  tasa: number;
  color: string;
  data: Asesor[];
}

export interface CausalSummary {
  c: string;
  n: number;
  cat: string;
  pct: number;
  acum: number;
  asesores: string[];
}
