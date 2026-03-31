export type UploadKey = 'soul' | 'anti' | 'speech';
export type ScreenState = 'upload' | 'progress' | 'report';
export type SectionId = 'resumen' | 'soul' | 'pareto' | 'antifraude' | 'supervisores' | 'analisis';

export interface RawRow {
  [key: string]: unknown;
}

export interface UploadFiles {
  soul: File | null;
  anti: File | null;
  speech: File | null;
}

export interface ProgressState {
  value: number;
  message: string;
}

export interface SpeechMetrics {
  enojado: number | null;
  negativo: number | null;
  fin: number | null;
  interactions: number;
}

export interface SoulCausalDetail {
  causal: string;
  mon: number;
}

export interface SoulAdvisor {
  cedula: string;
  nombre: string;
  supervisor: string;
  antCat: string;
  antMonths: number;
  totalMon: number;
  monCriticos: number;
  numCausales: number;
  totalMonAfectaciones: number;
  causales: SoulCausalDetail[];
  meses: string[];
  speech: SpeechMetrics | null;
  malasPracticas: string;
  totalRegAf: number;
  coincidencia: boolean;
}

export interface AFRecord {
  tipo: string;
  descripcion: string;
  observacion: string;
  fecha: string;
  idLlamada: string;
}

export interface AFReincidente {
  cedula: string;
  nombre: string;
  supervisor: string;
  antiguedad: string;
  tipo: string;
  numRegistros: number;
  registros: AFRecord[];
  speech: SpeechMetrics | null;
}

export interface AFAdvisor {
  cedula: string;
  nombre: string;
  supervisor: string;
  antiguedad: string;
  tipos: string;
  totalReg: number;
  esReincidenteAf: boolean;
  esReincidenteSoul: boolean;
  registros: AFRecord[];
  speech: SpeechMetrics | null;
}

export interface ParetoSoulItem {
  causal: string;
  asesores: number;
  monitoreos: number;
  porcentaje: number;
  porcentajeAcumulado: number;
}

export interface ParetoAFItem {
  tipo: string;
  asesores: number;
  registros: number;
  porcentaje: number;
  porcentajeAcumulado: number;
}

export interface SupervisorSummary {
  supervisor: string;
  reincidentes: number;
  causalesPromedio: number;
  conAntifraude: number;
  totalMonAfectaciones: number;
  totalAsesores: number;
  porcentajeEquipo: number;
}

export interface GroupSpeechAverages {
  enojado: number | null;
  negativo: number | null;
  fin: number | null;
}

export interface SpeechStats {
  reincidentesSoul: GroupSpeechAverages;
  noReincidentesSoul: GroupSpeechAverages;
  conAf: GroupSpeechAverages;
  sinAf: GroupSpeechAverages;
  topEnojado: Array<{
    cedula: string;
    nombre: string;
    supervisor: string;
    speech: SpeechMetrics;
    isReincidenteSoul: boolean;
    inAf: boolean;
  }>;
}

export interface ReportKpis {
  totalAsesores: number;
  asesoresConCriticos: number;
  reincidentesCriticos: number;
  totalAf: number;
  reincidentesAf: number;
  coincidencias: number;
  totalMonitoreos: number;
  causalesUnicas: number;
  spConDatos: number;
  spTotal: number;
  hasSpeech: boolean;
  mesesLabel: string;
}

export interface ProcessedReport {
  kpis: ReportKpis;
  soulAdvisors: SoulAdvisor[];
  paretoSoul: ParetoSoulItem[];
  paretoAf: ParetoAFItem[];
  reincidentesAf: AFReincidente[];
  afAdvisors: AFAdvisor[];
  supervisores: SupervisorSummary[];
  supervisoresList: string[];
  meses: string[];
  speechStats: SpeechStats;
}

export interface FilterState {
  sup: Set<string>;
  mes: Set<string>;
  fue: Set<string>;
  ant: Set<string>;
  query: string;
}

export interface UploadValidation {
  valid: boolean;
  message: string;
}
