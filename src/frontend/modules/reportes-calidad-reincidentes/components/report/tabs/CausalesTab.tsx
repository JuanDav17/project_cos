'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChartColumnBig } from 'lucide-react';
import { ChartComponent } from '@reincidentes/components/ui/Chart';
import { FilterBar } from '@reincidentes/components/ui/FilterBar';
import { labelPluginVertical, paretoLinePlugin } from '@reincidentes/components/ui/chartPlugins';
import { buildCausalesSummary, defaultAntiguedad, getRankClass } from '@reincidentes/lib/filterUtils';
import { useReportStore } from '@reincidentes/store/reportStore';
import { ReportFilters } from '@reincidentes/types';

const palette = [
  'rgba(15, 23, 42, 0.92)',
  'rgba(15, 23, 42, 0.82)',
  'rgba(227, 91, 91, 0.9)',
  'rgba(15, 23, 42, 0.68)',
  'rgba(243, 167, 167, 0.95)',
  'rgba(15, 23, 42, 0.52)',
];

export const CausalesTab: React.FC = () => {
  const { data, tipoActivo } = useReportStore();
  const [filters, setFilters] = useState<ReportFilters>({ meses: [], sups: [], ants: [], sr: '' });

  useEffect(() => {
    if (!data) return;
    setFilters({ meses: data.allMeses, sups: data.supervisores, ants: [...defaultAntiguedad], sr: '' });
  }, [data]);

  const summary = useMemo(() => {
    if (!data) return [];
    return buildCausalesSummary(data, tipoActivo, filters);
  }, [data, filters, tipoActivo]);

  if (!data) return null;

  const chartData = {
    labels: summary.map((item) => {
      const words = item.c.split(' ');
      return `${words.slice(0, 4).join(' ')}${words.length > 4 ? '...' : ''}`;
    }),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Eventos',
        data: summary.map((item) => item.n),
        backgroundColor: summary.map((_, index) => palette[index % palette.length]),
        borderRadius: 6,
        borderSkipped: false,
        yAxisID: 'yBar',
        order: 2,
      },
      {
        type: 'line' as const,
        label: '% Acumulado',
        data: summary.map((item) => item.acum),
        borderColor: '#e35b5b',
        backgroundColor: 'rgba(227, 91, 91, 0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: '#e35b5b',
        pointRadius: 5,
        fill: true,
        tension: 0.35,
        yAxisID: 'yLine',
        order: 1,
      },
    ],
  };

  return (
    <div>
      <div className="rri-section-heading">
        <h2 className="rri-section-title">
          <ChartColumnBig className="rri-section-icon" aria-hidden="true" />
          Causales Reincidentes
        </h2>
        <p className="rri-section-copy">Diagrama de Pareto por frecuencia y porcentaje acumulado</p>
      </div>

      <FilterBar
        meses={data.allMeses.map((month) => ({ value: month, label: data.mesLabels[month] }))}
        selectedMeses={filters.meses}
        onMesesChange={(meses) => setFilters((current) => ({ ...current, meses }))}
        supervisores={data.supervisores.map((supervisor) => ({ value: supervisor, label: supervisor }))}
        selectedSupervisores={filters.sups}
        onSupervisoresChange={(sups) => setFilters((current) => ({ ...current, sups }))}
        searchValue={filters.sr}
        onSearchChange={(sr) => setFilters((current) => ({ ...current, sr }))}
        searchPlaceholder="Texto de causal..."
        countLabel="causales"
        countValue={summary.length}
        onReset={() => setFilters({ meses: data.allMeses, sups: data.supervisores, ants: [...defaultAntiguedad], sr: '' })}
      />

      <div className="rri-panel" style={{ marginBottom: 20 }}>
        <div className="rri-panel-title">Diagrama de Pareto</div>
        <div className="rri-chart-area-400">
          <ChartComponent
            type="bar"
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: { top: 20, right: 16 } },
              scales: {
                yBar: {
                  type: 'linear',
                  position: 'left',
                  beginAtZero: true,
                  grid: { color: 'rgba(15, 23, 42, 0.06)' },
                  ticks: { color: '#0f172a', font: { size: 11 }, stepSize: 1 },
                  title: { display: true, text: 'Eventos', color: '#0f172a', font: { size: 11, weight: 600 } },
                },
                yLine: {
                  type: 'linear',
                  position: 'right',
                  min: 0,
                  max: 100,
                  grid: { display: false },
                  ticks: { color: '#64748b', font: { size: 11 }, callback: (value: string | number) => `${value}%` },
                  title: { display: true, text: '% Acumulado', color: '#64748b', font: { size: 11, weight: 600 } },
                },
                x: {
                  grid: { display: false },
                  ticks: { color: '#0f172a', font: { size: 10 }, maxRotation: 28 },
                },
              },
              plugins: {
                legend: { display: true, position: 'top', labels: { boxWidth: 11, padding: 12, font: { size: 11 } } },
              },
            }}
            plugins={[labelPluginVertical, paretoLinePlugin(`pareto-${tipoActivo}`)]}
          />
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Causal</th>
              <th>Categoria</th>
              <th>Eventos</th>
              <th>% Individual</th>
              <th>% Acumulado</th>
              <th>Asesor(es)</th>
            </tr>
          </thead>
          <tbody>
            {summary.length ? (
              summary.map((item, index) => (
                <tr key={item.c} className={index === 0 ? 'r1' : index === 1 ? 'r2' : index === 2 ? 'r3' : ''}>
                  <td>
                    <span className={`rank-badge ${index >= 3 ? 'rri-rank-badge-fallback' : getRankClass(index)}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td><strong>{item.c}</strong></td>
                  <td><span className="badge badge-info">{item.cat}</span></td>
                  <td>{item.n}</td>
                  <td><span className="badge badge-info-2">{item.pct}%</span></td>
                  <td>{item.acum}%</td>
                  <td>{item.asesores.join(' - ')}</td>
                </tr>
              ))
            ) : (
              <tr className="no-rows">
                <td colSpan={7}>Sin causales para los filtros seleccionados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
