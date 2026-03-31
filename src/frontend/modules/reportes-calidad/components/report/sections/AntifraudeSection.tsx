'use client';

import { Fragment, useMemo, useState } from 'react';
import { ProcessedReport } from '@quality/types/report';
import { RegistrosDetalle, SpeechCell, TipoBadge } from '../parts';

interface AntifraudeSectionProps {
  data: ProcessedReport;
}

export function AntifraudeSection({ data }: AntifraudeSectionProps) {
  const [expandedRaf, setExpandedRaf] = useState<Set<number>>(new Set());
  const [expandedAll, setExpandedAll] = useState<Set<number>>(new Set());

  const soulSet = useMemo(() => new Set(data.soulAdvisors.map((advisor) => advisor.cedula)), [data.soulAdvisors]);

  const toggleSet = (current: Set<number>, index: number) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  };

  return (
    <div id="sec-antifraude" className="sec on">
      <div className="stitle">Célula Antifraude <span className="badge-scope">Todos los registros</span></div>
      <div className="alt alt-w"><span className="alt-icon"><i className="bi bi-shield-exclamation" aria-hidden="true" /></span><div>Clic en <strong>Ver registros</strong> para revisar descripción, observación del analista{data.kpis.hasSpeech ? ' y los indicadores de Speech Analytics.' : '.'}</div></div>
      <div className="g3" style={{ marginBottom: 16 }}>
        <div className="kc kc-w"><span className="kc-icon"><i className="bi bi-shield-exclamation" aria-hidden="true" /></span><div className="kc-val">{data.kpis.totalAf}</div><div className="kc-label">Total en AF</div><div className="kc-sub">Todos los registros</div></div>
        <div className="kc kc-b"><span className="kc-icon"><i className="bi bi-exclamation-circle" aria-hidden="true" /></span><div className="kc-val">{data.kpis.reincidentesAf}</div><div className="kc-label">Reinc. en AF</div><div className="kc-sub">Mismo tipo ≥2 registros</div></div>
        <div className="kc kc-b"><span className="kc-icon"><i className="bi bi-link-45deg" aria-hidden="true" /></span><div className="kc-val">{data.kpis.coincidencias}</div><div className="kc-label">Coincidencia SOUL+AF</div><div className="kc-sub">Riesgo más alto</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Asesores reincidentes en Antifraude</h2></div>
        <div className="tw">
          <table>
            <thead><tr><th>#</th><th>Cédula</th><th>Nombre</th><th>Supervisor</th><th>Antigüedad</th><th>Tipo</th><th>Registros</th><th>Riesgo</th>{data.kpis.hasSpeech ? <th className="sp-th">Speech</th> : null}<th>Detalle</th></tr></thead>
            <tbody>
              {data.reincidentesAf.map((advisor, index) => {
                const open = expandedRaf.has(index);
                return (
                  <Fragment key={`${advisor.cedula}-${advisor.tipo}`}>
                    <tr className={advisor.numRegistros >= 5 ? 'row-hl' : ''}>
                      <td>{index + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{advisor.cedula}</td>
                      <td><strong>{advisor.nombre}</strong></td>
                      <td style={{ fontSize: 12 }}>{advisor.supervisor}</td>
                      <td><span className="b bi">{advisor.antiguedad || '—'}</span></td>
                      <td><TipoBadge tipo={advisor.tipo} /></td>
                      <td style={{ textAlign: 'center' }}><strong style={{ color: 'var(--b2)' }}>{advisor.numRegistros}</strong></td>
                      <td>{advisor.numRegistros >= 7 ? <span className="b bd">Muy alto</span> : advisor.numRegistros >= 3 ? <span className="b bw">Alto</span> : <span className="b bi">Medio</span>}</td>
                      {data.kpis.hasSpeech ? <td><SpeechCell speech={advisor.speech} /></td> : null}
                      <td><button type="button" className={`af-expand-btn ${open ? 'open' : ''}`} onClick={() => setExpandedRaf((current) => toggleSet(current, index))}><span className="btn-arr"><i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" /></span> {open ? 'Ocultar' : 'Ver registros'}</button></td>
                    </tr>
                    {open ? <tr className="af-detail-row show"><td className="af-detail-cell" colSpan={data.kpis.hasSpeech ? 10 : 9}><div className="af-detail-inner"><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--b1)', marginBottom: 6 }}>{advisor.numRegistros} registros · {advisor.tipo} · {advisor.nombre}</div><RegistrosDetalle records={advisor.registros} speech={advisor.speech} /></div></td></tr> : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Todos los asesores en Antifraude</h2></div>
        <div className="tw">
          <table>
            <thead><tr><th>#</th><th>Cédula</th><th>Nombre</th><th>Supervisor</th><th>Antigüedad</th><th>Tipos</th><th>Reg.</th><th>Reinc. AF</th><th>Reinc. SOUL</th>{data.kpis.hasSpeech ? <th className="sp-th">Speech</th> : null}<th>Detalle</th></tr></thead>
            <tbody>
              {data.afAdvisors.map((advisor, index) => {
                const open = expandedAll.has(index);
                const types = advisor.tipos.split(' | ');
                return (
                  <Fragment key={advisor.cedula}>
                    <tr className={advisor.esReincidenteAf ? 'row-hl' : ''}>
                      <td>{index + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{advisor.cedula}</td>
                      <td><strong>{advisor.nombre}</strong></td>
                      <td style={{ fontSize: 12 }}>{advisor.supervisor}</td>
                      <td style={{ fontSize: 12 }}>{advisor.antiguedad || '—'}</td>
                      <td><TipoBadge tipo={types[0] || '—'} />{types.length > 1 ? <span style={{ fontSize: 10, color: 'var(--t3)' }}> +{types.length - 1}</span> : null}</td>
                      <td style={{ textAlign: 'center' }}><strong>{advisor.totalReg}</strong></td>
                      <td>{advisor.esReincidenteAf ? <span className="b bd">Sí</span> : <span className="b bs">No</span>}</td>
                      <td>{soulSet.has(advisor.cedula) ? <span className="b bd">Sí</span> : <span className="b bgr">No</span>}</td>
                      {data.kpis.hasSpeech ? <td><SpeechCell speech={advisor.speech} /></td> : null}
                      <td><button type="button" className={`af-expand-btn ${open ? 'open' : ''}`} onClick={() => setExpandedAll((current) => toggleSet(current, index))}><span className="btn-arr"><i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" /></span> {open ? 'Ocultar' : 'Ver registros'}</button></td>
                    </tr>
                    {open ? <tr className="af-detail-row show"><td className="af-detail-cell" colSpan={data.kpis.hasSpeech ? 11 : 10}><div className="af-detail-inner"><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--b1)', marginBottom: 8 }}>{advisor.totalReg} registros · {advisor.nombre}</div><RegistrosDetalle records={advisor.registros} speech={advisor.speech} /></div></td></tr> : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
