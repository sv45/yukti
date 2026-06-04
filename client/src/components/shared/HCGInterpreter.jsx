import React from 'react';

const CONTEXT_LABELS = {
  confirmed_iup:      'Confirmed IUP',
  pul_no_mass:        'PUL — no adnexal mass',
  suspicious_ectopic: 'Suspicious for ectopic',
};

const CITATIONS = {
  confirmed_iup:      'Per Barnhart et al., Obstet Gynecol 2004',
  pul_no_mass:        'Per ACCESS-Bridge PUL protocol, April 2025',
  suspicious_ectopic: 'Per ACCESS-Bridge Ectopic protocol, April 2025',
};

const BANNER = {
  green: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534' },
  amber: { bg: '#FFFBEB', border: '#FCD34D', color: '#78350F' },
  red:   { bg: '#FEF2F2', border: '#FCA5A5', color: '#B91C1C' },
  info:  { bg: 'var(--yk-info-bg)', border: 'var(--yk-info-bd)', color: 'var(--yk-info-fg)' },
};

function interpret(usContext, baselineHCG, pctChange) {
  if (usContext === 'confirmed_iup') {
    if (pctChange == null)  return { level: 'info',  text: 'Enter follow-up hCG for trend interpretation.' };
    if (pctChange < 0)      return { level: 'red',   text: 'Declining hCG. Consistent with pregnancy loss or ectopic — see EPL protocol.' };
    if (pctChange >= 53)    return { level: 'green', text: 'Rise consistent with viable IUP (≥53% in 48 hours).' };
                            return { level: 'red',   text: 'Rise below threshold for viable IUP. Consider non-viable pregnancy — see EPL protocol.' };
  }

  if (usContext === 'pul_no_mass') {
    if (pctChange == null)  return { level: 'info',  text: 'Enter follow-up hCG for trend interpretation.' };
    const minRise = baselineHCG < 1500 ? 49 : baselineHCG <= 3000 ? 40 : 33;
    if (pctChange >= minRise) return { level: 'green', text: 'Rise consistent with probable IUP. Repeat ultrasound when hCG 2,000–3,500 mIU/mL.' };
    if (pctChange <= -50)     return { level: 'amber', text: 'Significant hCG decrease. Consistent with probable early pregnancy loss — see EPL protocol.' };
                              return { level: 'red', text: 'Rise below expected threshold with abnormal hCG trend — ECTOPIC CANNOT BE EXCLUDED. Consider OB/GYN consultation, ectopic risk factors, and patient preference.' };
  }

  if (usContext === 'suspicious_ectopic') {
    // Interpretation based on baseline hCG level, not % change
    if (baselineHCG < 3500)   return { level: 'amber', text: 'Below discriminatory zone. Repeat hCG in 48–72 hours. Review ectopic precautions with patient.' };
    if (baselineHCG < 10000)  return { level: 'amber', text: 'Consider GYN consult. Methotrexate highly effective at this level — see MTX protocol.' };
                              return { level: 'red',   text: 'Emergent GYN consult. Methotrexate less effective at this hCG level — surgical evaluation may be needed.' };
  }

  return { level: 'info', text: 'Unknown context.' };
}

export default function HCGInterpreter({ baselineHCG, followUpHCG, intervalHours = 48, usContext, showContext = true }) {
  if (!baselineHCG || baselineHCG <= 0) return null;
  // For PUL context, only show interpretation when follow-up hCG is available (trend-based)
  if (usContext === 'pul_no_mass' && (followUpHCG == null || followUpHCG <= 0)) return null;

  const pctChange = followUpHCG != null && followUpHCG >= 0
    ? ((followUpHCG - baselineHCG) / baselineHCG) * 100
    : null;

  const { level, text } = interpret(usContext, baselineHCG, pctChange);
  const style = BANNER[level];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {showContext && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 10px', borderRadius: '6px',
          background: 'var(--yk-ink-50, #f9fafb)', border: '1px solid var(--yk-ink-150)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--yk-ink-400)' }}>Interpreting as</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yk-ink-900)' }}>{CONTEXT_LABELS[usContext]}</span>
        </div>
      )}

      {pctChange != null && (() => {
        const isGood = level === 'green';
        const isBad = level === 'red';
        const numColor = isGood ? '#166534' : isBad ? '#B91C1C' : '#92400E';
        return (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--yk-ink-400)', marginBottom: '2px' }}>
              β-hCG rise over {intervalHours}h
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: numColor, lineHeight: 1 }}>
              {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
            </div>
          </div>
        );
      })()}

      {usContext === 'suspicious_ectopic' && (
        <div style={{ fontSize: '11.5px', color: 'var(--yk-ink-400)', fontStyle: 'italic' }}>
          Interpretation based on baseline hCG level, not % change.
        </div>
      )}

      {usContext === 'suspicious_ectopic' && level === 'amber' && !pctChange ? (
        <div style={{
          padding: '12px 14px', borderRadius: '8px',
          background: style.bg, border: `1px solid ${style.border}`,
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: style.color }}>Below discriminatory zone</div>
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li style={{ fontSize: '12.5px', color: style.color, lineHeight: 1.5 }}>Repeat hCG in 48–72 hours</li>
            <li style={{ fontSize: '12.5px', color: style.color, lineHeight: 1.5 }}>Review ectopic precautions with patient</li>
            <li style={{ fontSize: '12.5px', color: style.color, lineHeight: 1.5 }}>Add 48h follow-up value in Step 2 to see trend</li>
          </ul>
        </div>
      ) : (
      <div style={{
        padding: '10px 14px', borderRadius: '8px',
        background: style.bg, border: `1px solid ${style.border}`,
        fontSize: '13px', color: style.color, lineHeight: 1.55, fontWeight: 500,
      }}>
        {text}
      </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--yk-ink-400)' }}>
        {CITATIONS[usContext]}
      </div>
    </div>
  );
}
