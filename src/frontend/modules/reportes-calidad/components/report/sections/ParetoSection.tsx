'use client';

import { useMemo } from 'react';
import type { Plugin } from 'chart.js/auto';
import { ChartComponent } from '@quality/components/ui/Chart';
import { ProcessedReport } from '@quality/types/report';

interface ParetoSectionProps {
  data: ProcessedReport;
}

const PARETO_TONES = [
  'rgba(15, 23, 42, 0.92)',
  'rgba(15, 23, 42, 0.84)',
  'rgba(227, 91, 91, 0.9)',
  'rgba(15, 23, 42, 0.68)',
  'rgba(243, 167, 167, 0.96)',
  'rgba(15, 23, 42, 0.52)',
] as const;

function parseRgb(color: unknown) {
  if (typeof color !== 'string') return null;

  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function ParetoSection({ data }: ParetoSectionProps) {
  const paretoValueLabels = useMemo<Plugin<'bar'>>(() => ({
    id: 'paretoValueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element, index) => {
          const rawValue = dataset.data[index];
          if (typeof rawValue !== 'number') return;

          if (meta.type === 'bar') {
            const { x, y, base } = element.getProps(['x', 'y', 'base'], true) as { x: number; y: number; base: number };
            const label = `${rawValue}`;
            const metrics = ctx.measureText(label);
            const paddingX = 6;
            const badgeWidth = metrics.width + paddingX * 2;
            const badgeHeight = 18;
            const barHeight = Math.abs(base - y);
            const fill = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor;
            const rgb = parseRgb(fill);
            const isLight = rgb ? ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000 > 170 : false;
            const inside = barHeight >= badgeHeight + 10;
            const badgeX = x - badgeWidth / 2;
            const badgeY = inside ? y + 6 : y - badgeHeight - 6;

            ctx.save();
            ctx.fillStyle = inside
              ? (isLight ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.18)')
              : 'rgba(255, 255, 255, 0.94)';
            ctx.strokeStyle = inside ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = inside ? '#ffffff' : '#0f172a';
            ctx.font = '700 11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, badgeY + badgeHeight / 2 + 0.5);
            ctx.restore();
          }

          if (meta.type === 'line') {
            const { x, y } = element.getProps(['x', 'y'], true) as { x: number; y: number };
            const label = `${rawValue}%`;
            const metrics = ctx.measureText(label);
            const paddingX = 6;
            const badgeWidth = metrics.width + paddingX * 2;
            const badgeHeight = 18;
            const badgeX = x - badgeWidth / 2;
            const badgeY = y - badgeHeight - 10;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.strokeStyle = dataset.borderColor as string || '#0f172a';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = dataset.borderColor as string || '#0f172a';
            ctx.font = '700 11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, badgeY + badgeHeight / 2 + 0.5);
            ctx.restore();
          }
        });
      });
    },
  }), []);

  const paretoSoulChart = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: data.paretoSoul.map((item) => item.causal.length > 40 ? `${item.causal.slice(0, 40)}…` : item.causal),
      datasets: [
        { label: 'Asesores reincidentes', data: data.paretoSoul.map((item) => item.asesores), backgroundColor: data.paretoSoul.map((_, index) => PARETO_TONES[index % PARETO_TONES.length]), borderRadius: 5, yAxisID: 'y' },
        { label: '% Acumulado', data: data.paretoSoul.map((item) => item.porcentajeAcumulado), type: 'line' as const, borderColor: '#e35b5b', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#e35b5b', tension: 0.2, yAxisID: 'y2' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' as const } },
      scales: {
        y: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
        y2: { position: 'right' as const, min: 0, max: 100, grid: { display: false }, ticks: { callback: (value: string | number) => `${value}%`, font: { size: 10 } }, border: { display: false } },
        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 40 } },
      },
    },
  }), [data]);

  const paretoAfChart = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: data.paretoAf.map((item) => item.tipo),
      datasets: [
        { label: 'Asesores', data: data.paretoAf.map((item) => item.asesores), backgroundColor: ['rgba(15, 23, 42, 0.88)', 'rgba(227, 91, 91, 0.9)', 'rgba(15, 23, 42, 0.72)', 'rgba(243, 167, 167, 0.95)', 'rgba(15, 23, 42, 0.52)'], borderRadius: 6, yAxisID: 'y' },
        { label: '% Acumulado', data: data.paretoAf.map((item) => item.porcentajeAcumulado), type: 'line' as const, borderColor: '#0f172a', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#0f172a', yAxisID: 'y2' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' as const } },
      scales: {
        y: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
        y2: { position: 'right' as const, min: 0, max: 100, grid: { display: false }, ticks: { callback: (value: string | number) => `${value}%` }, border: { display: false } },
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
      },
    },
  }), [data]);

  const maxSoul = data.paretoSoul.length ? data.paretoSoul[0].asesores : 1;

  return (
    <div id="sec-pareto" className="sec on">
      <div className="stitle">Análisis de Pareto</div>
      <div className="card">
        <div className="card-head"><h2>Pareto · Causales críticas con reincidencia</h2><span className="scope-tag sc-b">Solo SOUL crítico</span></div>
        <div className="card-body">
          <div style={{ height: 310 }}><ChartComponent {...paretoSoulChart} plugins={[paretoValueLabels]} /></div>
          <div className="tw" style={{ marginTop: 16 }}>
            <table>
              <thead><tr><th>#</th><th>Causal crítica</th><th>Asesores</th><th>Mon.</th><th>%</th><th>% Acum.</th><th>Zona</th><th>Visual</th></tr></thead>
              <tbody>
                {data.paretoSoul.map((item, index) => (
                  <tr key={item.causal}>
                    <td><strong>{index + 1}</strong></td>
                    <td style={{ fontSize: 12 }}>{item.causal}</td>
                    <td style={{ textAlign: 'center' }}><strong>{item.asesores}</strong></td>
                    <td style={{ textAlign: 'center' }}>{item.monitoreos}</td>
                    <td style={{ textAlign: 'center' }}>{item.porcentaje}%</td>
                    <td style={{ textAlign: 'center' }}><span className="acb">{item.porcentajeAcumulado}%</span></td>
                    <td>{item.porcentajeAcumulado <= 50 ? <span className="b bd">Crítico</span> : item.porcentajeAcumulado <= 81 ? <span className="b bw">Importante</span> : <span className="b bgr">Menor</span>}</td>
                    <td><span className="pb-wrap"><span className="pb-fill" style={{ width: `${Math.round((item.asesores / maxSoul) * 100)}%` }} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h2>Pareto · Tipos de mala práctica</h2><span className="scope-tag sc-w">Todos los registros AF</span></div>
        <div className="card-body">
          <div style={{ height: 240 }}><ChartComponent {...paretoAfChart} plugins={[paretoValueLabels]} /></div>
          <div className="tw" style={{ marginTop: 16 }}>
            <table>
              <thead><tr><th>#</th><th>Tipo</th><th>Asesores</th><th>Registros</th><th>%</th><th>% Acum.</th></tr></thead>
              <tbody>
                {data.paretoAf.map((item, index) => (
                  <tr key={item.tipo}>
                    <td><strong>{index + 1}</strong></td>
                    <td>{item.tipo}</td>
                    <td style={{ textAlign: 'center' }}><strong>{item.asesores}</strong></td>
                    <td style={{ textAlign: 'center' }}>{item.registros}</td>
                    <td style={{ textAlign: 'center' }}>{item.porcentaje}%</td>
                    <td style={{ textAlign: 'center' }}><span className="acb">{item.porcentajeAcumulado}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
