'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { FilterBar } from '@reincidentes/components/ui/FilterBar';
import { defaultAntiguedad, getActiveCausales, getActiveReincidentes, getAsesorEventCount, getRankClass, matchesAsesorFilters } from '@reincidentes/lib/filterUtils';
import { useReportStore } from '@reincidentes/store/reportStore';
import { PerfilAntiguedad, ReportFilters } from '@reincidentes/types';

const antiguedadOptions: { value: PerfilAntiguedad; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo (<3 m)' },
  { value: 'formacion', label: 'En Formacion (3-6 m)' },
  { value: 'intermedio', label: 'Intermedio (6-12 m)' },
  { value: 'veterano', label: 'Veterano (>1 ano)' },
];

function getCalColor(value: number) {
  if (value < 35) return '#e35b5b';
  if (value < 55) return '#d96f6f';
  if (value < 70) return '#64748b';
  return '#0f172a';
}

export const AsesoresTab: React.FC = () => {
  const { data, tipoActivo } = useReportStore();
  const [filters, setFilters] = useState<ReportFilters>({ meses: [], sups: [], ants: [], sr: '' });

  useEffect(() => {
    if (!data) return;
    setFilters({ meses: data.allMeses, sups: data.supervisores, ants: [...defaultAntiguedad], sr: '' });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return getActiveReincidentes(data, tipoActivo).filter((asesor) => matchesAsesorFilters(asesor, filters));
  }, [data, filters, tipoActivo]);

  if (!data) return null;

  return (
    <div>
      <div className="rri-section-heading">
        <h2 className="rri-section-title">
          <ListChecks className="rri-section-icon" aria-hidden="true" />
          Asesores Reincidentes
        </h2>
        <p className="rri-section-copy">Misma causal en dos o mas monitoreos distintos del mismo asesor</p>
      </div>

      <FilterBar
        meses={data.allMeses.map((month) => ({ value: month, label: data.mesLabels[month] }))}
        selectedMeses={filters.meses}
        onMesesChange={(meses) => setFilters((current) => ({ ...current, meses }))}
        supervisores={data.supervisores.map((supervisor) => ({ value: supervisor, label: supervisor }))}
        selectedSupervisores={filters.sups}
        onSupervisoresChange={(sups) => setFilters((current) => ({ ...current, sups }))}
        antiguedades={antiguedadOptions}
        selectedAntiguedades={filters.ants}
        onAntiguedadesChange={(ants) => setFilters((current) => ({ ...current, ants }))}
        searchValue={filters.sr}
        onSearchChange={(sr) => setFilters((current) => ({ ...current, sr }))}
        searchPlaceholder="Nombre o cedula..."
        countLabel="reincidentes"
        countValue={filtered.length}
        onReset={() =>
          setFilters({ meses: data.allMeses, sups: data.supervisores, ants: [...defaultAntiguedad], sr: '' })
        }
      />

      <div className="table-shell rri-table-scroll">
        <table className="rri-table-min-1020">
          <thead>
            <tr>
              <th>#</th>
              <th>Cedula</th>
              <th>Asesor</th>
              <th>Supervisor</th>
              <th>Antiguedad</th>
              <th>Monitoreos</th>
              <th>Reincidencias</th>
              <th>Cal. Prom.</th>
              <th style={{ minWidth: 320 }}>Causales Reincidentes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((asesor, index) => {
                const causales = getActiveCausales(asesor, tipoActivo).filter(
                  (causal) => !filters.meses.length || filters.meses.some((month) => causal.meses.includes(month)),
                );
                const eventos = getAsesorEventCount(asesor, tipoActivo, filters.meses);
                const calColor = getCalColor(asesor.cal);

                return (
                  <tr key={asesor.doc} className={index === 0 ? 'r1' : index === 1 ? 'r2' : index === 2 ? 'r3' : ''}>
                    <td>
                      <span className={`rank-badge ${index >= 3 ? 'rri-rank-badge-fallback' : getRankClass(index)}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="rri-doc-cell">{asesor.doc}</td>
                    <td><strong>{asesor.nombre}</strong></td>
                    <td><span className="badge badge-neutral">{asesor.supervisor}</span></td>
                    <td>
                      <div className="rri-profile-meta">{asesor.perfilLbl}</div>
                      <div className="rri-profile-days">{asesor.antiguedad} dias</div>
                    </td>
                    <td className="rri-center-strong">{asesor.mon}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${eventos >= 10 ? 'badge-danger' : eventos >= 5 ? 'badge-warn' : 'badge-info'}`}>{eventos}</span>
                    </td>
                    <td>
                      <div className="rri-score-row">
                        <div className="rri-score-track">
                          <div className="rri-score-fill" style={{ width: `${asesor.cal}%`, background: calColor }} />
                        </div>
                        <span className="rri-score-value" style={{ color: calColor }}>
                          {asesor.cal}%
                        </span>
                      </div>
                    </td>
                    <td className="rri-causal-tags">
                      {causales.length ? (
                        causales.map((causal) => (
                          <span key={`${asesor.doc}-${causal.c}`} className="rri-causal-tag">
                            {causal.c} <strong className="rri-causal-tag-count">({causal.n} mon.)</strong>
                          </span>
                        ))
                      ) : (
                        <span className="rri-inline-empty">Sin causales en el periodo</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="no-rows">
                <td colSpan={9}>Sin datos para los filtros seleccionados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
