import { AsesorCorrelacion, CorrelacionFilters } from '@correlaciones/types';

export function matchesFilters(a: AsesorCorrelacion, f: CorrelacionFilters): boolean {
  if (f.sups.length > 0 && !f.sups.includes(a.supervisor)) return false;
  if (f.cuartiles.length > 0 && !f.cuartiles.includes(a.cuartil)) return false;
  if (f.sr) {
    const q = f.sr.toLowerCase();
    if (!a.nombre.toLowerCase().includes(q) && !a.doc.toLowerCase().includes(q)) return false;
  }
  return true;
}
