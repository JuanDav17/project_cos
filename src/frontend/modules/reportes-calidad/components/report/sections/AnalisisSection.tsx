'use client';

import { useMemo } from 'react';
import { ChartComponent } from '@quality/components/ui/Chart';
import { ProcessedReport } from '@quality/types/report';
import { formatPercent } from '@quality/lib/utils';

interface AnalisisSectionProps {
  data: ProcessedReport;
}

export function AnalisisSection({ data }: AnalisisSectionProps) {
  const narrative = useMemo(() => {
    const topThree = data.paretoSoul.slice(0, 3).map((item) => item.causal);
    const leadAdvisor = data.soulAdvisors[0];
    const findings = `De ${data.kpis.totalAsesores} asesores evaluados en ${data.kpis.totalMonitoreos.toLocaleString('es-CO')} monitoreos únicos, ${data.kpis.asesoresConCriticos} presentaron al menos un error crítico y ${data.kpis.reincidentesCriticos} son reincidentes en errores críticos (${Math.round((data.kpis.reincidentesCriticos / Math.max(data.kpis.asesoresConCriticos, 1)) * 100)}%). ${topThree.length ? `Las causales más reincidentes son ${topThree.join(', ')}. ` : ''}De los reincidentes críticos, ${data.kpis.coincidencias} coinciden en Célula Antifraude, configurando el grupo de mayor riesgo operativo.`;
    const antiguedad = `${leadAdvisor ? `El asesor con mayor número de causales es ${leadAdvisor.nombre} (${leadAdvisor.numCausales} causales, ${leadAdvisor.antMonths} meses de antigüedad). ` : ''}Se identifican patrones en asesores con baja antigüedad y en asesores con alta antigüedad, lo que sugiere brechas tanto de OJT como de control sobre malas prácticas ya arraigadas.`;
    const recomendacion = `Inmediato: talleres de refuerzo en las causales principales para los ${data.kpis.reincidentesCriticos} reincidentes. Alto riesgo (${data.kpis.coincidencias} SOUL+AF): escalar a RRHH y seguimiento disciplinario. OJT: evaluación obligatoria de atributos críticos antes de producción independiente.${data.kpis.hasSpeech ? ' Speech+SOUL: activar alerta combinada cuando error crítico reincidente y fin llamada negativo del cliente >10%.' : ''}`;

    let speechSoul = 'Sin suficientes datos de Speech Analytics para calcular correlación.';
    let speechAf = 'Sin suficientes datos cruzados AF × Speech Analytics.';

    if (data.kpis.hasSpeech) {
      speechSoul = `Los asesores reincidentes muestran agente enojado de ${formatPercent(data.speechStats.reincidentesSoul.enojado)} vs ${formatPercent(data.speechStats.noReincidentesSoul.enojado)} en no reincidentes. Agente negativo: ${formatPercent(data.speechStats.reincidentesSoul.negativo)} vs ${formatPercent(data.speechStats.noReincidentesSoul.negativo)}. Fin llamada negativo del cliente: ${formatPercent(data.speechStats.reincidentesSoul.fin)} vs ${formatPercent(data.speechStats.noReincidentesSoul.fin)}.`;
      speechAf = `Los asesores con alertas AF presentan fin de llamada negativo del cliente en ${formatPercent(data.speechStats.conAf.fin)} vs ${formatPercent(data.speechStats.sinAf.fin)} sin alertas. Agente enojado AF: ${formatPercent(data.speechStats.conAf.enojado)} vs ${formatPercent(data.speechStats.sinAf.enojado)} sin AF.`;
    }

    return { findings, antiguedad, recomendacion, speechSoul, speechAf };
  }, [data]);

  const corrSoulChart = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: ['Ag. enojado', 'Ag. negativo', 'Fin neg. cliente'],
      datasets: [
        { label: 'Reincidentes SOUL', data: [data.speechStats.reincidentesSoul.enojado, data.speechStats.reincidentesSoul.negativo, data.speechStats.reincidentesSoul.fin], backgroundColor: ['rgba(227, 91, 91, 0.88)', 'rgba(15, 23, 42, 0.88)', 'rgba(243, 167, 167, 0.92)'], borderRadius: 7 },
        { label: 'No Reincidentes', data: [data.speechStats.noReincidentesSoul.enojado, data.speechStats.noReincidentesSoul.negativo, data.speechStats.noReincidentesSoul.fin], backgroundColor: ['rgba(227, 91, 91, 0.28)', 'rgba(15, 23, 42, 0.28)', 'rgba(243, 167, 167, 0.42)'], borderRadius: 7 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false }, ticks: { callback: (value: string | number) => `${value}%` }, border: { display: false } } } },
  }), [data.speechStats]);

  const corrAfChart = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: ['Ag. enojado', 'Ag. negativo', 'Fin neg. cliente'],
      datasets: [
        { label: 'Con Antifraude', data: [data.speechStats.conAf.enojado, data.speechStats.conAf.negativo, data.speechStats.conAf.fin], backgroundColor: ['rgba(227, 91, 91, 0.88)', 'rgba(15, 23, 42, 0.88)', 'rgba(243, 167, 167, 0.92)'], borderRadius: 7 },
        { label: 'Sin Antifraude', data: [data.speechStats.sinAf.enojado, data.speechStats.sinAf.negativo, data.speechStats.sinAf.fin], backgroundColor: ['rgba(227, 91, 91, 0.28)', 'rgba(15, 23, 42, 0.28)', 'rgba(243, 167, 167, 0.42)'], borderRadius: 7 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false }, ticks: { callback: (value: string | number) => `${value}%` }, border: { display: false } } } },
  }), [data.speechStats]);

  return (
    <div id="sec-analisis" className="sec on">
      <div className="stitle">Análisis Gerencial</div>
      <div className="anl"><h3>Hallazgos principales</h3><p>{narrative.findings}</p></div>
      <div className="g2">
        <div className="anl"><h3>Impacto en el cliente final</h3><ul><li><strong>Negociación incorrecta:</strong> ofertas fuera del guion generan reclamaciones y pérdida de confianza.</li><li><strong>Marco Jurídico:</strong> el cliente puede aceptar condiciones que no comprende, con riesgo legal.</li><li><strong>Tipificación incorrecta:</strong> re-contactos innecesarios y pérdida de trazabilidad operativa.</li></ul></div>
        <div className="anl"><h3>Impacto para GroupCOS</h3><ul><li><strong>Riesgo contractual:</strong> reincidencia activa cláusulas de penalización en SLA con ETB.</li><li><strong>Riesgo regulatorio:</strong> Marco Jurídico y Habeas Data exponen a sanciones de la SIC.</li><li><strong>Ineficacia de retroalimentación:</strong> asesores repiten errores sin corrección verificable.</li></ul></div>
      </div>

      {data.kpis.hasSpeech ? (
        <>
          <div className="stitle" style={{ marginTop: 8, fontSize: 17 }}>Correlación Speech Analytics × Reincidencia</div>
          <div className="anl anl-sp"><h3>Correlación SOUL crítico × Speech Analytics</h3><p>{narrative.speechSoul}</p></div>
          <div className="anl anl-sp"><h3>Correlación Antifraude × Speech Analytics</h3><p>{narrative.speechAf}</p></div>
          <div className="corr-grid">
            <div className="card"><div className="card-head"><h2>Reincidentes SOUL vs no reincidentes</h2><span className="scope-tag sc-sp">Promedio por grupo</span></div><div className="card-body"><div style={{ height: 260 }}><ChartComponent {...corrSoulChart} /></div></div></div>
            <div className="card"><div className="card-head"><h2>Con AF vs sin AF</h2><span className="scope-tag sc-sp">Promedio por grupo</span></div><div className="card-body"><div style={{ height: 260 }}><ChartComponent {...corrAfChart} /></div></div></div>
          </div>
          <div className="card">
            <div className="card-head"><h2>Top 10 · Mayor % agente enojado</h2><span className="scope-tag sc-sp">Solo asesores con datos Speech</span></div>
            <div className="tw">
              <table>
                <thead><tr><th>#</th><th>Cédula</th><th>Nombre</th><th>Supervisor</th><th>Ag. enojado</th><th>Ag. negativo</th><th>Fin neg. cliente</th><th>Reinc. SOUL</th><th>En AF</th></tr></thead>
                <tbody>
                  {data.speechStats.topEnojado.map((item, index) => (
                    <tr key={item.cedula}>
                      <td><strong>{index + 1}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{item.cedula}</td>
                      <td><strong>{item.nombre}</strong></td>
                      <td style={{ fontSize: 12 }}>{item.supervisor}</td>
                      <td><span className="spb spb-eno">{formatPercent(item.speech.enojado)}</span></td>
                      <td><span className="spb spb-neg">{formatPercent(item.speech.negativo)}</span></td>
                      <td><span className="spb spb-fin">{formatPercent(item.speech.fin)}</span></td>
                      <td>{item.isReincidenteSoul ? <span className="b bd">Sí</span> : <span className="b bgr">No</span>}</td>
                      <td>{item.inAf ? <span className="b bd">Sí</span> : <span className="b bgr">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <div className="anl"><h3>Análisis por antigüedad</h3><p>{narrative.antiguedad}</p></div>
      <div className="anl"><h3>Recomendaciones</h3><p>{narrative.recomendacion}</p></div>
    </div>
  );
}
