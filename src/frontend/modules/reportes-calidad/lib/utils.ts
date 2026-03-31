import { RawRow, SpeechMetrics } from '@quality/types/report';

export const MONTH_ORDER = [
  'Noviembre',
  'Diciembre',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
] as const;

export const FILTER_OPTIONS = {
  fue: ['Solo SOUL crítico', 'Con Antifraude', 'Coincidencia ambas'],
  ant: ['< 3 meses', '3-6 meses', '7-12 meses', '1-2 años', '> 2 años'],
} as const;

export const FILTER_LABELS: Record<'sup' | 'mes' | 'fue' | 'ant', string> = {
  sup: 'Supervisor',
  mes: 'Mes',
  fue: 'Fuente',
  ant: 'Antigüedad',
};

export const FILTER_ICONS: Record<'sup' | 'mes' | 'fue' | 'ant', string> = {
  sup: "<i class='bi bi-person'></i> Supervisor",
  mes: "<i class='bi bi-calendar3'></i> Mes",
  fue: "<i class='bi bi-folder2-open'></i> Fuente",
  ant: "<i class='bi bi-hourglass-split'></i> Antigüedad",
};

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function titleCase(value: unknown): string {
  const text = normalizeText(value);
  if (!text) return '';
  return text.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
}

export function trimRowKeys(row: RawRow): RawRow {
  const clean: RawRow = {};
  Object.keys(row).forEach((key) => {
    clean[key.trim()] = row[key];
  });
  return clean;
}

export function cleanMonth(value: unknown): string {
  const raw = normalizeText(value);
  if (!raw) return '—';
  return raw.replace(/^\d+\.\s*/, '').trim();
}

export function monthSortKey(month: string): number {
  const index = MONTH_ORDER.indexOf(month as (typeof MONTH_ORDER)[number]);
  return index === -1 ? 99 : index;
}

export function parsePercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value).replace('%', '').replace(',', '.').trim());
  if (Number.isNaN(parsed)) return null;
  return parsed > 1 ? parsed : parsed * 100;
}

export function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const iso = `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: unknown): string {
  const date = parseExcelDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function antiguedadCategoria(months: number): string {
  if (months <= 3) return '< 3 meses';
  if (months <= 6) return '3-6 meses';
  if (months <= 12) return '7-12 meses';
  if (months <= 24) return '1-2 años';
  return '> 2 años';
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/D';
  return `${value.toFixed(1)}%`;
}

export function hasSpeechData(speech: SpeechMetrics | null): boolean {
  return Boolean(
    speech && (speech.enojado !== null || speech.negativo !== null || speech.fin !== null),
  );
}

export function escapeId(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '_');
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
