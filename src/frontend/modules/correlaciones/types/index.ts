export interface RawRow {
  [key: string]: unknown;
}

export interface AsesorCorrelacion {
  doc: string;
  nombre: string;
  supervisor: string;
  // Dimension Auditorias
  audCalificacionProm: number;
  audMonitoreos: number;
  audItemsNoCumple: number;
  audTotalItems: number;
  audPctNoCumple: number;
  audCriticosEnCero: number;
  // Dimension Antifraude
  antifMalaPracticas: number;
  antifTipos: Record<string, number>;
  // Dimension Efectividad
  efecRetenidos: number;
  efecIntenciones: number;
  efecPctEfectividad: number;
  // Dimension Voz Cliente
  vozDistribucion: Record<string, number>;
  vozTotalLlamadas: number;
  vozFinEmoNeg: number;
  // Dimension NPS/FCR
  nps: number;
  fcr: number;
  // Score ponderado global
  scoreGlobal: number;
  cuartil: 1 | 2 | 3 | 4;
  // Dimensiones en alerta (Q1 por dimension)
  dimensionesAlerta: string[];
}

export interface Promedios {
  calidad: number;
  efectividad: number;
  nps: number;
  fcr: number;
  antifraude: number;
  vozNeg: number;
}

export interface CorrelacionData {
  asesores: AsesorCorrelacion[];
  supervisores: string[];
  promedios: Promedios;
  reincidentes: AsesorCorrelacion[];
  totalAsesores: number;
  totalConAuditorias: number;
  totalConEfectividad: number;
  totalConNps: number;
  totalConAntifraude: number;
  totalConVoz: number;
}

export interface CorrelacionFilters {
  sups: string[];
  cuartiles: number[];
  sr: string;
}
