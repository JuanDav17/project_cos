'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';
import { ChartComponent } from '@correlaciones/components/ui/Chart';
import { labelPluginHorizontal } from '@correlaciones/components/ui/chartPlugins';
import { useCorrelacionStore } from '@correlaciones/store/correlacionStore';
import { formatPct, formatScore, cuartilColor, cuartilBg } from '@correlaciones/lib/utils';

const dimensionIcons: Record<string, string> = {
  Calidad: 'bi-clipboard-check',
  Efectividad: 'bi-graph-up-arrow',
  NPS: 'bi-emoji-frown',
  FCR: 'bi-telephone-x',
  Antifraude: 'bi-shield-exclamation',
  Sentimiento: 'bi-heart-pulse',
};

export const ReincidentesTab: React.FC = () => {
  const { data } = useCorrelacionStore();
  if (!data) return null;

  const { reincidentes } = data;

  /* ── Dimension frequency ────────────────────────────────────────────── */
  const dimFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const a of reincidentes) {
      for (const d of a.dimensionesAlerta) {
        freq[d] = (freq[d] || 0) + 1;
      }
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [reincidentes]);

  const dimChartData = useMemo(() => ({
    labels: dimFreq.map(([d]) => d),
    datasets: [{
      label: 'Asesores afectados',
      data: dimFreq.map(([, c]) => c),
      backgroundColor: 'rgba(227, 91, 91, 0.82)',
      borderRadius: 6,
      borderSkipped: false as const,
    }],
  }), [dimFreq]);

  /* ── By alert count ─────────────────────────────────────────────────── */
  const byAlertCount = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const a of reincidentes) {
      const n = a.dimensionesAlerta.length;
      counts[n] = (counts[n] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([k, v]) => ({ alertas: Number(k), count: v }))
      .sort((a, b) => b.alertas - a.alertas);
  }, [reincidentes]);

  return (
    <div>
      <div className="cor-section-heading">
        <h2 className="cor-section-title">
          <ShieldAlert className="cor-section-icon" aria-hidden="true" />
          Asesores Reincidentes - Multiples Dimensiones en Alerta
        </h2>
        <p className="cor-section-copy">
          Asesores con bajo rendimiento en 2 o mas dimensiones simultaneamente. Total: {reincidentes.length} asesores
        </p>
      </div>

      <div className="cor-grid-3" style={{ marginBottom: 24 }}>
        {byAlertCount.map(({ alertas, count }) => (
          <div key={alertas} className="cor-panel cor-panel-compact">
            <div className="cor-panel-title">
              <AlertTriangle className="cor-inline-icon" style={{ color: '#e35b5b' }} aria-hidden="true" />
              {alertas} dimensiones en alerta
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#e35b5b' }}>{count}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>asesores</div>
          </div>
        ))}
      </div>

      <div className="cor-grid-2" style={{ marginBottom: 20 }}>
        <div className="cor-panel">
          <div className="cor-panel-title">Frecuencia de Dimensiones en Alerta</div>
          <div className="cor-chart-area-240">
            <ChartComponent
              type="bar"
              data={dimChartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 40 } },
                scales: {
                  x: { display: false },
                  y: { grid: { display: false }, ticks: { font: { size: 11, weight: 600 } } },
                },
                plugins: { legend: { display: false } },
              }}
              plugins={[labelPluginHorizontal]}
            />
          </div>
        </div>
        <div className="cor-panel">
          <div className="cor-panel-title">Detalle de Alertas por Dimension</div>
          <div style={{ padding: '16px 0' }}>
            {dimFreq.map(([dim, count]) => (
              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #e9edf3' }}>
                <i className={`bi ${dimensionIcons[dim] || 'bi-exclamation-circle'}`} style={{ fontSize: 16, color: '#e35b5b' }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{dim}</span>
                <span className="badge badge-danger">{count} asesores</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-shell" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Documento</th>
              <th>Asesor</th>
              <th>Supervisor</th>
              <th>Score</th>
              <th>Alertas</th>
              <th>Calidad</th>
              <th>Efectividad</th>
              <th>NPS</th>
              <th>FCR</th>
              <th>Antifraude</th>
              <th>Sent. Neg.</th>
              <th>Dimensiones Afectadas</th>
            </tr>
          </thead>
          <tbody>
            {reincidentes.length ? (
              reincidentes.map((a, i) => (
                <tr key={a.doc} className={a.dimensionesAlerta.length >= 4 ? 'cor-row-critical' : a.dimensionesAlerta.length >= 3 ? 'cor-row-alert' : ''}>
                  <td>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.doc}</td>
                  <td><strong>{a.nombre}</strong></td>
                  <td>{a.supervisor}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: cuartilColor(a.cuartil) }}>
                      {formatScore(a.scoreGlobal)}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-danger" style={{ fontSize: 13, padding: '3px 10px' }}>
                      <XCircle style={{ width: 13, height: 13 }} /> {a.dimensionesAlerta.length}
                    </span>
                  </td>
                  <td style={{ color: a.dimensionesAlerta.includes('Calidad') ? '#e35b5b' : undefined, fontWeight: a.dimensionesAlerta.includes('Calidad') ? 700 : 400 }}>
                    {a.audCalificacionProm > 0 ? formatScore(a.audCalificacionProm) : '-'}
                  </td>
                  <td style={{ color: a.dimensionesAlerta.includes('Efectividad') ? '#e35b5b' : undefined, fontWeight: a.dimensionesAlerta.includes('Efectividad') ? 700 : 400 }}>
                    {a.efecPctEfectividad > 0 ? formatPct(a.efecPctEfectividad) : '-'}
                  </td>
                  <td style={{ color: a.dimensionesAlerta.includes('NPS') ? '#e35b5b' : undefined, fontWeight: a.dimensionesAlerta.includes('NPS') ? 700 : 400 }}>
                    {a.nps !== 0 ? a.nps.toFixed(3) : '-'}
                  </td>
                  <td style={{ color: a.dimensionesAlerta.includes('FCR') ? '#e35b5b' : undefined, fontWeight: a.dimensionesAlerta.includes('FCR') ? 700 : 400 }}>
                    {a.fcr > 0 ? formatPct(a.fcr * 100) : '-'}
                  </td>
                  <td style={{ color: a.dimensionesAlerta.includes('Antifraude') ? '#e35b5b' : undefined, fontWeight: a.dimensionesAlerta.includes('Antifraude') ? 700 : 400 }}>
                    {a.antifMalaPracticas}
                  </td>
                  <td style={{ color: a.dimensionesAlerta.includes('Sentimiento') ? '#e35b5b' : undefined, fontWeight: a.dimensionesAlerta.includes('Sentimiento') ? 700 : 400 }}>
                    {a.vozTotalLlamadas > 0 ? formatPct(a.vozFinEmoNeg) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {a.dimensionesAlerta.map((d) => (
                        <span key={d} className="badge badge-danger" style={{ fontSize: 10 }}>{d}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-rows">
                <td colSpan={13}>No hay asesores con multiples dimensiones en alerta</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
