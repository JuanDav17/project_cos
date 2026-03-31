'use client';

import React, { useMemo } from 'react';
import { ScatterChart } from 'lucide-react';
import { ChartComponent } from '@correlaciones/components/ui/Chart';
import { useCorrelacionStore } from '@correlaciones/store/correlacionStore';
import { cuartilColor } from '@correlaciones/lib/utils';

export const AnalisisGlobalTab: React.FC = () => {
  const { data } = useCorrelacionStore();
  if (!data) return null;

  const { asesores } = data;

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const scatterPoint = (x: number, y: number, label: string, q: 1 | 2 | 3 | 4) => ({
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    label,
    q,
  });

  /* ── 1. Efectividad vs Calidad ──────────────────────────────────────── */
  const efecVsCal = useMemo(() => {
    const points = asesores
      .filter((a) => a.efecPctEfectividad > 0 && a.audCalificacionProm > 0)
      .map((a) => scatterPoint(a.efecPctEfectividad, a.audCalificacionProm, a.nombre, a.cuartil));

    return {
      datasets: [{
        label: 'Asesores',
        data: points,
        backgroundColor: points.map((p) => cuartilColor(p.q)),
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    };
  }, [asesores]);

  /* ── 2. NPS vs FCR ──────────────────────────────────────────────────── */
  const npsVsFcr = useMemo(() => {
    const points = asesores
      .filter((a) => a.nps !== 0 && a.fcr > 0)
      .map((a) => scatterPoint(a.fcr * 100, ((a.nps + 1) / 2) * 100, a.nombre, a.cuartil));

    return {
      datasets: [{
        label: 'Asesores',
        data: points,
        backgroundColor: points.map((p) => cuartilColor(p.q)),
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    };
  }, [asesores]);

  /* ── 3. Efectividad vs NPS ──────────────────────────────────────────── */
  const efecVsNps = useMemo(() => {
    const points = asesores
      .filter((a) => a.efecPctEfectividad > 0 && a.nps !== 0)
      .map((a) => scatterPoint(a.efecPctEfectividad, ((a.nps + 1) / 2) * 100, a.nombre, a.cuartil));

    return {
      datasets: [{
        label: 'Asesores',
        data: points,
        backgroundColor: points.map((p) => cuartilColor(p.q)),
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    };
  }, [asesores]);

  /* ── 4. Score Global vs Malas Practicas ─────────────────────────────── */
  const scoreVsAntif = useMemo(() => {
    const points = asesores
      .map((a) => scatterPoint(a.antifMalaPracticas, a.scoreGlobal, a.nombre, a.cuartil));

    return {
      datasets: [{
        label: 'Asesores',
        data: points,
        backgroundColor: points.map((p) => cuartilColor(p.q)),
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    };
  }, [asesores]);

  /* ── 5. Histograma de scores ────────────────────────────────────────── */
  const histogram = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}-${(i + 1) * 10}`, count: 0 }));
    for (const a of asesores) {
      const idx = Math.min(9, Math.floor(a.scoreGlobal / 10));
      bins[idx].count++;
    }
    return {
      labels: bins.map((b) => b.label),
      datasets: [{
        label: 'Asesores',
        data: bins.map((b) => b.count),
        backgroundColor: bins.map((_, i) => {
          if (i < 3) return cuartilColor(1);
          if (i < 5) return cuartilColor(2);
          if (i < 8) return cuartilColor(3);
          return cuartilColor(4);
        }),
        borderRadius: 4,
        borderSkipped: false as const,
      }],
    };
  }, [asesores]);

  /* ── 6. Box-plot style cuartiles ────────────────────────────────────── */
  const cuartilBoxData = useMemo(() => {
    const groups: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const a of asesores) groups[a.cuartil].push(a.scoreGlobal);
    for (const g of Object.values(groups)) g.sort((a, b) => a - b);

    const stats = [1, 2, 3, 4].map((q) => {
      const arr = groups[q];
      if (!arr.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
      return {
        min: arr[0],
        q1: arr[Math.floor(arr.length * 0.25)],
        median: arr[Math.floor(arr.length * 0.5)],
        q3: arr[Math.floor(arr.length * 0.75)],
        max: arr[arr.length - 1],
      };
    });

    return {
      labels: ['Bajo', 'Medio-Bajo', 'Medio-Alto', 'Alto'],
      datasets: [
        {
          label: 'Rango (min-max)',
          data: stats.map((s) => [s.min, s.max] as [number, number]),
          backgroundColor: [cuartilColor(1), cuartilColor(2), cuartilColor(3), cuartilColor(4)].map((c) => c + '33'),
          borderColor: [cuartilColor(1), cuartilColor(2), cuartilColor(3), cuartilColor(4)],
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false as const,
          barPercentage: 0.5,
        },
        {
          label: 'Rango intercuartil',
          data: stats.map((s) => [s.q1, s.q3] as [number, number]),
          backgroundColor: [cuartilColor(1), cuartilColor(2), cuartilColor(3), cuartilColor(4)].map((c) => c + '88'),
          borderColor: [cuartilColor(1), cuartilColor(2), cuartilColor(3), cuartilColor(4)],
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false as const,
          barPercentage: 0.3,
        },
      ],
    };
  }, [asesores]);

  const scatterOpts = (xLabel: string, yLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: xLabel, font: { size: 12, weight: 600 as const } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y: { title: { display: true, text: yLabel, font: { size: 12, weight: 600 as const } }, grid: { color: 'rgba(0,0,0,0.04)' } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const raw = ctx.raw as { label?: string; x?: number; y?: number };
            return `${raw.label ?? ''}: (${raw.x}, ${raw.y})`;
          },
        },
      },
    },
  });

  return (
    <div>
      <div className="cor-section-heading">
        <h2 className="cor-section-title">
          <ScatterChart className="cor-section-icon" aria-hidden="true" />
          Analisis Global - Dispersiones y Cuartiles
        </h2>
        <p className="cor-section-copy">
          Correlaciones entre dimensiones. Color por cuartil: rojo=Bajo, amarillo=Medio-Bajo, azul=Medio-Alto, verde=Alto
        </p>
      </div>

      <div className="cor-grid-2" style={{ marginBottom: 20 }}>
        <div className="cor-panel">
          <div className="cor-panel-title">Efectividad vs Calidad Auditorias</div>
          <div className="cor-chart-area-300">
            <ChartComponent type="scatter" data={efecVsCal} options={scatterOpts('% Efectividad', 'Calificacion Calidad')} />
          </div>
        </div>
        <div className="cor-panel">
          <div className="cor-panel-title">FCR vs NPS (normalizado 0-100)</div>
          <div className="cor-chart-area-300">
            <ChartComponent type="scatter" data={npsVsFcr} options={scatterOpts('% FCR (Solucion)', 'NPS (norm. 0-100)')} />
          </div>
        </div>
      </div>

      <div className="cor-grid-2" style={{ marginBottom: 20 }}>
        <div className="cor-panel">
          <div className="cor-panel-title">Efectividad vs NPS (normalizado 0-100)</div>
          <div className="cor-chart-area-300">
            <ChartComponent type="scatter" data={efecVsNps} options={scatterOpts('% Efectividad', 'NPS (norm. 0-100)')} />
          </div>
        </div>
        <div className="cor-panel">
          <div className="cor-panel-title">Score Global vs Malas Practicas</div>
          <div className="cor-chart-area-300">
            <ChartComponent type="scatter" data={scoreVsAntif} options={scatterOpts('Malas Practicas', 'Score Global')} />
          </div>
        </div>
      </div>

      <div className="cor-grid-2" style={{ marginBottom: 20 }}>
        <div className="cor-panel">
          <div className="cor-panel-title">Histograma de Score Global</div>
          <div className="cor-chart-area-300">
            <ChartComponent
              type="bar"
              data={histogram}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 20 } },
                scales: {
                  x: { title: { display: true, text: 'Rango de Score', font: { size: 12, weight: 600 as const } }, grid: { display: false } },
                  y: { title: { display: true, text: 'Cantidad Asesores', font: { size: 12, weight: 600 as const } } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
        <div className="cor-panel">
          <div className="cor-panel-title">Distribucion por Cuartil (Rango de Scores)</div>
          <div className="cor-chart-area-300">
            <ChartComponent
              type="bar"
              data={cuartilBoxData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x' as const,
                layout: { padding: { top: 20 } },
                scales: {
                  x: { grid: { display: false } },
                  y: { title: { display: true, text: 'Score Global', font: { size: 12, weight: 600 as const } }, min: 0, max: 100 },
                },
                plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 10 } } } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
