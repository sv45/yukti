import React, { useState, useRef, useEffect } from 'react';
import HCGInterpreter from './shared/HCGInterpreter';
import logoUrl from '../assets/yukti-logo.png';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const BANNER_STYLE = {
  green: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534' },
  amber: { bg: '#FFFBEB', border: '#FCD34D', color: '#78350F' },
  red:   { bg: '#FEF2F2', border: '#FCA5A5', color: '#B91C1C' },
  info:  { bg: 'var(--yk-info-bg)', border: 'var(--yk-info-bd)', color: 'var(--yk-info-fg)' },
};

function Banner({ level = 'info', children }) {
  const s = BANNER_STYLE[level];
  return (
    <div style={{
      padding: '12px 14px', borderRadius: '8px',
      background: s.bg, border: `1.5px solid ${s.border}`,
      color: s.color, fontSize: '13.5px', lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, children, variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  return (
    <button onClick={onClick} style={{
      appearance: 'none', padding: '9px 18px', borderRadius: '6px', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, lineHeight: 1,
      background: isPrimary ? 'var(--yk-sage-500)' : 'white',
      color: isPrimary ? 'white' : 'var(--yk-ink-700)',
      border: isPrimary ? '1px solid var(--yk-sage-600)' : '1px solid var(--yk-ink-200)',
    }}>
      {children}
    </button>
  );
}

function Collapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--yk-ink-150)', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: 'var(--yk-ink-50, #f9fafb)', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600,
        color: 'var(--yk-ink-800)',
      }}>
        {title}
        <span style={{ fontSize: '10px', color: 'var(--yk-ink-400)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
      </button>
      {open && <div style={{ padding: '14px 16px' }}>{children}</div>}
    </div>
  );
}

function SectionHeading({ number, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', marginTop: '28px' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
        background: 'var(--yk-sage-100)', border: '1.5px solid var(--yk-sage-300)',
        fontSize: '11px', fontWeight: 700, color: 'var(--yk-ink-600)',
      }}>{number}</span>
      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--yk-ink-900)' }}>{title}</span>
    </div>
  );
}

function HcgInput({ value, onChange, onSubmit, label = 'Enter hCG (mIU/mL)' }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', color: 'var(--yk-ink-600)', fontWeight: 600 }}>{label}</label>
        <input
          type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && value && onSubmit()}
          style={{
            width: '160px', padding: '8px 12px', border: '1.5px solid var(--yk-ink-200)',
            borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', color: 'var(--yk-ink-900)',
          }}
          placeholder="0"
        />
      </div>
      <ActionBtn onClick={onSubmit} variant="primary">Interpret</ActionBtn>
    </div>
  );
}

// ─── MTX data ─────────────────────────────────────────────────────────────────
const MTX_ABS_CI = [
  'Ruptured ectopic or hemodynamic instability',
  'Intrauterine pregnancy',
  'Evidence of immunodeficiency',
  'Moderate to severe anemia, leukopenia, or thrombocytopenia',
  'Active pulmonary disease',
  'Active peptic ulcer disease',
  'Clinically important hepatic or renal dysfunction',
  'Breastfeeding',
  'Sensitivity to methotrexate',
  'Inability to participate in follow-up',
];

const MTX_REL_CI = [
  'Cardiac activity detected on ultrasound',
  'High initial hCG',
  'Adnexal mass ≥4.0 cm on TVUS',
  'Refusal to accept blood transfusion if needed',
];

function mtxSuccessRate(hcg) {
  if (hcg < 1000)  return { rate: '98%', range: '<1,000' };
  if (hcg < 2000)  return { rate: '94%', range: '1,000–1,999' };
  if (hcg < 5000)  return { rate: '96%', range: '2,000–4,999' };
  if (hcg < 10000) return { rate: '85%', range: '5,000–9,999' };
  return             { rate: '81%', range: '≥10,000' };
}

const PATIENT_ED_BULLETS = [
  'Avoid: folic acid/prenatal vitamins, alcohol, NSAIDs, sexual activity, strenuous exercise.',
  'Mild to moderate pain, nausea, and vomiting are expected. Take prescribed pain medication as directed.',
  'Go to the emergency department immediately for: severe abdominal pain, dizziness, or fainting.',
  'Weekly hCG blood draws until level reaches zero. Do not become pregnant for 3 months after treatment.',
  'Stay within 30 minutes of an emergency department until treatment is confirmed effective.',
];
const PATIENT_ED_TEXT = PATIENT_ED_BULLETS.join('\n');

const RISK_FACTORS = [
  'Prior ectopic pregnancy — 10% risk after one prior ectopic, 25% after two',
  'IUD in place — approximately 50% of pregnancies with IUD are ectopic',
  'History of PID, chlamydia, or gonorrhea',
  'Prior tubal surgery — 10–15% risk',
  'Infertility or fertility treatment',
  'Age >35',
  'Smoking',
];

const HCG_REF_ROWS = [
  { label: 'Baseline <1,500 mIU/mL', value: '≥49% rise in 48h (viable IUP)' },
  { label: 'Baseline 1,500–3,000',   value: '≥40% rise in 48h (viable IUP)' },
  { label: 'Baseline >3,000',        value: '≥33% rise in 48h (viable IUP)' },
  { label: 'EPL — 48h decrease',     value: '≥21% fall' },
  { label: 'EPL — 4-day decrease',   value: '≥85% fall' },
  { label: 'EPL — 7-day decrease',   value: '≥60% fall' },
  { label: 'Non-viable IUP (SFP 2024)', value: '<11% rise over 48h in IUP of uncertain viability' },
];

const REFS_LIST = [
  'ACCESS-Bridge. PUL & Ectopic Pregnancy in the ED (Restricted states). April 2025. CC BY-NC-ND 4.0.',
  'ACCESS-Bridge. PUL & Ectopic Pregnancy in the ED (Unrestricted states). April 2025. CC BY-NC-ND 4.0.',
  'American College of Obstetricians and Gynecologists. Practice Bulletin No. 193: Tubal Ectopic Pregnancy. Obstet Gynecol 2018;131(3):e91–e103.',
  'Menon S et al. Fertil Steril 2007;87(3):481–4.',
  'Connolly A et al. Obstet Gynecol 2013;121(1):65–70.',
  'Barnhart KT et al. Obstet Gynecol 2004;104(1):50–55.',
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function PULEctopicTab({ onSwitchTab, entryState = '', legalStatus = null }) {
  const [ruptureAnswer, setRuptureAnswer]     = useState(null); // null | 'yes' | 'no'
  const [impression, setImpression]           = useState(null); // null | 'iup' | 'pul' | 'ectopic'
  const [highRisk, setHighRisk]               = useState(null); // null | 'yes' | 'no'
  const [intention, setIntention]             = useState(null); // for IUP path
  const [s2Baseline, setS2Baseline]           = useState('');
  const [s2FollowUp, setS2FollowUp]           = useState('');
  const [showFollowUp, setShowFollowUp]       = useState(false);
  const s2BaselineVal = parseFloat(s2Baseline) > 0 ? parseFloat(s2Baseline) : null;
  const s2FollowUpVal = parseFloat(s2FollowUp) > 0 ? parseFloat(s2FollowUp) : null;
  // keep for Section 4 follow-up interpreter
  const [sec2Baseline, setSec2Baseline]       = useState('');
  const [sec2FollowUp, setSec2FollowUp]       = useState('');
  const [copied, setCopied]                   = useState(false);
  const [usReportText, setUsReportText]       = useState('');
  const [usHcgInput, setUsHcgInput]           = useState('');
  const [usInterpreting, setUsInterpreting]   = useState(false);
  const [usInterpretError, setUsInterpretError] = useState(null);
  const [usInterpretResult, setUsInterpretResult] = useState(null);
  const sec2Ref = useRef(null);
  const [sec1Done, setSec1Done] = useState(false);
  const [sec2Done, setSec2Done] = useState(false);
  const [sec3Done, setSec3Done] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = e => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const pulMobileStep = !sec1Done ? 1 : !sec2Done ? 2 : !sec3Done ? 3 : 4;
  const pulMobileLabels = ['Initial Exam', 'Baseline hCG', 'Ultrasound Findings'];
  const pulDoneCount = [sec1Done, sec2Done, sec3Done].filter(Boolean).length;
  const PulMarkDone = ({ eligibilityOk, done, onDone }) => {
    if (done || !eligibilityOk) return null;
    return (
      <div style={{ borderTop: '1px solid var(--yk-ink-100)', padding: '12px 18px', background: 'var(--yk-sage-50, #F0FDF4)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onDone} style={{
          appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '9px 20px', borderRadius: '6px',
          background: 'var(--yk-sage-500)', border: 'none',
          fontSize: '13px', fontWeight: 700, color: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
            <path d="M4 7l2.2 2.2L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mark step done
        </button>
      </div>
    );
  };

  const isRestricted = legalStatus?.status === 'banned';

  const setImpressionAndReset = (val) => {
    setImpression(val); setHighRisk(null); setIntention(null);
  };

  const fetchUSInterpretation = async () => {
    setUsInterpretError(null);
    if (!usReportText.trim()) {
      if (!impression) setUsInterpretError('Enter ultrasound findings first.');
      return;
    }
    setUsInterpreting(true);
    const suffix = s2BaselineVal
      ? `\n\nBaseline hCG: ${s2BaselineVal.toLocaleString()} mIU/mL` : '';
    try {
      const res = await fetch('/api/interpret-us', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: usReportText + suffix }),
      });
      if (!res.ok) { setUsInterpretError(`Server error ${res.status}`); return; }
      setUsInterpretResult(await res.json());
    } catch (err) { setUsInterpretError(`Network error: ${err.message}`); }
    finally { setUsInterpreting(false); }
  };

  const applyInterpretation = () => {
    const key = usInterpretResult?.classification?.impression_key;
    if (['iup', 'pul', 'ectopic'].includes(key)) setImpressionAndReset(key);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(PATIENT_ED_TEXT).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const IMPRESSION_CARDS = [
    { value: 'iup',          label: 'Intrauterine pregnancy',                        desc: 'Yolk sac or embryo identified within intrauterine gestational sac' },
    { value: 'pul',          label: 'Pregnancy of unknown location',                  desc: 'No IUP, no adnexal mass — ectopic not yet excluded' },
    { value: 'ectopic',      label: 'Suspected ectopic pregnancy',                   desc: 'No intrauterine pregnancy; adnexal mass / suspicious findings present' },
    { value: 'indeterminate',label: 'Intrauterine findings — indeterminate viability', desc: 'Gestational sac visible but too early or small to assess viability' },
    { value: 'epl',          label: 'Early pregnancy loss',                           desc: 'Intrauterine pregnancy meets criteria for nonviability' },
  ];

  const sec2Context = impression === 'ectopic' ? 'suspicious_ectopic' : 'pul_no_mass';

  return (
    <div style={{ padding: '0 0 120px' }}>

      {(!isMobile && sec1Done) ? (
        <div onClick={() => setSec1Done(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'var(--yk-sage-50)', border: '1px solid var(--yk-sage-200)', borderLeft: '4px solid var(--yk-sage-500)', borderRadius: '10px', padding: '14px 18px', margin: '16px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" fill="#10B981"/><path d="M6.5 11l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--yk-sage-700)' }}>Step 1: Initial Exam{ruptureAnswer ? ` — ${ruptureAnswer === 'yes' ? 'Yes (rupture suspected)' : 'No'}` : ''}</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--yk-sage-600)', fontWeight: 600, textDecoration: 'underline' }}>Edit</span>
        </div>
      ) : (isMobile && pulMobileStep !== 1) ? null : <div>
        <SectionHeading number="1" title="Initial Exam" />
        <div style={{ border: '1.5px solid var(--yk-ink-150)', borderRadius: '10px', background: 'white', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--yk-ink-900)', marginBottom: '3px' }}>
              Symptoms of ruptured ectopic?
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--yk-ink-500)', marginBottom: '12px' }}>
              Hemodynamic instability · unilateral pain · peritoneal signs · positive FAST
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ActionBtn onClick={() => setRuptureAnswer('yes')} variant={ruptureAnswer === 'yes' ? 'primary' : 'secondary'}>Yes</ActionBtn>
              <ActionBtn onClick={() => setRuptureAnswer('no')} variant={ruptureAnswer === 'no' ? 'primary' : 'secondary'}>No</ActionBtn>
            </div>
            {ruptureAnswer === 'yes' && (
              <div style={{ marginTop: '12px' }}>
                <Banner level="red">
                  <strong style={{ fontSize: '14px' }}>Stabilize and emergent OB/GYN consult.</strong>
                </Banner>
              </div>
            )}
          </div>
          <PulMarkDone eligibilityOk={ruptureAnswer !== null} done={sec1Done} onDone={() => setSec1Done(true)} />
        </div>
      </div>}

      {(!isMobile && sec2Done) ? (
        <div onClick={() => setSec2Done(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'var(--yk-sage-50)', border: '1px solid var(--yk-sage-200)', borderLeft: '4px solid var(--yk-sage-500)', borderRadius: '10px', padding: '14px 18px', margin: '16px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" fill="#10B981"/><path d="M6.5 11l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--yk-sage-700)' }}>Step 2: Baseline hCG</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--yk-sage-600)', fontWeight: 600, textDecoration: 'underline' }}>Edit</span>
        </div>
      ) : (isMobile && pulMobileStep !== 2) ? null : <div>
        <SectionHeading number="2" title="Baseline hCG" />
      <div style={{ border: '1.5px solid var(--yk-ink-150)', borderRadius: '10px', background: 'white', marginBottom: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--yk-ink-600)', fontWeight: 600 }}>Baseline hCG (mIU/mL)</label>
              <input type="number" min="0" value={s2Baseline} onChange={e => setS2Baseline(e.target.value)}
                placeholder="0" style={{ width: '150px', padding: '8px 12px', border: '1.5px solid var(--yk-ink-200)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
            {showFollowUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--yk-ink-600)', fontWeight: 600 }}>48h follow-up hCG (mIU/mL)</label>
                <input type="number" min="0" value={s2FollowUp} onChange={e => setS2FollowUp(e.target.value)}
                  placeholder="0" style={{ width: '150px', padding: '8px 12px', border: '1.5px solid var(--yk-ink-200)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            )}
          </div>
          {!showFollowUp && (
            <button onClick={() => setShowFollowUp(true)} style={{
              appearance: 'none', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '12.5px', color: 'var(--yk-sage-600)', fontWeight: 600,
              padding: 0, textAlign: 'left',
            }}>+ Add 48-hour follow-up value</button>
          )}
        </div>
        <PulMarkDone eligibilityOk={true} done={sec2Done} onDone={() => setSec2Done(true)} />
      </div>

      </div>}

      {(!isMobile && sec3Done) ? (
        <div onClick={() => setSec3Done(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'var(--yk-sage-50)', border: '1px solid var(--yk-sage-200)', borderLeft: '4px solid var(--yk-sage-500)', borderRadius: '10px', padding: '14px 18px', margin: '16px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" fill="#10B981"/><path d="M6.5 11l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--yk-sage-700)' }}>Step 3: Ultrasound Findings{impression ? ` — ${IMPRESSION_CARDS.find(c=>c.value===impression)?.label ?? impression}` : ''}</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--yk-sage-600)', fontWeight: 600, textDecoration: 'underline' }}>Edit</span>
        </div>
      ) : (isMobile && pulMobileStep !== 3) ? null : <div>
        <SectionHeading number="3" title="Ultrasound Findings" />
      <div style={{ border: '1.5px solid var(--yk-ink-150)', borderRadius: '10px', background: 'white', marginBottom: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Impression cards — always visible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yk-ink-700)', marginBottom: '10px' }}>Ultrasound impression</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {IMPRESSION_CARDS.map(card => {
                  const isSelected = impression === card.value;
                  const isEctopic = card.value === 'ectopic';
                  const isPul = card.value === 'pul';
                  return (
                    <div key={card.value} style={{
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? 'var(--yk-sage-500)' : 'var(--yk-ink-150)'}`,
                      background: isSelected ? 'var(--yk-sage-50, #f4f7f4)' : 'white',
                      transition: 'border-color 0.12s, background 0.12s',
                      overflow: 'hidden',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                        <button onClick={() => setImpressionAndReset(card.value)} style={{
                          appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          textAlign: 'left', flex: 1,
                          border: 'none', background: 'transparent', padding: 0,
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--yk-ink-900)' }}>{card.label}</span>
                          <span style={{ fontSize: '12px', color: 'var(--yk-ink-500)', marginTop: '2px' }}>{card.desc}</span>
                        </button>
                        {isSelected && (
                          <button onClick={() => setImpressionAndReset(null)} style={{
                            appearance: 'none', background: 'none', border: '1px solid var(--yk-ink-200)',
                            borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: '11px', color: 'var(--yk-ink-400)', padding: '2px 7px', flexShrink: 0, marginLeft: '8px',
                          }}>✕ Clear</button>
                        )}
                      </div>
                      {isEctopic && isSelected && (
                        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--yk-sage-200)' }}>
                          <div style={{ paddingTop: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--yk-ink-800)' }}>Are any high-risk features present?</div>
                          <div style={{ fontSize: '12px', color: 'var(--yk-ink-500)', lineHeight: 1.5 }}>
                            Adnexal mass ≥3.5 cm · Cardiac activity · Interstitial or C-section ectopic · Substantial free fluid
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['yes', 'no'].map(val => (
                              <button key={val} onClick={() => setHighRisk(val)} style={{
                                appearance: 'none', padding: '7px 18px', borderRadius: '6px', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                                background: highRisk === val ? (val === 'yes' ? '#B91C1C' : 'var(--yk-sage-600)') : 'white',
                                color: highRisk === val ? 'white' : 'var(--yk-ink-700)',
                                border: '1px solid var(--yk-ink-200)',
                              }}>{val === 'yes' ? 'Yes' : 'No'}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

        </div>

        {/* Paste & interpret — below impression cards, fully optional */}
        <div style={{ borderTop: '1px solid var(--yk-ink-100)', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yk-ink-500)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Paste report for AI interpretation <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </div>
          <textarea rows={3} placeholder="Paste ultrasound report" value={usReportText} onChange={e => setUsReportText(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--yk-ink-150)', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', marginBottom: '10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <ActionBtn onClick={fetchUSInterpretation} variant="secondary">
              {usInterpreting ? 'Interpreting…' : 'Input'}
            </ActionBtn>
            {s2BaselineVal && <span style={{ fontSize: '12px', color: 'var(--yk-ink-400)' }}>Using hCG {s2BaselineVal.toLocaleString()} mIU/mL from Step 2</span>}
            {usInterpretError && <span style={{ fontSize: '12px', color: '#B91C1C' }}>{usInterpretError}</span>}
          </div>
          {usInterpretResult && (() => {
            const key = usInterpretResult.classification?.impression_key;
            const labelMap = { iup: 'Intrauterine pregnancy', pul: 'Pregnancy of unknown location', ectopic: 'Suspected ectopic pregnancy' };
            const label = labelMap[key] ?? usInterpretResult.classification?.category?.replace(/_/g, ' ');
            const actionable = ['iup', 'pul', 'ectopic'].includes(key);
            return (
              <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '8px', background: 'var(--yk-info-bg)', border: '1px solid var(--yk-info-bd)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--yk-info-fg)', marginBottom: '6px' }}>AI impression: {label}</div>
                <ul style={{ margin: '0 0 10px', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--yk-info-fg)' }}>
                  {usInterpretResult.classification?.criteria?.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
                {actionable && <ActionBtn onClick={applyInterpretation}>Apply impression →</ActionBtn>}
              </div>
            );
          })()}
        </div>
      </div>
      <PulMarkDone eligibilityOk={impression !== null} done={sec3Done} onDone={() => setSec3Done(true)} />
      </div>
      </div>}

      <div ref={sec2Ref} />

      {/* Clinical Assessment (step 4 on mobile) */}
      {(!isMobile || pulMobileStep === 4) && (impression || s2BaselineVal || (ruptureAnswer === 'yes' && s2BaselineVal)) && (() => {
        const pulAbnormalRise = impression === 'pul' && s2BaselineVal && s2FollowUpVal && (() => {
          const pct = ((s2FollowUpVal - s2BaselineVal) / s2BaselineVal) * 100;
          const minRise = s2BaselineVal < 1500 ? 49 : s2BaselineVal <= 3000 ? 40 : 33;
          return pct > 0 && pct < minRise;
        })();
        const isUrgent =
          ruptureAnswer === 'yes' ||
          (impression === 'pul' && s2BaselineVal >= 10000) ||
          pulAbnormalRise ||
          (impression === 'ectopic' && highRisk === 'yes') ||
          (impression === 'ectopic' && highRisk === 'no');
        const boxStyle = isUrgent
          ? { border: '1.5px solid #FCA5A5', background: '#FEF2F2' }
          : { border: '1.5px solid var(--yk-sage-300)', background: 'var(--yk-sage-100, #E6EBE5)', borderTop: '3px solid var(--yk-sage-500)' };
        return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '28px', marginBottom: '14px' }}>
            <img src={logoUrl} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--yk-ink-900)' }}>Clinical Assessment</span>
          </div>
          <div style={{ ...boxStyle, borderRadius: '10px', padding: '20px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Impression badge — dynamically updated based on hCG */}
            {(() => {
              const effectiveHCG = s2FollowUpVal || s2BaselineVal;
              const pulHighRisk = impression === 'pul' && effectiveHCG >= 3500;
              const imp =
                ruptureAnswer === 'yes' ? { label: 'Ruptured ectopic / hemodynamic instability', bg: '#FEE2E2', border: '#FCA5A5', color: '#7F1D1D' } :
                impression === 'ectopic' ? { label: 'Suspected ectopic pregnancy', bg: '#FEE2E2', border: '#FCA5A5', color: '#7F1D1D' } :
                pulHighRisk ? { label: 'OB/GYN consult indicated due to concern for possible ectopic pregnancy', bg: '#FEE2E2', border: '#FCA5A5', color: '#7F1D1D' } :
                impression === 'pul' ? { label: 'Pregnancy of unknown location / Indeterminate', bg: '#FEF3C7', border: '#FCD34D', color: '#78350F' } :
                impression === 'iup' ? null :
                impression === 'indeterminate' ? { label: 'Indeterminate — early gestational sac', bg: '#FEF3C7', border: '#FCD34D', color: '#78350F' } :
                null;
              if (!imp) return null;
              return (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: imp.bg, border: `1.5px solid ${imp.border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: imp.color, marginBottom: '2px', opacity: 0.7 }}>Impression</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: imp.color }}>{imp.label}</div>
                </div>
              );
            })()}

            {/* Rupture yes + hCG */}
            {ruptureAnswer === 'yes' && s2BaselineVal && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#B91C1C', marginBottom: '6px' }}>Stabilize and emergent OB/GYN consult.</div>
                <div style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.6 }}>
                  Symptoms consistent with ruptured ectopic. hCG {s2BaselineVal.toLocaleString()} mIU/mL confirms active pregnancy. Do not delay surgical evaluation.
                </div>
              </div>
            )}

            {/* IUP */}
            {impression === 'iup' && ruptureAnswer !== 'yes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Banner level="green">
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.7, marginBottom: '2px' }}>Impression</div>
                  <strong>Intrauterine pregnancy confirmed — options counseling required</strong>
                </Banner>
                <div style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)' }}>What is the patient's pregnancy intention?</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Desired', 'Undecided', 'Undesired'].map(label => {
                    const val = label.toLowerCase();
                    return (
                      <button key={val} onClick={() => setIntention(val)} style={{
                        appearance: 'none', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                        background: intention === val ? '#10B981' : 'white',
                        color: intention === val ? 'white' : 'var(--yk-ink-700)',
                        border: '1px solid var(--yk-ink-200)',
                      }}>{label}</button>
                    );
                  })}
                </div>
                {intention === 'undesired' && !isRestricted && (
                  <ActionBtn onClick={() => onSwitchTab('med-abortion')}>Go to Medication Abortion pathway →</ActionBtn>
                )}
                {(intention === 'desired' || intention === 'undecided') && (
                  <div style={{ fontSize: '12.5px', color: '#166534' }}>Refer to OB/GYN. Offer prenatal vitamins.</div>
                )}
              </div>
            )}

            {/* PUL */}
            {impression === 'pul' && ruptureAnswer !== 'yes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {s2BaselineVal ? (
                  <>
                    {(() => {
                      let bullets = [], rec = null, recRed = false;
                      if (s2FollowUpVal) {
                        const pct = ((s2FollowUpVal - s2BaselineVal) / s2BaselineVal) * 100;
                        const minRise = s2BaselineVal < 1500 ? 49 : s2BaselineVal <= 3000 ? 40 : 33;
                        const dzLabel = s2FollowUpVal >= 10000 ? 'well above the discriminatory zone' : s2FollowUpVal >= 3500 ? 'at the discriminatory zone (3,500 mIU/mL)' : 'below the discriminatory zone (3,500 mIU/mL)';
                        const dzExplain = s2FollowUpVal >= 3500 ? 'the threshold above which an IUP should be visible on TVUS if present' : 'the level below which an IUP may not yet be visible on TVUS';
                        if (pct <= -50) {
                          bullets = [
                            `hCG declined ${Math.abs(pct).toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel}`,
                            `A decline of this magnitude (≥50%) is consistent with possible spontaneous resolution`,
                            `Continue serial hCG until it reaches zero and maintain ectopic precautions throughout`,
                          ];
                        } else if (pct < 0) {
                          rec = 'Discuss Methotrexate or surgical management with OB/GYN.'; recRed = true;
                          bullets = [
                            `hCG declined ${Math.abs(pct).toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel}`,
                            `An inadequate decline of less than 50% suggests the ectopic is unlikely to resolve spontaneously`,
                          ];
                        } else if (pct >= minRise) {
                          rec = 'Repeat ultrasound and close follow-up required.';
                          bullets = [
                            `hCG rose ${pct.toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel} (${dzExplain})`,
                            `A rise of ${pct.toFixed(0)}% meets the expected minimum of ≥${minRise}% for this baseline range — seen with both early IUP not yet visible on TVUS and ectopic rising at a normal rate`,
                            `Ectopic cannot be excluded`,
                          ];
                        } else {
                          rec = 'OB/GYN consult for Methotrexate consideration.'; recRed = true;
                          bullets = [
                            `hCG rose ${pct.toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel} (${dzExplain})`,
                            `A rise of ${pct.toFixed(0)}% falls below the expected minimum of ≥${minRise}% for this baseline range`,
                            `Abnormal rise pattern at this level is inconsistent with a viable IUP and raises concern for ectopic pregnancy`,
                          ];
                        }
                      } else {
                        const hcg = s2BaselineVal;
                        if (hcg >= 10000) {
                          bullets = [
                            `hCG ${hcg.toLocaleString()} mIU/mL — well above the discriminatory zone (3,500 mIU/mL, the threshold above which an IUP should be visible on TVUS)`,
                            `Ectopic must be excluded emergently`,
                          ];
                        } else if (hcg >= 3500) {
                          bullets = [
                            `hCG ${hcg.toLocaleString()} mIU/mL — at or above the discriminatory zone (3,500 mIU/mL, the threshold above which an IUP should be visible on TVUS if present)`,
                            `No IUP identified at this level; ectopic must be excluded urgently`,
                            `48h follow-up hCG to assess trend`,
                          ];
                        } else {
                          bullets = [
                            `hCG ${hcg.toLocaleString()} mIU/mL — below the discriminatory zone (3,500 mIU/mL, the level below which an IUP may not yet be visible on TVUS)`,
                            `Ectopic cannot be excluded`,
                            `48h follow-up hCG to assess trend`,
                          ];
                        }
                      }
                      return (
                        <>
                          {rec && <div style={{ fontSize: '13px', color: recRed ? '#B91C1C' : 'var(--yk-ink-800)', fontWeight: 700, lineHeight: 1.6 }}>{rec}</div>}
                          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {bullets.map((b, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--yk-ink-700)', lineHeight: 1.55 }}>{b}</li>)}
                          </ul>
                          <div style={{ fontSize: '11px', color: 'var(--yk-ink-400)' }}>Per ACCESS-Bridge Ectopic protocol, April 2025</div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--yk-ink-400)', fontStyle: 'italic' }}>Enter baseline hCG in Step 2 to complete interpretation.</div>
                )}

                {/* Dropdowns for PUL — always visible when impression is pul */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Collapsible title="Ectopic Risk Factors">
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {RISK_FACTORS.map((r, i) => (
                        <li key={i} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', lineHeight: 1.5 }}>{r}</li>
                      ))}
                    </ul>
                  </Collapsible>
                  <Collapsible title="Methotrexate Reference Card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--yk-ink-700)', lineHeight: 1.6 }}>
                        <strong>Before prescribing Methotrexate in the ED:</strong> Confirm you have arranged referral relationships for follow-up OR an assigned person in your facility to track hCGs until zero.
                      </div>
                      <Collapsible title="Contraindications">
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--yk-ink-800)', marginBottom: '8px' }}>Absolute Contraindications</div>
                        <ul style={{ margin: '0 0 12px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {MTX_ABS_CI.map((ci, i) => <li key={i} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', lineHeight: 1.5 }}>{ci}</li>)}
                        </ul>
                        <div style={{ borderTop: '1px solid var(--yk-ink-150)', paddingTop: '10px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--yk-ink-800)', marginBottom: '8px' }}>Relative Contraindications</div>
                          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {MTX_REL_CI.map((ci, i) => <li key={i} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', lineHeight: 1.5 }}>{ci}</li>)}
                          </ul>
                        </div>
                      </Collapsible>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--yk-ink-800)', marginBottom: '6px' }}>Day 1 / 4 / 7 Protocol — hCG &lt;5,000, no adnexal mass &gt;3.5cm</div>
                        {[
                          { day: 'Day 1', detail: 'CBC, AST, ALT, creatinine. If WNL → Methotrexate IM 50 mg/m².' },
                          { day: 'Day 4', detail: 'Repeat hCG — rise expected, do not interpret as failure.' },
                          { day: 'Day 7', detail: 'Need ≥15% drop from Day 4. If <15% → repeat Methotrexate or refer to surgery.' },
                        ].map(r => (
                          <div key={r.day} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', marginBottom: '4px' }}>
                            <strong style={{ color: 'var(--yk-sage-700)' }}>{r.day}: </strong>{r.detail}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--yk-ink-400)' }}>Per ACCESS-Bridge Ectopic protocol, April 2025</div>
                    </div>
                  </Collapsible>
                </div>
              </div>
            )}

            {/* Ectopic */}
            {impression === 'ectopic' && ruptureAnswer !== 'yes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {highRisk === 'yes' && (
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#B91C1C' }}>Stabilize and emergent OB/GYN consult.</div>
                )}
                {highRisk === 'no' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      let bullets = [], rec = null, recRed = false;
                      if (!s2BaselineVal) {
                        bullets = ['Clinical concern for ectopic pregnancy. Enter baseline hCG in Step 2 to guide management.'];
                      } else if (s2FollowUpVal) {
                        const pct = ((s2FollowUpVal - s2BaselineVal) / s2BaselineVal) * 100;
                        const minRise = s2BaselineVal < 1500 ? 49 : s2BaselineVal <= 3000 ? 40 : 33;
                        const dzLabel = s2FollowUpVal >= 10000 ? 'well above the discriminatory zone' : s2FollowUpVal >= 3500 ? 'at the discriminatory zone (3,500 mIU/mL)' : 'below the discriminatory zone (3,500 mIU/mL)';
                        const dzExplain = s2FollowUpVal >= 3500 ? 'the threshold above which an IUP should be visible on TVUS if present' : 'the level below which an IUP may not yet be visible on TVUS';
                        if (pct <= -50) {
                          bullets = [
                            `hCG declined ${Math.abs(pct).toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel}`,
                            `A decline of this magnitude (≥50%) is consistent with possible spontaneous resolution`,
                            `Continue serial hCG until it reaches zero and maintain ectopic precautions throughout`,
                          ];
                        } else if (pct < 0) {
                          rec = 'Discuss Methotrexate or surgical management with OB/GYN.'; recRed = true;
                          bullets = [
                            `hCG declined ${Math.abs(pct).toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel}`,
                            `An inadequate decline of less than 50% suggests the ectopic is unlikely to resolve spontaneously`,
                          ];
                        } else if (pct >= minRise) {
                          rec = 'Repeat ultrasound and close follow-up required.';
                          bullets = [
                            `hCG rose ${pct.toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel} (${dzExplain})`,
                            `A rise of ${pct.toFixed(0)}% meets the expected minimum of ≥${minRise}% for this baseline range — seen with both early IUP not yet visible on TVUS and ectopic rising at a normal rate`,
                            `Ectopic cannot be excluded`,
                          ];
                        } else {
                          rec = 'OB/GYN consult for Methotrexate consideration.'; recRed = true;
                          bullets = [
                            `hCG rose ${pct.toFixed(0)}% over 48h, now ${s2FollowUpVal.toLocaleString()} mIU/mL — ${dzLabel} (${dzExplain})`,
                            `A rise of ${pct.toFixed(0)}% falls below the expected minimum of ≥${minRise}% for this baseline range`,
                            `Abnormal rise pattern at this level is inconsistent with a viable IUP and raises strong concern for ectopic pregnancy`,
                          ];
                        }
                      } else {
                        const hcg = s2BaselineVal;
                        if (hcg >= 10000) {
                          rec = 'OB/GYN consult indicated due to concern for possible ectopic pregnancy.'; recRed = true;
                          bullets = [
                            `hCG ${hcg.toLocaleString()} mIU/mL — well above the discriminatory zone (3,500 mIU/mL, the threshold above which an IUP should be visible on TVUS)`,
                            `Ectopic must be excluded emergently`,
                          ];
                        } else if (hcg >= 3500) {
                          rec = 'OB/GYN consult for Methotrexate consideration.'; recRed = true;
                          bullets = [
                            `hCG ${hcg.toLocaleString()} mIU/mL — at the discriminatory zone (3,500 mIU/mL, the threshold above which an IUP should be visible on TVUS if present)`,
                            `No IUP identified at this level; ectopic must be excluded urgently`,
                            `48h follow-up hCG to assess trend`,
                          ];
                        } else {
                          rec = 'Serial hCG in 48–72h and consult OB/GYN.'; recRed = true;
                          bullets = [
                            `hCG ${hcg.toLocaleString()} mIU/mL — below the discriminatory zone (3,500 mIU/mL, the level below which an IUP may not yet be visible on TVUS)`,
                            `Ectopic cannot be excluded`,
                            `48h follow-up hCG to assess trend`,
                          ];
                        }
                      }
                      return (
                        <>
                          {rec && <div style={{ fontSize: '13px', color: recRed ? '#B91C1C' : 'var(--yk-ink-800)', fontWeight: 700, lineHeight: 1.6 }}>{rec}</div>}
                          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {bullets.map((b, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--yk-ink-700)', lineHeight: 1.55 }}>{b}</li>)}
                          </ul>
                          <div style={{ fontSize: '11px', color: 'var(--yk-ink-400)' }}>Per ACCESS-Bridge Ectopic protocol, April 2025</div>
                        </>
                      );
                    })()}
                  </div>
                )}
                {!highRisk && (
                  <div style={{ fontSize: '13px', color: 'var(--yk-ink-400)', fontStyle: 'italic' }}>Answer the high-risk features question in Step 3 to continue.</div>
                )}

                {/* Dropdowns always visible when ectopic impression is selected */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Collapsible title="Ectopic Risk Factors">
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {RISK_FACTORS.map((r, i) => (
                        <li key={i} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', lineHeight: 1.5 }}>{r}</li>
                      ))}
                    </ul>
                  </Collapsible>
                  <Collapsible title="Methotrexate Reference Card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--yk-ink-700)', lineHeight: 1.6 }}>
                        <strong>Before prescribing Methotrexate in the ED:</strong> Confirm you have arranged referral relationships for follow-up OR an assigned person in your facility to track hCGs until zero.
                      </div>
                      <Collapsible title="Contraindications">
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--yk-ink-800)', marginBottom: '8px' }}>Absolute Contraindications</div>
                        <ul style={{ margin: '0 0 12px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {MTX_ABS_CI.map((ci, i) => <li key={i} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', lineHeight: 1.5 }}>{ci}</li>)}
                        </ul>
                        <div style={{ borderTop: '1px solid var(--yk-ink-150)', paddingTop: '10px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--yk-ink-800)', marginBottom: '8px' }}>Relative Contraindications</div>
                          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {MTX_REL_CI.map((ci, i) => <li key={i} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', lineHeight: 1.5 }}>{ci}</li>)}
                          </ul>
                        </div>
                      </Collapsible>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--yk-ink-800)', marginBottom: '6px' }}>Day 1 / 4 / 7 Protocol — hCG &lt;5,000, no adnexal mass &gt;3.5cm</div>
                        {[
                          { day: 'Day 1', detail: 'CBC, AST, ALT, creatinine. If WNL → Methotrexate IM 50 mg/m².' },
                          { day: 'Day 4', detail: 'Repeat hCG — rise expected, do not interpret as failure.' },
                          { day: 'Day 7', detail: 'Need ≥15% drop from Day 4. If <15% → repeat Methotrexate or refer to surgery.' },
                        ].map(r => (
                          <div key={r.day} style={{ fontSize: '12.5px', color: 'var(--yk-ink-700)', marginBottom: '4px' }}>
                            <strong style={{ color: 'var(--yk-sage-700)' }}>{r.day}: </strong>{r.detail}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--yk-ink-400)' }}>Per ACCESS-Bridge Ectopic protocol, April 2025</div>
                    </div>
                  </Collapsible>
                </div>
              </div>
            )}

            {/* Indeterminate IUP → EPL tab */}
            {impression === 'indeterminate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13.5px', color: 'var(--yk-ink-800)', lineHeight: 1.5 }}>
                  Intrauterine pregnancy located but viability is indeterminate. This is managed on the Early Pregnancy Loss pathway using SRU 2013 criteria for serial evaluation.
                </div>
                <button onClick={() => onSwitchTab('epl')} style={{
                  appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '6px',
                  background: 'var(--yk-sage-500)', border: 'none',
                  fontSize: '13.5px', fontWeight: 700, color: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}>
                  Go to Early Pregnancy Loss tab →
                </button>
              </div>
            )}

            {/* Definitive EPL → EPL tab */}
            {impression === 'epl' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13.5px', color: 'var(--yk-ink-800)', lineHeight: 1.5 }}>
                  Intrauterine pregnancy meets criteria for early pregnancy loss. Management options (expectant, medical, surgical) are on the Early Pregnancy Loss pathway.
                </div>
                <button onClick={() => onSwitchTab('epl')} style={{
                  appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '6px',
                  background: 'var(--yk-sage-500)', border: 'none',
                  fontSize: '13.5px', fontWeight: 700, color: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}>
                  Go to Early Pregnancy Loss tab →
                </button>
              </div>
            )}

            {/* No impression yet */}
            {!impression && s2BaselineVal && (
              <div style={{ fontSize: '13px', color: 'var(--yk-ink-400)', fontStyle: 'italic' }}>Select ultrasound impression in Step 3 to complete interpretation.</div>
            )}
          </div>
        </>
        );
      })()}

      {/* Sticky progress footer — shown on both mobile and desktop */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--yk-sage-50, #f4f7f4)', borderTop: '1px solid var(--yk-sage-200)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
      }}>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pulMobileStep > 1 && (
            <button onClick={() => {
              if (pulMobileStep === 4) setSec3Done(false);
              else if (pulMobileStep === 3) setSec2Done(false);
              else if (pulMobileStep === 2) setSec1Done(false);
            }} style={{
              appearance: 'none', background: 'none', border: '1px solid var(--yk-ink-200)',
              borderRadius: '999px', padding: '7px 12px', fontSize: '12px', fontWeight: 600,
              color: 'var(--yk-ink-600)', cursor: 'pointer', flexShrink: 0,
            }}>← Back</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--yk-ink-800)' }}>
              {pulMobileStep <= 3 ? `Step ${pulMobileStep} of 3 — ${pulMobileLabels[pulMobileStep - 1]}` : 'Clinical Assessment'}
            </div>
            <div style={{ marginTop: '6px', height: '4px', width: '100%', maxWidth: '240px', background: 'var(--yk-ink-150)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', width: `${(pulDoneCount / 3) * 100}%`, background: '#10B981', transition: 'width 0.35s ease' }} />
            </div>
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--yk-ink-600)', flexShrink: 0 }}>
            {pulDoneCount} of 3 complete
          </div>
        </div>
      </div>

    </div>
  );
}
