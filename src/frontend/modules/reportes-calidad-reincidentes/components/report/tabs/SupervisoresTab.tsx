'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ChartNoAxesCombined, UsersRound } from 'lucide-react';
import { ChartComponent } from '@reincidentes/components/ui/Chart';
import { FilterBar } from '@reincidentes/components/ui/FilterBar';
import { KpiCard } from '@reincidentes/components/ui/KpiCard';
import { labelPluginHorizontal, labelPluginPercentage, labelPluginVertical } from '@reincidentes/components/ui/chartPlugins';
import { buildSupervisorSummary, defaultAntiguedad, getActiveCausales, getAsesorEventCount, getRankClass } from '@reincidentes/lib/filterUtils';
import { useReportStore } from '@reincidentes/store/reportStore';
import { ReportFilters } from '@reincidentes/types';

export const SupervisoresTab: React.FC = () => {
  const { data, tipoActivo } = useReportStore();
  const [filters, setFilters] = useState<ReportFilters>({ meses: [], sups: [], ants: [], sr: '' });

  useEffect(() => {
    if (!data) return;
    setFilters({ meses: data.allMeses, sups: data.supervisores, ants: [...defaultAntiguedad], sr: '' });
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    return buildSupervisorSummary(data, tipoActivo, filters.meses, filters.sups);
  }, [data, tipoActivo, filters.meses, filters.sups]);

  if (!data) return null;

  const conReinc = rows.filter((row) => row.reinc > 0).length;
  const totalAs = rows.reduce((sum, row) => sum + row.asesores, 0);
  const totalReinc = rows.reduce((sum, row) => sum + row.reinc, 0);
  const maxPct = rows.reduce((best, row) => (row.pct > best.pct ? row : best), { pct: 0, s: '--' } as (typeof rows)[number] | { pct: number; s: string });

  const labels = rows.map((row) => {
    const parts = row.s.split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : row.s;
  });

  const eventChartData = {
    labels,
    datasets: [
      {
        label: 'Eventos',
        data: rows.map((row) => row.eventos),
        backgroundColor: rows.map((row) => row.color),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const pctChartData = {
    labels: rows.map((row) => row.s.split(' ')[0]),
    datasets: [
      {
        label: '% Reincidentes',
        data: rows.map((row) => row.pct),
        backgroundColor: rows.map((row) => row.color),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const compareChartData = {
    labels: rows.map((row) => row.s.split(' ')[0]),
    datasets: [
      {
        label: 'Total Asesores',
        data: rows.map((row) => row.asesores),
        backgroundColor: 'rgba(15, 23, 42, 0.18)',
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Reincidentes',
        data: rows.map((row) => row.reinc),
        backgroundColor: 'rgba(227, 91, 91, 0.82)',
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };

  const detailRows = rows.flatMap((row) =>
    row.data
      .map((asesor) => {
        const causales = getActiveCausales(asesor, tipoActivo).filter(
          (causal) => !filters.meses.length || filters.meses.some((month) => causal.meses.includes(month)),
        );
        if (!causales.length) return null;
        return { row, asesor, causales };
      })
      .filter(Boolean) as Array<{ row: (typeof rows)[number]; asesor: (typeof row.data)[number]; causales: ReturnType<typeof getActiveCausales> }>,
  );

  return (
    <div>
      <div className="rri-section-heading">
        <h2 className="rri-section-title">
          <ChartNoAxesCombined className="rri-section-icon" aria-hidden="true" />
          Analisis por Supervisor
        </h2>
        <p className="rri-section-copy">Distribucion de reincidencias, monitoreos y asesores por supervisor directo</p>
      </div>

      <FilterBar
        meses={data.allMeses.map((month) => ({ value: month, label: data.mesLabels[month] }))}
        selectedMeses={filters.meses}
        onMesesChange={(meses) => setFilters((current) => ({ ...current, meses }))}
        supervisores={data.supervisores.map((supervisor) => ({ value: supervisor, label: supervisor }))}
        selectedSupervisores={filters.sups}
        onSupervisoresChange={(sups) => setFilters((current) => ({ ...current, sups }))}
        countLabel="supervisores"
        countValue={rows.length}
        onReset={() => setFilters({ meses: data.allMeses, sups: data.supervisores, ants: [...defaultAntiguedad], sr: '' })}
      />

      <div className="rri-grid-4" style={{ marginBottom: 24 }}>
        <KpiCard title="Supervisores con Reincidentes" value={conReinc} subtitle="Del total en la BBDD" tone="base" icon={UsersRound} />
        <KpiCard title="Total Asesores" value={totalAs} subtitle="Bajo supervision directa" tone="alt1" icon={BarChart3} />
        <KpiCard title="Total Reincidentes" value={totalReinc} subtitle="Asesores con reincidencia" tone="alt2" icon={Activity} />
        <KpiCard title="Mayor Tasa" value={`${maxPct.pct}%`} subtitle={maxPct.s} tone="alt3" icon={ChartNoAxesCombined} />
      </div>

      <div className="rri-grid-2" style={{ marginBottom: 20 }}>
        <div className="rri-panel">
          <div className="rri-panel-title">Eventos de Reincidencia por Supervisor</div>
          <div className="rri-chart-area-240">
            <ChartComponent
              type="bar"
              data={eventChartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 42 } },
                scales: { x: { display: false }, y: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11, weight: 600 } } } },
                plugins: { legend: { display: false } },
              }}
              plugins={[labelPluginHorizontal]}
            />
          </div>
        </div>

        <div className="rri-panel">
          <div className="rri-panel-title">% Reincidentes sobre Equipo</div>
          <div className="rri-chart-area-240">
            <ChartComponent
              type="bar"
              data={pctChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 28 } },
                scales: { x: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11 } } }, y: { display: false } },
                plugins: { legend: { display: false } },
              }}
              plugins={[labelPluginPercentage]}
            />
          </div>
        </div>
      </div>

      <div className="rri-panel" style={{ marginBottom: 20 }}>
        <div className="rri-panel-title">Asesores Totales vs Reincidentes por Supervisor</div>
        <div className="rri-chart-area-220">
          <ChartComponent
            type="bar"
            data={compareChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: { top: 26 } },
              scales: { x: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11 } } }, y: { display: false } },
              plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } } },
            }}
            plugins={[labelPluginVertical]}
          />
        </div>
      </div>

      <div className="rri-grid-3" style={{ marginBottom: 20 }}>
        {rows.map((row) => {
          const reincAsesores = row.data.filter((asesor) => getAsesorEventCount(asesor, tipoActivo, filters.meses) > 0);
          return (
            <div key={row.s} className="rri-supervisor-card" style={{ borderLeftColor: row.color }}>
              <div className="rri-supervisor-name" style={{ color: row.color }}>
                {row.s}
              </div>
              <div className="rri-supervisor-stats">
                <div className="rri-supervisor-stat">
                  <div className="rri-supervisor-stat-label">Asesores</div>
                  <div className="rri-supervisor-stat-value">{row.asesores}</div>
                </div>
                <div className="rri-supervisor-stat">
                  <div className="rri-supervisor-stat-label">Monitoreos</div>
                  <div className="rri-supervisor-stat-value">{row.mon}</div>
                </div>
                <div className="rri-supervisor-stat">
                  <div className="rri-supervisor-stat-label">Reincidentes</div>
                  <div className="rri-supervisor-stat-value" style={{ color: row.color }}>{row.reinc}</div>
                </div>
                <div className="rri-supervisor-stat">
                  <div className="rri-supervisor-stat-label">Eventos</div>
                  <div className="rri-supervisor-stat-value" style={{ color: row.color }}>{row.eventos}</div>
                </div>
              </div>

              <div className="rri-supervisor-progress">
                <div className="rri-supervisor-progress-row">
                  <span>% Reincidentes sobre equipo</span>
                  <span className="rri-supervisor-progress-value" style={{ color: row.color }}>{row.pct}%</span>
                </div>
                <div className="rri-supervisor-progress-track">
                  <div className="rri-supervisor-progress-fill" style={{ width: `${Math.min(row.pct, 100)}%`, background: row.color }} />
                </div>
              </div>

              {reincAsesores.length ? (
                <div className="rri-supervisor-list">
                  <div className="rri-supervisor-list-title">Asesores reincidentes</div>
                  <div className="rri-supervisor-list-items">
                    {reincAsesores.map((asesor) => (
                      <div key={asesor.doc} className="rri-supervisor-list-item">
                        <div className="rri-supervisor-list-name">{asesor.nombre}</div>
                        <div className="rri-supervisor-list-desc">
                          {getActiveCausales(asesor, tipoActivo)
                            .filter((causal) => !filters.meses.length || filters.meses.some((month) => causal.meses.includes(month)))
                            .map((causal) => `${causal.c.slice(0, 60)}${causal.c.length > 60 ? '...' : ''} (${causal.n} mon.)`)
                            .join(' - ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rri-muted-note">Sin reincidentes en el periodo seleccionado</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="table-shell" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Supervisor</th>
              <th>Asesores</th>
              <th>Monitoreos</th>
              <th>Reincidentes</th>
              <th>Eventos</th>
              <th>% Reincidentes</th>
              <th>Tasa Ev/Mon.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.s} className={index === 0 ? 'r1' : index === 1 ? 'r2' : index === 2 ? 'r3' : ''}>
                  <td>
                    <span className={`rank-badge ${index >= 3 ? 'rri-rank-badge-fallback' : getRankClass(index)}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td><strong>{row.s}</strong></td>
                  <td>{row.asesores}</td>
                  <td>{row.mon}</td>
                  <td><span className="badge badge-info">{row.reinc}</span></td>
                  <td><strong>{row.eventos}</strong></td>
                  <td>{row.pct}%</td>
                  <td><span className="badge badge-info-2">{row.tasa}</span></td>
                </tr>
              ))
            ) : (
              <tr className="no-rows"><td colSpan={8}>Sin datos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rri-section-heading">
        <h3 className="rri-section-title">Detalle de Asesores Reincidentes</h3>
      </div>
      <div className="table-shell rri-table-scroll">
        <table className="rri-table-min-860">
          <thead>
            <tr>
              <th>Supervisor</th>
              <th>Asesor</th>
              <th>Antigüedad</th>
              <th>Monitoreos</th>
              <th>Reincidencias</th>
              <th>Cal. Prom.</th>
              <th style={{ minWidth: 300 }}>Causales</th>
            </tr>
          </thead>
          <tbody>
            {detailRows.length ? (
              detailRows.map(({ row, asesor, causales }) => {
                const eventos = getAsesorEventCount(asesor, tipoActivo, filters.meses);
                return (
                  <tr key={`${row.s}-${asesor.doc}`}>
                    <td><span className="badge badge-neutral">{asesor.supervisor}</span></td>
                    <td><strong>{asesor.nombre}</strong></td>
                    <td>
                      <div className="rri-profile-meta">{asesor.perfilLbl}</div>
                      <div className="rri-profile-days">{asesor.antiguedad} dias</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{asesor.mon}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${eventos >= 10 ? 'badge-danger' : eventos >= 5 ? 'badge-warn' : 'badge-info'}`}>{eventos}</span>
                    </td>
                    <td>{asesor.cal}%</td>
                    <td>
                      {causales.map((causal) => (
                        <span key={`${asesor.doc}-${causal.c}`} className="rri-causal-tag">
                          {causal.c} <strong className="rri-causal-tag-count">({causal.n} mon.)</strong>
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="no-rows"><td colSpan={7}>Sin datos para los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
