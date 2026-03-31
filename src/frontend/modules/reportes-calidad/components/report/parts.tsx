'use client';

import { AFRecord, SoulCausalDetail, SpeechMetrics } from '@quality/types/report';
import { formatPercent, hasSpeechData } from '@quality/lib/utils';

export function TipoBadge({ tipo }: { tipo: string }) {
  const lowered = tipo.toLowerCase();
  const className = lowered.includes('fraude')
    ? 'tbf-fraude'
    : lowered.includes('evasión') || lowered.includes('evasion')
      ? 'tbf-evasion'
      : lowered.includes('no aplica')
        ? 'tbf-noaplica'
        : 'tbf-otro';

  return <span className={`tbf ${className}`}>{tipo || '—'}</span>;
}

export function SpeechCell({ speech }: { speech: SpeechMetrics | null }) {
  if (!hasSpeechData(speech)) {
    return <span className="sp-na">Sin datos</span>;
  }

  return (
    <div className="sp-cell">
      <div className="sp-row">
        <span className="sp-lbl">Enojado</span>
        <div className="sp-bar-wrap"><div className="sp-bar sp-eno" style={{ width: `${Math.min(speech?.enojado || 0, 100)}%` }} /></div>
        <span className="sp-val sp-eno">{formatPercent(speech?.enojado)}</span>
      </div>
      <div className="sp-row">
        <span className="sp-lbl">Ag. negativo</span>
        <div className="sp-bar-wrap"><div className="sp-bar sp-neg" style={{ width: `${Math.min(speech?.negativo || 0, 100)}%` }} /></div>
        <span className="sp-val sp-neg">{formatPercent(speech?.negativo)}</span>
      </div>
      <div className="sp-row">
        <span className="sp-lbl">Fin neg. cliente</span>
        <div className="sp-bar-wrap"><div className="sp-bar sp-fin" style={{ width: `${Math.min(speech?.fin || 0, 100)}%` }} /></div>
        <span className="sp-val sp-fin">{formatPercent(speech?.fin)}</span>
      </div>
    </div>
  );
}

export function SpeechPanel({ speech }: { speech: SpeechMetrics | null }) {
  if (!hasSpeechData(speech)) {
    return <div className="sp-na-panel"><i className="bi bi-soundwave" aria-hidden="true" /> Sin datos de Speech Analytics para este asesor</div>;
  }

  return (
    <div className="sp-panel">
      <div className="sp-panel-title"><i className="bi bi-soundwave" aria-hidden="true" /> Speech Analytics · Promedio de {speech?.interactions || 0} interacciones</div>
      <div className="sp-metrics">
        <div className="sp-metric">
          <span className="sp-metric-icon"><i className="bi bi-emoji-frown" aria-hidden="true" /></span>
          <div className="sp-metric-val sm-eno">{formatPercent(speech?.enojado)}</div>
          <div className="sp-metric-lbl">Agente enojado</div>
          <div className="sp-metric-bar"><div className="sp-metric-fill sm-eno" style={{ width: `${Math.min(speech?.enojado || 0, 100)}%` }} /></div>
        </div>
        <div className="sp-metric">
          <span className="sp-metric-icon"><i className="bi bi-emoji-neutral" aria-hidden="true" /></span>
          <div className="sp-metric-val sm-neg">{formatPercent(speech?.negativo)}</div>
          <div className="sp-metric-lbl">Agente negativo</div>
          <div className="sp-metric-bar"><div className="sp-metric-fill sm-neg" style={{ width: `${Math.min(speech?.negativo || 0, 100)}%` }} /></div>
        </div>
        <div className="sp-metric">
          <span className="sp-metric-icon"><i className="bi bi-telephone-x" aria-hidden="true" /></span>
          <div className="sp-metric-val sm-fin">{formatPercent(speech?.fin)}</div>
          <div className="sp-metric-lbl">Fin llamada neg. cliente</div>
          <div className="sp-metric-bar"><div className="sp-metric-fill sm-fin" style={{ width: `${Math.min(speech?.fin || 0, 100)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

export function CausalCell({ causales }: { causales: SoulCausalDetail[] }) {
  if (!causales.length) {
    return <span style={{ color: 'var(--t3)', fontSize: 12 }}>—</span>;
  }

  const maxValue = Math.max(...causales.map((item) => item.mon));
  return (
    <div className="causal-cell">
      {causales.map((item, index) => {
        const rowClass = index === 0 ? 'ca1' : index === 1 ? 'ca2' : index === 2 ? 'ca3' : '';
        const fillClass = index === 0 ? '' : index === 1 ? 'cf2' : 'cf3';
        const countClass = index === 0 ? '' : index === 1 ? 'cf2' : 'cf3';
        return (
          <div className={`causal-row ${rowClass}`} key={`${item.causal}-${index}`}>
            <div className="causal-name">{item.causal}</div>
            <div className="causal-bar-wrap">
              <div className="causal-bar-outer">
                <div className={`causal-bar-fill ${fillClass}`} style={{ width: `${Math.round((item.mon / maxValue) * 100)}%` }} />
              </div>
            </div>
            <div className={`causal-cnt ${countClass}`}>{item.mon}</div>
            <div className="mon-lbl">mon.</div>
          </div>
        );
      })}
    </div>
  );
}

export function RegistrosDetalle({ records, speech }: { records: AFRecord[]; speech: SpeechMetrics | null }) {
  return (
    <>
      <SpeechPanel speech={speech} />
      {records.map((record, index) => (
        <div className="af-reg-card" key={`${record.idLlamada}-${index}`}>
          <div className="af-reg-head">
            <span className="af-reg-cnt">Reg. {index + 1}</span>
            <TipoBadge tipo={record.tipo} />
            <span style={{ fontSize: 12, color: 'var(--t3)' }}><i className="bi bi-calendar3" aria-hidden="true" /> {record.fecha}</span>
          </div>
          <div className="af-reg-body">
            <div className="af-field">
              <span className="af-field-label"><i className="bi bi-tag" aria-hidden="true" /> Descripción</span>
              <span className="af-field-val fv-desc">{record.descripcion || '—'}</span>
            </div>
            <div className="af-field">
              <span className="af-field-label"><i className="bi bi-calendar3" aria-hidden="true" /> Fecha</span>
              <span className="af-field-val">{record.fecha}</span>
            </div>
            <div className="af-field full">
              <span className="af-field-label"><i className="bi bi-card-text" aria-hidden="true" /> Observación</span>
              <span className="af-field-val fv-obs">{record.observacion || '—'}</span>
            </div>
            <div className="af-field full">
              <span className="af-field-label"><i className="bi bi-link-45deg" aria-hidden="true" /> ID Llamada</span>
              <span className="af-field-val fv-id">{record.idLlamada || '—'}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
