'use client';

import { useMemo } from 'react';
import { ChartComponent } from '@quality/components/ui/Chart';
import { ProcessedReport } from '@quality/types/report';

interface SupervisoresSectionProps {
  data: ProcessedReport;
}

export function SupervisoresSection({ data }: SupervisoresSectionProps) {
  const maxReincidentes = Math.max(...data.supervisores.map((item) => item.reincidentes), 1);

  const chartConfig = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: data.supervisores.map((item) => item.supervisor),
      datasets: [
        { label: 'Total Asesores', data: data.supervisores.map((item) => item.totalAsesores), backgroundColor: 'rgba(15, 23, 42, 0.2)', borderRadius: 5 },
        { label: 'Reinc. Críticos', data: data.supervisores.map((item) => item.reincidentes), backgroundColor: 'rgba(15, 23, 42, 0.86)', borderRadius: 5 },
        { label: 'Con Antifraude', data: data.supervisores.map((item) => item.conAntifraude), backgroundColor: 'rgba(227, 91, 91, 0.82)', borderRadius: 5 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' as const } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 28 } },
        y: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
      },
    },
  }), [data.supervisores]);

  return (
    <div id="sec-supervisores" className="sec on">
      <div className="stitle">Análisis por supervisor</div>
      <div className="sgrid">
        {data.supervisores.map((item) => {
          const porcentajeAf = Math.round((item.conAntifraude / Math.max(item.reincidentes, 1)) * 100);
          return (
            <div className="sup-card" key={item.supervisor}>
              <div className="sup-name">{item.supervisor}</div>
              <div className="sup-row"><span className="sup-row-lbl">Total asesores</span><span className="sup-row-val" style={{ color: 'var(--t2)' }}>{item.totalAsesores}</span></div>
              <div className="sup-row"><span className="sup-row-lbl">Reinc. críticos</span><span className="sup-row-val">{item.reincidentes}</span></div>
              <div className="sup-row"><span className="sup-row-lbl">% del equipo</span><span className="sup-row-val">{item.porcentajeEquipo}%</span></div>
              <div className="sup-row"><span className="sup-row-lbl">Con antifraude</span><span className="sup-row-val" style={{ color: 'var(--wn)' }}>{item.conAntifraude} ({porcentajeAf}%)</span></div>
              <div className="sup-bar-outer"><div className="sup-bar-fill" style={{ width: `${Math.round((item.reincidentes / maxReincidentes) * 100)}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-head"><h2>Comparativo por supervisor</h2></div>
          <div className="card-body"><div style={{ height: 300 }}><ChartComponent {...chartConfig} /></div></div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Tabla resumen</h2></div>
          <div className="tw">
            <table>
              <thead><tr><th>Supervisor</th><th>Total</th><th>Reinc.</th><th>%</th><th>Caus. Prom.</th><th>Con AF</th><th>Nivel</th></tr></thead>
              <tbody>
                {data.supervisores.map((item) => (
                  <tr key={item.supervisor}>
                    <td><strong>{item.supervisor}</strong></td>
                    <td style={{ textAlign: 'center' }}>{item.totalAsesores}</td>
                    <td style={{ textAlign: 'center' }}><strong style={{ color: 'var(--b2)' }}>{item.reincidentes}</strong></td>
                    <td style={{ textAlign: 'center' }}>{item.porcentajeEquipo}%</td>
                    <td style={{ textAlign: 'center' }}>{item.causalesPromedio}</td>
                    <td style={{ textAlign: 'center' }}>{item.conAntifraude}</td>
                    <td>{item.reincidentes >= 8 ? <span className="b bd">Alto</span> : item.reincidentes >= 4 ? <span className="b bw">Medio</span> : <span className="b bs">Bajo</span>}</td>
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
