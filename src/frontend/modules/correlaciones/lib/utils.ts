export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function formatShortName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function cuartilLabel(q: 1 | 2 | 3 | 4): string {
  const map: Record<number, string> = { 1: 'Bajo', 2: 'Medio-Bajo', 3: 'Medio-Alto', 4: 'Alto' };
  return map[q];
}

export function cuartilColor(q: 1 | 2 | 3 | 4): string {
  const map: Record<number, string> = {
    1: '#e35b5b',
    2: '#f59e0b',
    3: '#3b82f6',
    4: '#10b981',
  };
  return map[q];
}

export function cuartilBg(q: 1 | 2 | 3 | 4): string {
  const map: Record<number, string> = {
    1: 'rgba(227, 91, 91, 0.12)',
    2: 'rgba(245, 158, 11, 0.12)',
    3: 'rgba(59, 130, 246, 0.12)',
    4: 'rgba(16, 185, 129, 0.12)',
  };
  return map[q];
}
