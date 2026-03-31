'use client';

import React, { useMemo } from 'react';
import { Activity, AlertTriangle, BarChart3, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { ChartComponent } from '@correlaciones/components/ui/Chart';
import { KpiCard } from '@correlaciones/components/ui/KpiCard';
import { labelPluginVertical } from '@correlaciones/components/ui/chartPlugins';
import { useCorrelacionStore } from '@correlaciones/store/correlacionStore';
import { formatPct, formatScore, cuartilColor } from '@correlaciones/lib/utils';

export const ResumenTab: React.FC = () => {
  const { data } = useCorrelacionStore();
  if (!data) return null;

  const { asesores, promedios, reincidentes } = data;

  /* ── Radar: promedios por dimension (normalizado 0-100) ─────────────── */
  const radarData = useMemo(() => ({
    labels: ['Calidad', 'Efectividad', 'NPS', 'FCR', 'Sentimiento (+)', 'Antifraude (-)'],
    datasets: [{
      label: 'Promedio Global',
      data: [
        promedios.calidad,
        promedios.efectividad,
        Math.max(0, ((promedios.nps + 1) / 2) * 100),
        promedios.fcr * 100,
        100 - promedios.vozNeg,
        Math.max(0, 100 - (promedios.antifraude * 2)),
      ].map((v) => Math.round(v * 10) / 10),
      backgroundColor: 'rgba(227, 91, 91, 0.18)',
      borderColor: '#e35b5b',
      borderWidth: 2,
      pointBackgroundColor: '#e35b5b',
      pointRadius: 4,
    }],
  }), [promedios]);

  /* ── Distribucion por cuartil ────────────────────────────────────────── */
  const cuartilCounts = useMemo(() => {
    const counts = [0, 0, 0, 0];
    for (const a of asesores) counts[a.cuartil - 1]++;
    return counts;
  }, [asesores]);

  const cuartilChartData = useMemo(() => ({
    labels: ['Bajo', 'Medio-Bajo', 'Medio-Alto', 'Alto'],
    datasets: [{
      label: 'Asesores',
      data: cuartilCounts,
      backgroundColor: [cuartilColor(1), cuartilColor(2), cuartilColor(3), cuartilColor(4)],
      borderRadius: 6,
      borderSkipped: false as const,
    }],
  }), [cuartilCounts]);

  /* ── Top / Bottom 10 ────────────────────────────────────────────────── */
  const top10 = asesores.slice(0, 10);
  const bottom10 = [...asesores].sort((a, b) => a.scoreGlobal - b.scoreGlobal).slice(0, 10);

  return (
    <div>
      <div className="cor-section-heading">
        <h2 className="cor-section-title">
          <BarChart3 className="cor-section-icon" aria-hidden="true" />
          Resumen Ejecutivo - Correlaciones
        </h2>
        <p className="cor-section-copy">
          {data.totalAsesores} asesores evaluados cruzando {5} bases de datos
        </p>
      </div>

      <div className="cor-grid-6" style={{ marginBottom: 24 }}>
        <KpiCard title="Total Asesores" value={data.totalAsesores} subtitle="En todas las bases" tone="base" icon={Users} />
        <KpiCard title="Prom. Efectividad" value={formatPct(promedios.efectividad)} subtitle="Retenidos / Intenciones" tone="alt1" icon={TrendingUp} />
        <KpiCard title="Prom. Calidad" value={formatScore(promedios.calidad)} subtitle="Calificacion auditorias" tone="alt2" icon={ShieldCheck} />
        <KpiCard title="Prom. NPS" value={promedios.nps.toFixed(3)} subtitle="Net Promoter Score" tone="alt3" icon={Activity} />
        <KpiCard title="Prom. FCR" value={formatPct(promedios.fcr * 100)} subtitle="Solucion primer contacto" tone="alt4" icon={ShieldCheck} />
        <KpiCard title="Reincidentes" value={reincidentes.length} subtitle="2+ dimensiones en alerta" tone="alt5" icon={AlertTriangle} />
      </div>

      <div className="cor-grid-2" style={{ marginBottom: 20 }}>
        <div className="cor-panel">
          <div className="cor-panel-title">Radar - Promedios por Dimension</div>
          <div className="cor-chart-area-300">
            <ChartComponent
              type="radar"
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 20, font: { size: 10 } },
                    pointLabels: { font: { size: 11, weight: 600 } },
                  },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="cor-panel">
          <div className="cor-panel-title">Distribucion por Cuartil</div>
          <div className="cor-chart-area-300">
            <ChartComponent
              type="bar"
              data={cuartilChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 28 } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  y: { display: false },
                },
                plugins: { legend: { display: false } },
              }}
              plugins={[labelPluginVertical]}
            />
          </div>
        </div>
      </div>

      <div className="cor-grid-2" style={{ marginBottom: 20 }}>
        <div className="cor-panel">
          <div className="cor-panel-title">Top 10 - Mejores Asesores</div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asesor</th>
                  <th>Score</th>
                  <th>Efectividad</th>
                  <th>Calidad</th>
                  <th>NPS</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((a, i) => (
                  <tr key={a.doc}>
                    <td><span className="rank-badge" style={{ background: cuartilColor(a.cuartil), color: '#fff' }}>{i + 1}</span></td>
                    <td><strong>{a.nombre}</strong></td>
                    <td>{formatScore(a.scoreGlobal)}</td>
                    <td>{formatPct(a.efecPctEfectividad)}</td>
                    <td>{formatScore(a.audCalificacionProm)}</td>
                    <td>{a.nps.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cor-panel">
          <div className="cor-panel-title">Bottom 10 - Asesores con menor Score</div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asesor</th>
                  <th>Score</th>
                  <th>Efectividad</th>
                  <th>Calidad</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {bottom10.map((a, i) => (
                  <tr key={a.doc}>
                    <td><span className="rank-badge" style={{ background: cuartilColor(a.cuartil), color: '#fff' }}>{i + 1}</span></td>
                    <td><strong>{a.nombre}</strong></td>
                    <td>{formatScore(a.scoreGlobal)}</td>
                    <td>{formatPct(a.efecPctEfectividad)}</td>
                    <td>{formatScore(a.audCalificacionProm)}</td>
                    <td><span className="badge badge-danger">{a.dimensionesAlerta.length}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
