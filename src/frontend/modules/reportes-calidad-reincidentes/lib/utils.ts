import { PerfilAntiguedad } from '@reincidentes/types';

export function normalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const asString = String(value).trim();
  if (!asString) return null;

  const normalized = asString.includes('/')
    ? asString.split('/').length === 3
      ? (() => {
          const [a, b, c] = asString.split('/');
          return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
        })()
      : asString
    : asString;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function perfilKey(dias: number): PerfilAntiguedad {
  if (dias < 90) return 'nuevo';
  if (dias < 180) return 'formacion';
  if (dias < 365) return 'intermedio';
  return 'veterano';
}

export function perfilLbl(key: PerfilAntiguedad): string {
  const map: Record<PerfilAntiguedad, string> = {
    nuevo: 'Nuevo (< 3 meses)',
    formacion: 'En formación (3-6 m)',
    intermedio: 'Intermedio (6-12 m)',
    veterano: 'Veterano (> 1 año)',
  };
  return map[key];
}

export function detectCat(causal: string): string {
  const cu = causal.toLowerCase();
  if (
    cu.includes('pecuf') ||
    cu.includes('cierre') ||
    cu.includes('chat') ||
    cu.includes('salud') ||
    cu.includes('respuesta') ||
    cu.includes('tiempo') ||
    cu.includes('abandono') ||
    cu.includes('transferencia') ||
    cu.includes('escal')
  ) {
    return 'PECUF';
  }
  if (
    cu.includes('pecn') ||
    cu.includes('suma') ||
    cu.includes('tipifi') ||
    cu.includes('aplicat') ||
    cu.includes('imputab') ||
    cu.includes('solicit') ||
    cu.includes('política') ||
    cu.includes('politica') ||
    cu.includes('tipolog') ||
    cu.includes('ortograf') ||
    cu.includes('encuesta') ||
    cu.includes('retenc') ||
    cu.includes('cita')
  ) {
    return 'PECN';
  }
  if (
    cu.includes('pecc') ||
    cu.includes('legal') ||
    cu.includes('habeas') ||
    cu.includes('confiden') ||
    cu.includes('suplant') ||
    cu.includes('ley 2300') ||
    cu.includes('pqr') ||
    cu.includes('cun')
  ) {
    return 'PECC';
  }
  return 'PECN';
}

export function formatShortName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
