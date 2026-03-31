'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { FilterBar } from '@correlaciones/components/ui/FilterBar';
import { useCorrelacionStore } from '@correlaciones/store/correlacionStore';
import { matchesFilters } from '@correlaciones/lib/filterUtils';
import { classNames, formatPct, formatScore, cuartilColor, cuartilBg, cuartilLabel } from '@correlaciones/lib/utils';
import { CorrelacionFilters } from '@correlaciones/types';

const cuartilOptions = [
  { value: '1', label: 'Bajo' },
  { value: '2', label: 'Medio-Bajo' },
  { value: '3', label: 'Medio-Alto' },
  { value: '4', label: 'Alto' },
];

export const DetalleAsesorTab: React.FC = () => {
  const { data } = useCorrelacionStore();
  const [filters, setFilters] = useState<CorrelacionFilters>({ sups: [], cuartiles: [], sr: '' });

  useEffect(() => {
    if (!data) return;
    setFilters({ sups: data.supervisores, cuartiles: [1, 2, 3, 4], sr: '' });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.asesores.filter((a) =>
      matchesFilters(a, {
        ...filters,
        cuartiles: filters.cuartiles.length > 0 ? filters.cuartiles : [1, 2, 3, 4],
      }),
    );
  }, [data, filters]);

  if (!data) return null;

  return (
    <div>
      <div className="cor-section-heading">
        <h2 className="cor-section-title">
          <Users className="cor-section-icon" aria-hidden="true" />
          Detalle por Asesor
        </h2>
        <p className="cor-section-copy">
          Indicadores de las 5 dimensiones con ponderacion global
        </p>
      </div>

      <FilterBar
        supervisores={data.supervisores.map((s) => ({ value: s, label: s }))}
        selectedSupervisores={filters.sups}
        onSupervisoresChange={(sups) => setFilters((f) => ({ ...f, sups }))}
        cuartiles={cuartilOptions}
        selectedCuartiles={filters.cuartiles.map(String)}
        onCuartilesChange={(v) => setFilters((f) => ({ ...f, cuartiles: v.map(Number) }))}
        searchValue={filters.sr}
        onSearchChange={(sr) => setFilters((f) => ({ ...f, sr }))}
        searchPlaceholder="Nombre o documento..."
        countLabel="asesores"
        countValue={filtered.length}
        onReset={() => setFilters({ sups: data.supervisores, cuartiles: [1, 2, 3, 4], sr: '' })}
      />

      <div className="table-shell" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Documento</th>
              <th>Asesor</th>
              <th>Supervisor</th>
              <th>Score Global</th>
              <th>Cuartil</th>
              <th>Efectividad</th>
              <th>Calidad Aud.</th>
              <th>Monitoreos</th>
              <th>% No Cumple</th>
              <th>NPS</th>
              <th>FCR</th>
              <th>Malas Pract.</th>
              <th>% Sent. Neg.</th>
              <th>Alertas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((a, i) => (
                <tr key={a.doc} className={a.dimensionesAlerta.length >= 3 ? 'cor-row-alert' : ''}>
                  <td>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.doc}</td>
                  <td><strong>{a.nombre}</strong></td>
                  <td>{a.supervisor}</td>
                  <td>
                    <div className="cor-score-cell">
                      <div className="cor-score-bar" style={{ width: `${Math.min(100, a.scoreGlobal)}%`, background: cuartilColor(a.cuartil) }} />
                      <span className="cor-score-value">{formatScore(a.scoreGlobal)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cor-cuartil-badge" style={{ background: cuartilBg(a.cuartil), color: cuartilColor(a.cuartil) }}>
                      {cuartilLabel(a.cuartil)}
                    </span>
                  </td>
                  <td className={a.efecPctEfectividad > 0 ? '' : 'cor-cell-empty'}>{a.efecPctEfectividad > 0 ? formatPct(a.efecPctEfectividad) : '-'}</td>
                  <td className={a.audCalificacionProm > 0 ? '' : 'cor-cell-empty'}>{a.audCalificacionProm > 0 ? formatScore(a.audCalificacionProm) : '-'}</td>
                  <td>{a.audMonitoreos || '-'}</td>
                  <td className={classNames(a.audPctNoCumple > 20 && 'cor-cell-warn')}>{a.audTotalItems > 0 ? formatPct(a.audPctNoCumple) : '-'}</td>
                  <td>{a.nps !== 0 ? a.nps.toFixed(3) : '-'}</td>
                  <td>{a.fcr > 0 ? formatPct(a.fcr * 100) : '-'}</td>
                  <td className={classNames(a.antifMalaPracticas > 0 && 'cor-cell-danger')}>
                    {a.antifMalaPracticas > 0 ? (
                      <span className="badge badge-danger">{a.antifMalaPracticas}</span>
                    ) : (
                      <span className="badge badge-ok">0</span>
                    )}
                  </td>
                  <td className={classNames(a.vozFinEmoNeg > 30 && 'cor-cell-warn')}>{a.vozTotalLlamadas > 0 ? formatPct(a.vozFinEmoNeg) : '-'}</td>
                  <td>
                    {a.dimensionesAlerta.length > 0 ? (
                      <span className="badge badge-danger" title={a.dimensionesAlerta.join(', ')}>{a.dimensionesAlerta.length}</span>
                    ) : (
                      <span className="badge badge-ok">0</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-rows">
                <td colSpan={15}>Sin datos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
