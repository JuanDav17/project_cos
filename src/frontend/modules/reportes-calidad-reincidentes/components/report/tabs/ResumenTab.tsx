'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BriefcaseBusiness, CircleGauge, Database, Layers3, Users } from 'lucide-react';
import { ChartComponent } from '@reincidentes/components/ui/Chart';
import { FilterBar } from '@reincidentes/components/ui/FilterBar';
import { KpiCard } from '@reincidentes/components/ui/KpiCard';
import { labelPluginHorizontal, labelPluginVertical } from '@reincidentes/components/ui/chartPlugins';
import { buildSupervisorSummary, buildTopCausalesByAsesor, defaultAntiguedad, formatSupervisorLabel, getAsesorEventCount, getActiveReincidentes, getRankClass, matchesAsesorFilters } from '@reincidentes/lib/filterUtils';
import { useReportStore } from '@reincidentes/store/reportStore';
import { PerfilAntiguedad, ReportFilters } from '@reincidentes/types';

const antiguedadOptions: { value: PerfilAntiguedad; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo (<3 m)' },
  { value: 'formacion', label: 'En Formacion (3-6 m)' },
  { value: 'intermedio', label: 'Intermedio (6-12 m)' },
  { value: 'veterano', label: 'Veterano (>1 ano)' },
];

const palette = [
  'rgba(15, 23, 42, 0.92)',
  'rgba(15, 23, 42, 0.82)',
  'rgba(227, 91, 91, 0.9)',
  'rgba(15, 23, 42, 0.68)',
  'rgba(243, 167, 167, 0.95)',
  'rgba(15, 23, 42, 0.52)',
];

export const ResumenTab: React.FC = () => {
  const { data, tipoActivo } = useReportStore();
  const [filters, setFilters] = useState<ReportFilters>({ meses: [], sups: [], ants: [], sr: '' });

  useEffect(() => {
    if (!data) return;
    setFilters({
      meses: data.allMeses,
      sups: data.supervisores,
      ants: [...defaultAntiguedad],
      sr: '',
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return getActiveReincidentes(data, tipoActivo).filter((asesor) => matchesAsesorFilters(asesor, filters));
  }, [data, filters, tipoActivo]);

  const totalEventos = useMemo(
    () => filtered.reduce((sum, asesor) => sum + getAsesorEventCount(asesor, tipoActivo, filters.meses), 0),
    [filtered, tipoActivo, filters.meses],
  );

  const topCausal = useMemo(() => buildTopCausalesByAsesor(filtered, tipoActivo, filters.meses)[0], [filtered, tipoActivo, filters.meses]);

  const supervisorRows = useMemo(() => {
    if (!data) return [];
    return buildSupervisorSummary(data, tipoActivo, filters.meses, filters.sups);
  }, [data, filters.meses, filters.sups, tipoActivo]);

  if (!data) return null;

  const topAsesores = filtered.slice(0, 10);
  const asesorChartData = {
    labels: topAsesores.map((asesor) => asesor.nombre.split(' ')[0]),
    datasets: [
      {
        label: 'Reincidencias',
        data: topAsesores.map((asesor) => getAsesorEventCount(asesor, tipoActivo, filters.meses)),
        backgroundColor: topAsesores.map((_, index) => palette[index % palette.length]),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const supervisorChartData = {
    labels: supervisorRows.map((row) => formatSupervisorLabel(row.s)),
    datasets: [
      {
        label: 'Eventos',
        data: supervisorRows.map((row) => row.eventos),
        backgroundColor: supervisorRows.map((row) => row.color),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div>
      <div className="rri-section-heading">
        <h2 className="rri-section-title">
          <Layers3 className="rri-section-icon" aria-hidden="true" />
          Resumen Ejecutivo
        </h2>
        <p className="rri-section-copy">
          {data.totalMon} monitoreos unicos - {data.reincidentesCrit.length} reincidentes criticos - {data.reincidentesNC.length} reincidentes no criticos
        </p>
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

      <div className="rri-grid-5" style={{ marginBottom: 24 }}>
        <KpiCard title="Total Monitoreos" value={data.totalMon} subtitle="IDs unicos de auditoria (ID Mios)" tone="base" icon={Database} />
        <KpiCard title="Asesores Evaluados" value={data.totalAsesores} subtitle="Agentes en la BBDD" tone="alt1" icon={Users} />
        <KpiCard title="Reincidentes" value={filtered.length} subtitle="Misma causal en 2 o mas monitoreos" tone="alt2" icon={AlertTriangle} />
        <KpiCard title="Eventos de Reincidencia" value={totalEventos} subtitle="Monitoreos adicionales con la misma causal" tone="alt3" icon={BriefcaseBusiness} />
        <KpiCard
          title="Causal mas frecuente"
          value={topCausal ? `${topCausal.count} ev.` : '--'}
          subtitle={topCausal ? `${topCausal.causal.slice(0, 46)}${topCausal.causal.length > 46 ? '...' : ''}` : 'Sin datos en el periodo'}
          tone="alt4"
          icon={CircleGauge}
        />
      </div>

      <div className="rri-grid-2" style={{ marginBottom: 20 }}>
        <div className="rri-panel">
          <div className="rri-panel-title">Reincidencias por Asesor</div>
          <div className="rri-chart-area-240">
            <ChartComponent
              type="bar"
              data={asesorChartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 40 } },
                scales: {
                  x: { display: false },
                  y: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11, weight: 600 } } },
                },
                plugins: { legend: { display: false } },
              }}
              plugins={[labelPluginHorizontal]}
            />
          </div>
        </div>

        <div className="rri-panel">
          <div className="rri-panel-title">Distribucion por Supervisor</div>
          <div className="rri-chart-area-240">
            <ChartComponent
              type="bar"
              data={supervisorChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 28 } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11 } } },
                  y: { display: false },
                },
                plugins: { legend: { display: false } },
              }}
              plugins={[labelPluginVertical]}
            />
          </div>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {supervisorRows.length ? (
              supervisorRows.map((row, index) => (
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
                </tr>
              ))
            ) : (
              <tr className="no-rows">
                <td colSpan={7}>Sin datos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
