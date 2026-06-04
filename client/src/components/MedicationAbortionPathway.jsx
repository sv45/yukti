// MedicationAbortionPathway.jsx
// Step 1 = Gestational age. Step 2 = Contraindications. Steps 3–6 are placeholders.
// All checkmarks use the same circle (CheckCircle) — sage for affirmations, rose for blocking.

import React, { useState, useMemo, useEffect } from "react";
import { Section } from "./primitives";
import logoUrl from "../assets/yukti-logo.png";

// ─── Step list ───────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Gestational age" },
  { num: 2, label: "Ultrasound findings" },
  { num: 3, label: "Contraindications for medication abortion" },
  { num: 4, label: "Rh status" },
  { num: 5, label: "Counseling & Abortion Management Plan" },
  { num: 6, label: "Aftercare & follow-up" },
];

// ─── Contraindication list (ACCESS-Bridge MAB ED protocol, April 2026) ───────
const CONTRAINDICATIONS = [
  { key: "allergy",    label: "Allergy to mifepristone or misoprostol" },
  { key: "steroids",   label: "Chronic systemic steroid use (inhalers, sprays, and creams are OK)" },
  { key: "anemia",     label: "Severe symptomatic anemia (Hgb not required if asymptomatic)" },
  { key: "adrenal",    label: "Chronic adrenal failure" },
  { key: "coag",       label: "Known coagulopathy or current anticoagulant therapy (aspirin is OK)" },
  { key: "iud",        label: "IUD currently in place" },
  { key: "porphyria",  label: "Known porphyria" },
];

const INITIAL_CONTRA = CONTRAINDICATIONS.reduce((acc, c) => ({ ...acc, [c.key]: false }), {});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SOURCE_NAMES = {
  "https://www.kff.org/womens-health-policy/abortion-in-the-u-s-dashboard/": "KFF",
  "https://www.guttmacher.org/state-policy/explore/overview-abortion-laws": "Guttmacher Institute",
  "https://reproductiverights.org/maps/abortion-laws-by-state/": "Center for Reproductive Rights",
};

function LegalSourceLine({ sources, lastVerified, color }) {
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: "6px", fontSize: "11px", color, opacity: 0.8 }}>
      {lastVerified && <span>Last verified: {lastVerified} · </span>}
      Sources:{" "}
      {sources.map((url, i) => (
        <span key={i}>
          {i > 0 && " · "}
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
            {SOURCE_NAMES[url] || url}
          </a>
        </span>
      ))}
    </div>
  );
}

function calcGA(lmpStr) {
  if (!lmpStr) return null;
  const lmp = new Date(lmpStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today - lmp;
  const days = Math.floor(diffMs / 86400000);
  if (isNaN(days) || days < 0) return null;
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  return { weeks, days: remDays, totalDays: days };
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Small UI atoms ──────────────────────────────────────────────────────────

// Unified circle-checkmark used everywhere a binary state is shown.
// tone="sage" (default, positive/affirmation) | "rose" (negative/blocking).
function CheckCircle({ checked, tone = "sage", size = 22, disabled = false }) {
  const palettes = {
    sage: {
      border: "var(--yk-sage-300, #86EFAC)",
      fillBorder: "#10B981",
      fill: "#10B981",
    },
    rose: {
      border: "var(--yk-rose-300, #FCA5A5)",
      fillBorder: "var(--yk-rose-500, #EF4444)",
      fill: "var(--yk-rose-500, #EF4444)",
    },
    ink: {
      border: "var(--yk-ink-800, #1f2937)",
      fillBorder: "var(--yk-ink-800, #1f2937)",
      fill: "var(--yk-ink-800, #1f2937)",
    },
  };
  const c = palettes[tone] || palettes.sage;
  return (
    <span style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      border: `2px solid ${checked ? c.fillBorder : c.border}`,
      background: checked ? c.fill : "white",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s",
    }}>
      {checked && (
        <span style={{ color: "white", fontSize: `${Math.round(size * 0.6)}px`, lineHeight: 1 }}>✓</span>
      )}
    </span>
  );
}

function StepCheckbox({ done, onChange }) {
  if (!done) return null;
  return (
    <label
      style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", userSelect: "none" }}
      onClick={e => e.stopPropagation()}
    >
      <CheckCircle checked tone="sage" size={22} />
      <input type="checkbox" checked onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>Done</span>
    </label>
  );
}

function MarkDoneBar({ eligibilityOk, done, onDone }) {
  if (done || !eligibilityOk) return null;
  return (
    <div style={{
      borderTop: "1px solid var(--yk-ink-100, #f3f4f6)",
      padding: "12px 20px",
      background: "var(--yk-sage-50, #F0FDF4)",
      display: "flex", justifyContent: "flex-end",
    }}>
      <button
        onClick={onDone}
        style={{
          appearance: "none", cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "9px 20px", borderRadius: "6px",
          background: "var(--yk-sage-500)", border: "none",
          fontSize: "13px", fontWeight: 700, color: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
          <path d="M4 7l2.2 2.2L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Mark step done
      </button>
    </div>
  );
}

function ContraCheckbox({ checked, onChange, label }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 12px", borderRadius: "8px",
      border: `1.5px solid ${checked ? "var(--yk-rose-300, #FCA5A5)" : "var(--yk-ink-150, #e5e5e5)"}`,
      background: checked ? "var(--yk-rose-50, #FEF2F2)" : "white",
      cursor: "pointer",
      transition: "all 0.15s",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: "none" }}
      />
      <CheckCircle checked={checked} tone="sage" size={22} />
      <div style={{
        flex: 1,
        fontSize: "13.5px",
        color: "var(--yk-ink-800, #1f2937)",
        lineHeight: 1.45,
        fontWeight: 400,
      }}>
        {label}
      </div>
    </label>
  );
}

// ─── Placeholder card ────────────────────────────────────────────────────────
function PlaceholderStep({ num, label }) {
  return (
    <div style={{
      border: "2px dashed var(--yk-ink-150, #e5e5e5)",
      borderRadius: "10px",
      padding: "20px 24px",
      margin: "12px 0",
      background: "var(--yk-canvas, #fafaf7)",
      color: "var(--yk-ink-500, #6b7280)",
      fontSize: "13.5px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "16px",
    }}>
      <div>
        <div style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
          color: "var(--yk-ink-400, #9ca3af)", textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Step {String(num).padStart(2, "0")}
        </div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--yk-ink-700, #374151)" }}>
          {label} <span style={{ fontWeight: 400, color: "var(--yk-ink-500, #6b7280)" }}>(next to build)</span>
        </div>
      </div>
      <StepCheckbox done={false} onChange={() => {}} disabled />
    </div>
  );
}

// ─── Collapsed-step summary bar (used by completed steps) ────────────────────
function CollapsedStepBar({ stepNum, headline, detail, onEdit }) {
  return (
    <div
      onClick={onEdit}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "16px",
        background: "var(--yk-sage-50, #F0FDF4)",
        border: "1px solid var(--yk-sage-300, #86EFAC)",
        borderRadius: "10px",
        padding: "14px 18px",
        margin: "12px 0",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <CheckCircle checked tone="sage" size={26} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--yk-sage-700, #166534)" }}>
          Step {stepNum}: {headline}
          {detail && <span style={{ fontWeight: 400, marginLeft: "6px" }}>— {detail}</span>}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--yk-sage-600, #16A34A)", fontWeight: 600, fontSize: "13px",
          textDecoration: "underline",
        }}
      >
        Edit
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function MedicationAbortionPathway({ selectedState, institutionId, legalStatus, onSwitchTab, onAsk }) {
  const [lmp, setLmp] = useState("");
  const [usGaWeeks, setUsGaWeeks] = useState("");
  const [usGaDays, setUsGaDays] = useState("");
  const [contra, setContra] = useState(INITIAL_CONTRA);
  const [iudRemoved, setIudRemoved] = useState(false);
  const [noContraConfirmed, setNoContraConfirmed] = useState(false);
  const [step1Done, setStep1Done] = useState(false);
  // Step 2 — Ultrasound findings
  const [usImpression, setUsImpression] = useState(null); // 'iup' | 'pul' | 'ectopic' | 'no-us'
  const [pulHcg, setPulHcg] = useState(null);
  const [pulRiskFactors, setPulRiskFactors] = useState(null); // 'yes' | 'no'
  const [stepUsDone, setStepUsDone] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  // Step 4 — Rh status: 'pos' | 'neg' | 'unknown' | null
  const [rhStatus, setRhStatus] = useState(null);
  // For 'neg' or 'unknown' the clinician must acknowledge the follow-up action
  const [rhActionAck, setRhActionAck] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  // Step 4 — Management selection: 'medical' | 'surgical' | 'undecided' | null
  const [selectedManagement, setSelectedManagement] = useState(null);
  const [remsConfirmed, setRemsConfirmed] = useState(false);
  const [remsSkipped, setRemsSkipped] = useState(false);
  const [step4Done, setStep4Done] = useState(false);
  // Step 5 — Aftercare & follow-up
  const [aftercareAck, setAftercareAck] = useState(false);
  const [step5Done, setStep5Done] = useState(false);
  const [usReportText, setUsReportText] = useState("");
  const [usInterpreting, setUsInterpreting] = useState(false);
  const [usInterpretError, setUsInterpretError] = useState(null);
  const [usInterpretResult, setUsInterpretResult] = useState(null);
  const fetchUSInterpretation = async () => {
    if (!usReportText.trim()) return;
    setUsInterpreting(true); setUsInterpretError(null);
    try {
      const res = await fetch('/api/interpret-us', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: usReportText }),
      });
      if (!res.ok) { setUsInterpretError(`Server error ${res.status}`); return; }
      const result = await res.json();
      setUsInterpretResult(result);
      const key = result?.classification?.impression_key;
      if (['iup','pul','ectopic'].includes(key)) setUsImpression(key);
    } catch (err) { setUsInterpretError(`Network error: ${err.message}`); }
    finally { setUsInterpreting(false); }
  };
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = e => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const [dischargeCopied, setDischargeCopied] = useState(false);

  // GA from LMP
  const lmpGa = useMemo(() => calcGA(lmp), [lmp]);

  // GA from ultrasound (requires both weeks and days entered)
  const usGa = useMemo(() => {
    if (usGaWeeks === "" || usGaDays === "") return null;
    const w = Number(usGaWeeks);
    const d = Number(usGaDays);
    if (isNaN(w) || isNaN(d) || w < 0 || d < 0 || d > 6) return null;
    return { weeks: w, days: d, totalDays: w * 7 + d };
  }, [usGaWeeks, usGaDays]);

  // Effective GA — ultrasound takes priority when present (clinical standard)
  const ga = usGa || lmpGa;

  // Legal-status derived values
  const legalKey = legalStatus?.status;
  const stateName = legalStatus?.state_name;
  const stateLimitWeeks = legalStatus?.gestational_limit_weeks;
  const isBanned = legalKey === "banned";
  const isRestricted = legalKey === "restricted";
  const isLegal = legalKey === "legal";

  // Effective GA upper limit — 12w default, tighter if state restricts below 12w
  const effectiveLimitWeeks =
    isRestricted && stateLimitWeeks != null && stateLimitWeeks < 12
      ? stateLimitWeeks
      : 12;
  const effectiveLimitDays = effectiveLimitWeeks * 7;

  // "Blocking" = any checked contraindication, except IUD if iudRemoved=true
  const blockingContras = useMemo(() => {
    return CONTRAINDICATIONS.filter(c => {
      if (!contra[c.key]) return false;
      if (c.key === "iud" && iudRemoved) return false;
      return true;
    });
  }, [contra, iudRemoved]);

  const inRange = ga ? ga.totalDays < effectiveLimitDays : false;
  const gaValid = !!ga && inRange;

  // True for GA 9w0d–11w+6d (or up to state limit), within the eligible window
  const needsSecondDose = !!ga && ga.totalDays >= 63 && ga.totalDays < effectiveLimitDays;

  const step1EligibilityOk = !isBanned && gaValid;
  const step2EligibilityOk = !isBanned && noContraConfirmed && blockingContras.length === 0;
  const step3EligibilityOk = !isBanned && rhStatus != null;
  const step4EligibilityOk = !isBanned && selectedManagement != null && (selectedManagement !== "medical" || remsConfirmed || remsSkipped);
  const step5EligibilityOk = !isBanned && step4Done && aftercareAck;

  const toggleContra = (key) => {
    setContra(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === "iud" && !next.iud) {
        setIudRemoved(false);
      }
      // Checking any contraindication clears the "none apply" affirmation
      if (next[key]) {
        setNoContraConfirmed(false);
      }
      return next;
    });
  };

  // Sticky-footer math
  const doneCount =
    (step1Done ? 1 : 0) + (stepUsDone ? 1 : 0) + (step2Done ? 1 : 0) +
    (step3Done ? 1 : 0) + (step4Done ? 1 : 0) + (step5Done ? 1 : 0);
  const firstUndone =
    !step1Done ? 1 :
    !stepUsDone ? 2 :
    !step2Done ? 3 :
    !step3Done ? 4 :
    !step4Done ? 5 :
    !step5Done ? 6 :
    6; // all done
  const currentStep = Math.min(firstUndone, STEPS.length);
  const currentStepLabel = STEPS[currentStep - 1].label;

  // ─── Collapsed views ────────────────────────────────────────────────────────
  const collapsedStep1 = (
    <CollapsedStepBar
      stepNum={1}
      headline="Gestational age confirmed"
      detail={ga ? `GA ${ga.weeks}w ${ga.days}d` : null}
      onEdit={() => setStep1Done(false)}
    />
  );

  const usImpressionLabel = usImpression === "iup" ? "Intrauterine pregnancy" : usImpression === "pul" ? "PUL / No adnexal mass" : usImpression === "ectopic" ? "Ectopic — see notes" : null;
  const collapsedStepUs = (
    <CollapsedStepBar
      stepNum={2}
      headline="Ultrasound findings"
      detail={usImpressionLabel}
      onEdit={() => setStepUsDone(false)}
    />
  );
  const expandedStepUs = (
    <Section
      num="02"
      title="Ultrasound findings"
      sub="Document the ultrasound impression before proceeding."
      footer={<MarkDoneBar
        eligibilityOk={usImpression != null && usImpression !== "ectopic"}
        done={stepUsDone}
        onDone={() => setStepUsDone(true)}
      />}
    >
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          { value: "iup",    label: "Intrauterine pregnancy",    desc: "Yolk sac or embryo identified within intrauterine gestational sac" },
          { value: "pul",    label: "PUL / No adnexal mass",    desc: "No IUP identified, no adnexal mass — ectopic not excluded" },
          { value: "ectopic",label: "Ectopic suspected",        desc: "Adnexal mass or extrauterine findings present" },
        ].map(opt => {
          const sel = usImpression === opt.value;
          return (
            <div key={opt.value} onClick={() => setUsImpression(opt.value)} style={{ border: `1.5px solid ${sel ? "var(--yk-sage-500)" : "var(--yk-ink-200)"}`, borderRadius: "8px", padding: "10px 14px", cursor: "pointer", background: sel ? "var(--yk-sage-50)" : "white", transition: "all 0.12s" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-ink-900)" }}>{opt.label}</div>
              <div style={{ fontSize: "12px", color: "var(--yk-ink-500)", marginTop: "2px" }}>{opt.desc}</div>
            </div>
          );
        })}
        {usImpression === "ectopic" && (
          <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#FEE2E2", border: "1px solid #FCA5A5", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12.5px", color: "#7F1D1D", fontWeight: 600 }}>Ectopic pregnancy is a contraindication to medication abortion. Do not administer mifepristone. Emergent OB/GYN consultation required.</div>
            <button onClick={() => onSwitchTab("pul-ectopic")} style={{ appearance: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "6px", background: "#B91C1C", border: "none", fontSize: "13px", fontWeight: 600, color: "white", alignSelf: "flex-start" }}>
              Go to Pregnancy of Unknown Location & Ectopic tab →
            </button>
          </div>
        )}
        {usImpression === "pul" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px 14px", borderRadius: "8px", background: "var(--yk-ink-50)", border: "1px solid var(--yk-ink-200)" }}>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-800)" }}>PUL — additional assessment required</div>
            {/* hCG input */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "6px" }}>
                β-hCG (mIU/mL) <span style={{ fontWeight: 400, color: "var(--yk-ink-400)" }}>— obtain if not already done</span>
              </label>
              <input
                type="number" min="0" placeholder="0"
                value={pulHcg ?? ""}
                onChange={e => setPulHcg(e.target.value ? Number(e.target.value) : null)}
                style={{ padding: "7px 10px", border: "1px solid var(--yk-ink-200)", borderRadius: "6px", fontSize: "13px", fontFamily: "inherit", width: "160px" }}
              />
            </div>
            {/* Risk factors */}
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "6px" }}>
                Ectopic risk factors present? <span style={{ fontWeight: 400, color: "var(--yk-ink-400)" }}>Prior ectopic, tubal surgery, IVF, PID, IUD failure</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["yes","no"].map(v => (
                  <button key={v} onClick={() => setPulRiskFactors(v)} type="button" style={{
                    appearance: "none", cursor: "pointer", fontFamily: "inherit",
                    padding: "6px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                    border: `1.5px solid ${pulRiskFactors === v ? "var(--yk-sage-500)" : "var(--yk-ink-200)"}`,
                    background: pulRiskFactors === v ? "var(--yk-sage-500)" : "white",
                    color: pulRiskFactors === v ? "white" : "var(--yk-ink-700)",
                  }}>{v === "yes" ? "Yes" : "No"}</button>
                ))}
              </div>
            </div>
            {/* Assessment */}
            {pulHcg != null && pulRiskFactors != null && (() => {
              if (pulHcg >= 3500) return (
                <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#FEE2E2", border: "1px solid #FCA5A5", fontSize: "12.5px", color: "#7F1D1D", lineHeight: 1.6 }}>
                  <strong>hCG {pulHcg.toLocaleString()} mIU/mL — at or above discriminatory zone (3,500 mIU/mL).</strong> An IUP should be visible on TVUS at this level; absence raises ectopic concern. Consider OB/GYN consultation before proceeding with medication abortion.
                </div>
              );
              if (pulRiskFactors === "yes") return (
                <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#FEF3C7", border: "1px solid #FCD34D", fontSize: "12.5px", color: "#78350F", lineHeight: 1.6 }}>
                  <strong>Ectopic risk factors present.</strong> Consider OB/GYN consult. Counsel patient on ectopic precautions and the importance of serial hCG follow-up to zero. (Goldberg et al., 2022)
                </div>
              );
              return (
                <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#D1FAE5", border: "1px solid #6EE7B7", fontSize: "12.5px", color: "#065F46", lineHeight: 1.6 }}>
                  <strong>hCG {pulHcg.toLocaleString()} mIU/mL, below discriminatory zone, no risk factors — safe to proceed.</strong> Serial hCG follow-up to zero is mandatory to confirm resolution and exclude ectopic. (Goldberg et al., 2022)
                </div>
              );
            })()}
            {(!pulHcg || pulRiskFactors == null) && (
              <div style={{ fontSize: "12px", color: "var(--yk-ink-400)", fontStyle: "italic" }}>
                Enter β-hCG and ectopic risk factors above to see safety assessment.
              </div>
            )}
          </div>
        )}
        {/* AI interpretation */}
        <div style={{ borderTop: "1px solid var(--yk-ink-100)", paddingTop: "12px", marginTop: "4px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--yk-ink-500)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Paste report for AI interpretation <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </div>
          <textarea
            rows={3}
            placeholder="Paste ultrasound report"
            value={usReportText}
            onChange={e => setUsReportText(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--yk-ink-150)", fontFamily: "inherit", fontSize: "13px", resize: "vertical", marginBottom: "10px" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              disabled={usInterpreting}
              onClick={fetchUSInterpretation}
              style={{ appearance: "none", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, background: "white", color: "var(--yk-ink-700)", border: "1px solid var(--yk-ink-200)" }}
            >
              {usInterpreting ? "Interpreting…" : "Input"}
            </button>
            {usInterpretError && <span style={{ fontSize: "12px", color: "#B91C1C" }}>{usInterpretError}</span>}
          </div>
          {usInterpretResult && (
            <div style={{ marginTop: "10px", padding: "12px 14px", borderRadius: "8px", background: "var(--yk-info-bg)", border: "1px solid var(--yk-info-bd)" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-info-fg)", marginBottom: "6px" }}>
                AI impression: {usInterpretResult.classification?.category?.replace(/_/g, " ")}
              </div>
              <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "12.5px", color: "var(--yk-info-fg)" }}>
                {usInterpretResult.classification?.criteria?.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  );

  const collapsedStep2 = (
    <CollapsedStepBar
      stepNum={3}
      headline="Contraindications for medication abortion reviewed"
      detail="no active contraindications"
      onEdit={() => setStep2Done(false)}
    />
  );

  const rhDetailText =
    rhStatus === "pos" ? "Rh-positive — no RhIG needed" :
    rhStatus === "neg_unknown" ? "Rh-negative or unknown — RhIG per institutional policy" :
    null;

  const collapsedStep3 = (
    <CollapsedStepBar
      stepNum={4}
      headline="Rh status documented"
      detail={rhDetailText}
      onEdit={() => setStep3Done(false)}
    />
  );

  const intentDetailText =
    selectedManagement === "medical"   ? "medical management" :
    selectedManagement === "surgical"  ? "procedural management" :
    selectedManagement === "undecided" ? "undecided — outpatient family planning follow-up" :
    null;

  const collapsedStep4 = (
    <CollapsedStepBar
      stepNum={5}
      headline="Counseling & regimen documented"
      detail={intentDetailText}
      onEdit={() => setStep4Done(false)}
    />
  );

  // ─── Expanded Step 1 — Gestational age only ─────────────────────────────────
  const expandedStep1 = (
    <Section
      num="01"
      title="Gestational age"
      sub={`Mifepristone with misoprostol is used through ${effectiveLimitWeeks === 12 ? "11 weeks 6 days" : `${effectiveLimitWeeks - 1} weeks 6 days`} gestation per the ACCESS-Bridge ED protocol${effectiveLimitWeeks < 12 ? ` (state limit: ${effectiveLimitWeeks} weeks)` : ""}.`}
      headerRight={
        <StepCheckbox
          done={step1Done}
          disabled={!step1Done && !step1EligibilityOk}
          onChange={() => {
            if (step1Done) setStep1Done(false);
            else if (step1EligibilityOk) setStep1Done(true);
          }}
        />
      }
      footer={<MarkDoneBar eligibilityOk={step1EligibilityOk} done={step1Done} onDone={() => setStep1Done(true)} />}
    >
      <div style={{ padding: "16px 20px 20px" }}>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <button onClick={() => setStep1Done(true)} style={{ appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)", borderRadius: "4px", fontSize: "11.5px", color: "var(--yk-ink-500)", cursor: "pointer", padding: "1px 7px" }}>
            Hide — not applicable
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* US GA card */}
          <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--yk-ink-150)", background: usGa ? "var(--yk-sage-50)" : "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-800)" }}>GA by ultrasound</span>
                <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, color: "#065F46", background: "#D1FAE5", borderRadius: "4px", padding: "1px 7px" }}>Preferred</span>
              </div>
              {usGa && <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--yk-ink-900)" }}>{usGa.weeks}w {usGa.days}d</span>}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>Weeks</span>
                <input type="number" min={0} max={13} value={usGaWeeks} onChange={e => setUsGaWeeks(e.target.value)} style={{ width: "70px", fontSize: "14px", padding: "6px 8px", border: "1.5px solid var(--yk-ink-150)", borderRadius: "6px", background: "white", fontFamily: "inherit" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>Days</span>
                <input type="number" min={0} max={6} value={usGaDays} onChange={e => setUsGaDays(e.target.value)} style={{ width: "70px", fontSize: "14px", padding: "6px 8px", border: "1.5px solid var(--yk-ink-150)", borderRadius: "6px", background: "white", fontFamily: "inherit" }} />
              </label>
            </div>
          </div>

          {/* LMP card */}
          <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--yk-ink-150)", background: (lmp && !usGa) ? "var(--yk-sage-50)" : "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-800)" }}>Last menstrual period (LMP)</span>
                <span style={{ marginLeft: "8px", fontSize: "11px", color: "var(--yk-ink-400)" }}>{usGa ? "optional" : "required if no US GA"}</span>
              </div>
              {lmpGa && <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--yk-ink-900)" }}>{lmpGa.weeks}w {lmpGa.days}d</span>}
            </div>
            <input type="date" value={lmp} max={todayISO()} onChange={e => setLmp(e.target.value)} style={{ fontSize: "13px", padding: "6px 10px", border: "1.5px solid var(--yk-ink-150)", borderRadius: "6px", background: "white", fontFamily: "inherit" }} />
          </div>
        </div>

        {/* Range banner outside the grey box */}
        {ga && inRange && (
          <div style={{
            marginTop: "14px",
            background: "var(--yk-sage-50, #F0FDF4)",
            border: "1px solid var(--yk-sage-300, #86EFAC)",
            borderRadius: "8px", padding: "10px 14px",
            fontSize: "13px", color: "var(--yk-sage-700, #166534)",
            lineHeight: 1.5,
            display: "flex", alignItems: "flex-start", gap: "8px",
          }}>
            <span style={{ marginTop: "1px" }}>
              <CheckCircle checked tone="sage" size={18} />
            </span>
            <span>
              Within range for medication abortion (less than {effectiveLimitWeeks} weeks
              {effectiveLimitWeeks < 12 ? ` — ${stateName} state limit` : ""}).
              {" "}Using {usGa ? "ultrasound" : "LMP"} dating: <strong>{ga.weeks}w {ga.days}d</strong>.
            </span>
          </div>
        )}
        {ga && !inRange && (
          <div style={{
            marginTop: "14px",
            background: "var(--yk-rose-50, #FEF2F2)",
            border: "1px solid var(--yk-rose-300, #FCA5A5)",
            borderRadius: "8px", padding: "12px 14px",
            fontSize: "13px", color: "var(--yk-rose-700, #B91C1C)",
            lineHeight: 1.55,
          }}>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>
              <span style={{ marginRight: "6px" }}>⛔</span>
              Refer to procedural care.
            </div>
            <div style={{ marginBottom: "8px" }}>
              Gestational age is {effectiveLimitWeeks} weeks or more and exceeds the upper limit for medication abortion
              {effectiveLimitWeeks < 12 ? ` in ${stateName}` : " in this protocol"}.
            </div>
            <a
              href="https://www.ineedana.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block", padding: "7px 13px",
                background: "var(--yk-rose-500, #EF4444)", color: "white",
                borderRadius: "6px", fontWeight: 600, fontSize: "12.5px",
                textDecoration: "none",
              }}
            >
              Procedural referral — INeedAnA.com ↗
            </a>
          </div>
        )}

        {/* Note when ready but state-blocked */}
        {isBanned && gaValid && (
          <div style={{
            marginTop: "10px",
            fontSize: "12px", color: "var(--yk-rose-700, #B91C1C)",
            textAlign: "right", fontStyle: "italic",
          }}>
            Cannot mark done — medication abortion is not permitted in {stateName}.
          </div>
        )}
      </div>
    </Section>
  );

  // ─── Expanded Step 2 — Contraindications ────────────────────────────────────
  const expandedStep2 = (
    <Section
      num="03"
      title="Contraindications"
      sub="Confirm none of the following apply. Check any that do, or confirm none apply below."
      headerRight={
        <StepCheckbox
          done={step2Done}
          disabled={!step2Done && !step2EligibilityOk}
          onChange={() => {
            if (step2Done) setStep2Done(false);
            else if (step2EligibilityOk) setStep2Done(true);
          }}
        />
      }
      footer={<MarkDoneBar eligibilityOk={step2EligibilityOk} done={step2Done} onDone={() => setStep2Done(true)} />}
    >
      <div style={{ padding: "16px 20px 20px" }}>

        {/* Affirmation button */}
        <button
          onClick={() => {
            if (blockingContras.length > 0) return;
            setNoContraConfirmed(v => !v);
          }}
          disabled={blockingContras.length > 0}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", gap: "10px",
            padding: "11px 14px",
            borderRadius: "8px",
            border: `1.5px solid ${noContraConfirmed ? "var(--yk-sage-500, #10B981)" : "var(--yk-sage-300, #86EFAC)"}`,
            background: noContraConfirmed ? "var(--yk-sage-50, #F0FDF4)" : "white",
            cursor: blockingContras.length > 0 ? "not-allowed" : "pointer",
            opacity: blockingContras.length > 0 ? 0.5 : 1,
            marginBottom: "10px",
            textAlign: "left",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          <CheckCircle checked={noContraConfirmed} tone="sage" size={22} />
          <span style={{
            fontSize: "13.5px", fontWeight: 400,
            color: noContraConfirmed ? "var(--yk-sage-700, #166534)" : "var(--yk-ink-800, #1f2937)",
          }}>
            {noContraConfirmed
              ? "Confirmed: no active contraindications"
              : "Confirm: none of the below apply"}
          </span>
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {CONTRAINDICATIONS.map(c => (
            <React.Fragment key={c.key}>
              <ContraCheckbox
                checked={contra[c.key]}
                onChange={() => toggleContra(c.key)}
                label={c.label}
              />

              {/* Inline IUD removal card */}
              {c.key === "iud" && contra.iud && (
                <div style={{
                  marginLeft: "20px",
                  background: "var(--yk-rose-50, #FEF2F2)",
                  border: "1.5px solid var(--yk-rose-300, #FCA5A5)",
                  borderRadius: "8px",
                  padding: "14px 16px",
                }}>
                  <div style={{
                    fontWeight: 700, fontSize: "13.5px",
                    color: "var(--yk-rose-700, #B91C1C)", marginBottom: "6px",
                  }}>
                    IUD must be removed before mifepristone
                  </div>
                  <p style={{
                    margin: "0 0 10px", fontSize: "13px",
                    color: "var(--yk-ink-700, #374151)", lineHeight: 1.55,
                  }}>
                    If the string is visible at the os, the IUD can be removed easily with ring forceps during a speculum exam.
                  </p>
                  <a
                    href="https://www.youtube.com/watch?v=LpCA4C37yr8"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", marginBottom: "12px",
                      fontSize: "12.5px", fontWeight: 600,
                      color: "var(--yk-rose-700, #B91C1C)",
                      textDecoration: "underline",
                    }}
                  >
                    Watch the 58-second how-to video →
                  </a>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 10px", borderRadius: "6px",
                    background: "white",
                    border: `1.5px solid ${iudRemoved ? "var(--yk-sage-300, #86EFAC)" : "var(--yk-rose-300, #FCA5A5)"}`,
                    cursor: "pointer",
                  }}>
                    <input
                      type="checkbox"
                      checked={iudRemoved}
                      onChange={() => setIudRemoved(v => !v)}
                      style={{ display: "none" }}
                    />
                    <CheckCircle checked={iudRemoved} tone="sage" size={22} />
                    <span style={{
                      fontSize: "13px", fontWeight: 600,
                      color: iudRemoved ? "var(--yk-sage-700, #166534)" : "var(--yk-ink-800, #1f2937)",
                    }}>
                      IUD removed
                    </span>
                  </label>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Global block banner */}
        {blockingContras.length > 0 && (
          <div style={{
            marginTop: "14px",
            background: "var(--yk-rose-50, #FEF2F2)",
            border: "1px solid var(--yk-rose-300, #FCA5A5)",
            borderRadius: "8px", padding: "12px 14px",
            fontSize: "13px", color: "var(--yk-rose-700, #B91C1C)",
            lineHeight: 1.55,
          }}>
            <span style={{ marginRight: "6px" }}>⛔</span>
            <strong>Medication abortion is contraindicated.</strong> Address the checked item before proceeding.
          </div>
        )}

        {/* Note when ready but state-blocked */}
        {isBanned && noContraConfirmed && blockingContras.length === 0 && (
          <div style={{
            marginTop: "10px",
            fontSize: "12px", color: "var(--yk-rose-700, #B91C1C)",
            textAlign: "right", fontStyle: "italic",
          }}>
            Cannot mark done — medication abortion is not permitted in {stateName}.
          </div>
        )}
      </div>
    </Section>
  );

  // ─── Expanded Step 3 — Rh status ────────────────────────────────────────────
  const RH_OPTIONS = [
    { val: "pos",         label: "Rh-positive" },
    { val: "neg_unknown", label: "Rh-negative or Unknown" },
  ];

  const selectRh = (val) => {
    setRhStatus(val);
    setRhActionAck(false);
  };

  const expandedStep3 = (
    <Section
      num="04"
      title="Rh status"
      sub="Confirm Rh type and document RhIG plan before mifepristone."
      headerRight={
        <StepCheckbox
          done={step3Done}
          disabled={!step3Done && !step3EligibilityOk}
          onChange={() => {
            if (step3Done) setStep3Done(false);
            else if (step3EligibilityOk) setStep3Done(true);
          }}
        />
      }
      footer={<MarkDoneBar eligibilityOk={step3EligibilityOk} done={step3Done} onDone={() => setStep3Done(true)} />}
    >
      <div style={{ padding: "16px 20px 20px" }}>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {RH_OPTIONS.map(opt => {
            const selected = rhStatus === opt.val;
            return (
              <button
                key={opt.val}
                onClick={() => selectRh(opt.val)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: `1.5px solid ${selected ? "#10B981" : "var(--yk-ink-150, #e5e5e5)"}`,
                  background: selected ? "var(--yk-sage-50, #F0FDF4)" : "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: selected ? 700 : 500,
                  color: selected ? "var(--yk-sage-700, #166534)" : "var(--yk-ink-800, #1f2937)",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Rh-positive — clear path */}
        {rhStatus === "pos" && (
          <div style={{
            marginTop: "14px",
            background: "var(--yk-sage-50, #F0FDF4)",
            border: "1px solid var(--yk-sage-300, #86EFAC)",
            borderRadius: "8px", padding: "10px 14px",
            fontSize: "13px", color: "var(--yk-sage-700, #166534)",
            lineHeight: 1.5,
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <CheckCircle checked tone="sage" size={22} />
            <span>No RhIG needed.</span>
          </div>
        )}

        {rhStatus === "neg_unknown" && (
          <div style={{
            marginTop: "14px",
            background: "var(--yk-amber-50, #FFFBEB)",
            border: "1px solid var(--yk-amber-300, #FCD34D)",
            borderRadius: "8px", padding: "12px 14px",
            fontSize: "13px", color: "var(--yk-amber-700, #78350F)",
            lineHeight: 1.55,
          }}>
            <div style={{ fontWeight: 700, marginBottom: "6px" }}>
              <span style={{ marginRight: "6px" }}>⚠</span>
              Rh-negative or unknown patient
            </div>
            <p style={{ margin: "0 0 10px", color: "var(--yk-ink-700, #374151)" }}>
              Current SFP / ACOG guidance does not routinely recommend Rh immune globulin (RhIG)
              for medication abortion before 12 weeks. Order per institutional policy as needed
              for the first trimester.
            </p>
          </div>
        )}

        {/* Note when ready but state-blocked */}
        {isBanned && rhStatus != null && (
          <div style={{
            marginTop: "10px",
            fontSize: "12px", color: "var(--yk-rose-700, #B91C1C)",
            textAlign: "right", fontStyle: "italic",
          }}>
            Cannot mark done — medication abortion is not permitted in {stateName}.
          </div>
        )}
      </div>
    </Section>
  );

  // ─── Expanded Step 4 — Management selection ─────────────────────────────────
  const expandedStep4 = (
    <Section
      num="05"
      title="Counseling & Abortion Management Plan"
      sub="Select the patient's preferred pregnancy management after counseling."
      headerRight={
        <StepCheckbox
          done={step4Done}
          disabled={!step4Done && !step4EligibilityOk}
          onChange={() => {
            if (step4Done) setStep4Done(false);
            else if (step4EligibilityOk) setStep4Done(true);
          }}
        />
      }
      footer={<MarkDoneBar eligibilityOk={step4EligibilityOk} done={step4Done} onDone={() => setStep4Done(true)} />}
    >
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* ── Medical Management card ── */}
        <div
          onClick={() => setSelectedManagement("medical")}
          style={{
            border: `1.5px solid ${selectedManagement === "medical" ? "#10B981" : "var(--yk-ink-150, #e5e5e5)"}`,
            borderRadius: "10px", overflow: "hidden", cursor: "pointer",
            background: selectedManagement === "medical" ? "var(--yk-sage-50, #F0FDF4)" : "white",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: "12px", padding: "14px 16px",
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--yk-ink-800, #1f2937)", marginBottom: "2px" }}>
                Medical Management
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500, #6b7280)", lineHeight: 1.4 }}>
                Two-step medication regimen — ~96–98% complete (confirmed IUP) · ~85% (PUL)
              </div>
            </div>
            {selectedManagement === "medical" && (
              <CheckCircle checked tone="sage" size={22} />
            )}
          </div>

          {selectedManagement === "medical" && (
            <div style={{
              padding: "0 16px 16px",
              borderTop: "1px solid var(--yk-sage-200, #BBF7D0)",
              fontSize: "13px", color: "var(--yk-ink-700, #374151)", lineHeight: 1.6,
            }}>
              <div style={{ marginTop: "12px", marginBottom: "8px" }}>
                <span style={{ fontWeight: 700 }}>Indications: </span>
                Stable, ≤12 weeks, patient prefers non-surgical, no prostaglandin allergy
              </div>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontWeight: 700 }}>Contraindications: </span>
                Prostaglandin allergy, IUD in situ (remove first), coagulopathy, active infection
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                <div style={{
                  background: "white", borderRadius: "7px", padding: "10px 12px",
                  border: "1px solid var(--yk-sage-300, #86EFAC)",
                }}>
                  <span style={{ fontWeight: 700 }}>Step 1: </span>Mifepristone 200mg PO
                </div>
                <div style={{
                  background: "white", borderRadius: "7px", padding: "10px 12px",
                  border: "1px solid var(--yk-sage-300, #86EFAC)",
                }}>
                  <span style={{ fontWeight: 700 }}>Step 2: </span>Misoprostol 800mcg vaginally or buccally, 24–48 hours after mifepristone
                </div>
                {needsSecondDose && (
                  <div style={{
                    background: "white", borderRadius: "7px", padding: "10px 12px",
                    border: "1px solid var(--yk-sage-300, #86EFAC)",
                  }}>
                    <span style={{ fontWeight: 700 }}>Step 3 (2nd misoprostol dose): </span>
                    Take a second dose of misoprostol 800mcg (4 tablets) 4 hours after the first dose, even if bleeding has already started.
                  </div>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "var(--yk-ink-500, #6b7280)", marginTop: "4px" }}>
                Dispense: {needsSecondDose ? "8 tablets (2 × 800mcg doses)" : "4 tablets (800mcg)"}
              </div>
              <div style={{
                background: "white", borderRadius: "7px", padding: "10px 12px",
                border: "1px solid var(--yk-ink-150, #e5e5e5)",
                fontSize: "12.5px",
              }}>
                <span style={{ fontWeight: 700 }}>Counseling: </span>
                Heavy bleeding and cramping 1–4h after second pill. Pre-treat with ibuprofen 600mg. Passage of tissue confirms effect.
              </div>
            </div>
          )}
        </div>

        {/* ── Procedural Management card ── */}
        <div
          onClick={() => setSelectedManagement("surgical")}
          style={{
            border: `1.5px solid ${selectedManagement === "surgical" ? "#10B981" : "var(--yk-ink-150, #e5e5e5)"}`,
            borderRadius: "10px", overflow: "hidden", cursor: "pointer",
            background: selectedManagement === "surgical" ? "var(--yk-sage-50, #F0FDF4)" : "white",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: "12px", padding: "14px 16px",
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--yk-ink-800, #1f2937)", marginBottom: "2px" }}>
                Procedural Management (Manual Uterine Aspiration)
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500, #6b7280)", lineHeight: 1.4 }}>
                Uterine aspiration — highest single-visit completion rate (&gt;95%)
              </div>
            </div>
            {selectedManagement === "surgical" && (
              <CheckCircle checked tone="sage" size={22} />
            )}
          </div>

          {selectedManagement === "surgical" && (
            <div style={{
              padding: "0 16px 16px",
              borderTop: "1px solid var(--yk-sage-200, #BBF7D0)",
              fontSize: "13px", color: "var(--yk-ink-700, #374151)", lineHeight: 1.6,
            }}>
              <div style={{ marginTop: "12px", marginBottom: "8px" }}>
                <span style={{ fontWeight: 700 }}>Indications: </span>
                Patient preference, failed expectant or medical abortion management, heavy bleeding, instability, infection, tissue at os
              </div>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontWeight: 700 }}>Contraindications: </span>
                Coagulopathy (relative); recent uterine surgery (discuss with OB/Gyn)
              </div>
              <div style={{
                background: "white", borderRadius: "7px", padding: "10px 12px",
                border: "1px solid var(--yk-sage-300, #86EFAC)",
                marginBottom: "6px",
              }}>
                <span style={{ fontWeight: 700 }}>Details: </span>
                Manual uterine aspiration (MVA) preferred in first trimester. Usually outpatient, local anesthesia. Completion &gt;95%.
              </div>
              <div style={{
                background: "white", borderRadius: "7px", padding: "10px 12px",
                border: "1px solid var(--yk-ink-150, #e5e5e5)",
                fontSize: "12.5px",
              }}>
                <span style={{ fontWeight: 700 }}>Counseling: </span>
                Same-day discharge. Light cramping and bleeding 1–2 weeks. Follow-up in 1–2 weeks to confirm completion.
              </div>
            </div>
          )}
        </div>

        {/* ── Undecided card ── */}
        <div
          onClick={() => setSelectedManagement("undecided")}
          style={{
            border: `1.5px solid ${selectedManagement === "undecided" ? "#10B981" : "var(--yk-ink-150, #e5e5e5)"}`,
            borderRadius: "10px", overflow: "hidden", cursor: "pointer",
            background: selectedManagement === "undecided" ? "var(--yk-sage-50, #F0FDF4)" : "white",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: "12px", padding: "14px 16px",
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--yk-ink-800, #1f2937)", marginBottom: "2px" }}>
                Undecided
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500, #6b7280)", lineHeight: 1.4 }}>
                Discharge with outpatient family planning referral
              </div>
            </div>
            {selectedManagement === "undecided" && (
              <CheckCircle checked tone="sage" size={22} />
            )}
          </div>

          {selectedManagement === "undecided" && (
            <div style={{
              padding: "0 16px 16px",
              borderTop: "1px solid var(--yk-sage-200, #BBF7D0)",
              fontSize: "13px", color: "var(--yk-ink-700, #374151)", lineHeight: 1.6,
            }}>
              <p style={{ margin: "12px 0 0" }}>
                Discharge with a referral for outpatient family planning follow-up. Document discussion of all pregnancy management options.
              </p>
            </div>
          )}
        </div>

        {/* ── REMS reminder — shown when Medical selected, blocks Mark Done until confirmed ── */}
        {selectedManagement === "medical" && !remsConfirmed && !remsSkipped && (
          <div style={{
            padding: "10px 14px",
            background: "#FEF3C7",
            border: "1px solid #FCD34D",
            borderRadius: "8px",
            fontSize: "12.5px",
            color: "#78350F",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ fontWeight: 600 }}>
                Mifepristone requires REMS certification before prescribing. Are you certified?
              </div>
              <button onClick={() => onSwitchTab("rems")} style={{
                appearance: "none", background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "11.5px", color: "#92400E", fontWeight: 600,
                textDecoration: "underline", whiteSpace: "nowrap", marginLeft: "12px", padding: 0,
              }}>REMS Certification guide →</button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setRemsConfirmed(true)}
                style={{
                  padding: "5px 12px", borderRadius: "6px",
                  background: "#92400E", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                }}
              >
                Yes, I am certified
              </button>
              <button
                onClick={() => setRemsSkipped(true)}
                style={{
                  padding: "5px 12px", borderRadius: "6px",
                  background: "transparent", color: "#78350F",
                  border: "1px solid #FCD34D", cursor: "pointer", fontSize: "12px",
                }}
              >
                No / Skip for now
              </button>
            </div>
          </div>
        )}
        {selectedManagement === "medical" && remsSkipped && !remsConfirmed && (
          <div style={{ fontSize: "12px", color: "var(--yk-ink-500)", display: "flex", alignItems: "center", gap: "8px" }}>
            REMS certification skipped
            <button onClick={() => setRemsSkipped(false)} style={{
              appearance: "none", background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: "11.5px", color: "var(--yk-ink-400)",
              textDecoration: "underline", padding: 0,
            }}>Change</button>
          </div>
        )}
        {selectedManagement === "medical" && remsConfirmed && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "12px", color: "#065F46", fontWeight: 600 }}>✓ REMS certification confirmed</div>
              <button onClick={() => setRemsConfirmed(false)} style={{
                appearance: "none", background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "11.5px", color: "var(--yk-ink-400)",
                textDecoration: "underline", padding: 0,
              }}>Change</button>
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>
              Patient agreement form required:{" "}
              <a href="https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-716-Patient-Agreement.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yk-sage-700)", fontWeight: 600 }}>GenBioPro ↗</a>
              {" · "}
              <a href="https://www.earlyoptionpill.com/wp-content/uploads/2026/04/Danco_Prescriber-Agreement-Form_092025.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yk-sage-700)", fontWeight: 600 }}>Danco (Mifeprex) ↗</a>
            </div>
          </div>
        )}

      </div>
    </Section>
  );

  // ─── Collapsed Step 5 ────────────────────────────────────────────────────────
  const collapsedStep5 = (
    <CollapsedStepBar
      stepNum={6}
      headline="Aftercare & follow-up documented"
      detail="discharge instructions reviewed"
      onEdit={() => setStep5Done(false)}
    />
  );

  // ─── Expanded Step 5 — Aftercare & follow-up ─────────────────────────────────
  const expandedStep5 = (
    <Section
      num=""
      title="Aftercare & Follow-up"
      sub="Review return precautions, follow-up plan, and contraception counseling before discharge."
      headerRight={
        <StepCheckbox
          done={step5Done}
          disabled={!step5Done && !step5EligibilityOk}
          onChange={() => {
            if (step5Done) setStep5Done(false);
            else if (step5EligibilityOk) setStep5Done(true);
          }}
        />
      }
      footer={<MarkDoneBar eligibilityOk={step5EligibilityOk} done={step5Done} onDone={() => setStep5Done(true)} />}
    >
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Discharge instructions — medical management only ── */}
        {selectedManagement === "medical" && <div>
          <div style={{
            background: "var(--yk-sage-100, #E6EBE5)",
            border: "1.5px solid var(--yk-sage-300)",
            borderTop: "3px solid var(--yk-sage-500)",
            borderRadius: "10px", padding: "16px 18px",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <img src={logoUrl} alt="" style={{ width: "18px", height: "18px", objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--yk-ink-900)" }}>Discharge Summary</span>
          </div>
            {/* Intro + medication narrative */}
            <div style={{ fontSize: "12px", color: "var(--yk-ink-700)", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              <div>To help you pass the pregnancy, you will need to take two medications in sequence.</div>
              <div><strong>Step 1:</strong> You received mifepristone 200mg by mouth today in the emergency department.</div>
              <div><strong>Step 2:</strong> Take misoprostol 800mcg vaginally or dissolved in your cheek at home 24–48 hours after the mifepristone. Do not take it before 24 hours have passed.</div>
              {needsSecondDose && (
                <div><strong>Step 3:</strong> Take a second dose of misoprostol (4 tablets, 800mcg) 4 hours after the first misoprostol dose, even if you have already started bleeding.</div>
              )}
            </div>

            {/* Return precautions */}
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-800)", marginBottom: "8px" }}>
              Come back to the ED if you experience any of the following:
            </div>
            <ol style={{ fontSize: "12px", color: "var(--yk-ink-700)", display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "18px", margin: "0 0 14px 18px" }}>
              <li>Soaking more than 2 pads per hour for 2 or more consecutive hours</li>
              <li>Fever ≥38°C (100.4°F) persisting beyond 24 hours after taking misoprostol</li>
              <li>Severe abdominal pain not relieved by ibuprofen</li>
              <li>No bleeding within 24 hours of taking misoprostol</li>
              <li>Foul-smelling vaginal discharge or any signs of infection</li>
            </ol>

            {/* Discharge packet reminder */}
            <div style={{
              padding: "10px 12px", borderRadius: "6px",
              background: "rgba(0,0,0,0.05)", border: "1px solid var(--yk-sage-300)",
              fontSize: "12px", color: "var(--yk-ink-700)", marginBottom: "12px",
            }}>
              <strong>Discharge packet:</strong> Include the signed patient agreement form in the paperwork before the patient leaves.{" "}
              <a href="https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-716-Patient-Agreement.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yk-sage-700)", fontWeight: 600 }}>GenBioPro ↗</a>
              {" · "}
              <a href="https://www.earlyoptionpill.com/wp-content/uploads/2026/04/Danco_Prescriber-Agreement-Form_092025.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yk-sage-700)", fontWeight: 600 }}>Danco (Mifeprex) ↗</a>
            </div>

            <button
              onClick={() => {
                const text = [
                  "To help you pass the pregnancy, you will need to take two medications in sequence.",
                  "Step 1: You received mifepristone 200mg by mouth today in the emergency department.",
                  "Step 2: Take misoprostol 800mcg vaginally or dissolved in your cheek at home 24–48 hours after the mifepristone. Do not take it before 24 hours have passed.",
                  ...(needsSecondDose ? ["Step 3: Take a second dose of misoprostol (4 tablets, 800mcg) 4 hours after the first misoprostol dose, even if you have already started bleeding.", ""] : [""]),
                  "Come back to the ED if you experience any of the following:",
                  "1. Soaking more than 2 pads per hour for 2 or more consecutive hours",
                  "2. Fever ≥38°C (100.4°F) persisting beyond 24 hours after taking misoprostol",
                  "3. Severe abdominal pain not relieved by ibuprofen",
                  "4. No bleeding within 24 hours of taking misoprostol",
                  "5. Foul-smelling vaginal discharge or any signs of infection",
                ].join("\n");
                navigator.clipboard.writeText(text).catch(() => {
                  const el = document.createElement("textarea");
                  el.value = text;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand("copy");
                  document.body.removeChild(el);
                });
                setDischargeCopied(true);
                setTimeout(() => setDischargeCopied(false), 2000);
              }}
              style={{
                fontSize: "11px", border: "1px solid #FECDD3", borderRadius: "4px",
                padding: "3px 8px", cursor: "pointer", color: "#9F1239",
                background: dischargeCopied ? "#FECDD3" : "transparent",
              }}
            >
              {dischargeCopied ? "✓ Copied!" : "Copy to clipboard"}
            </button>
          </div>
        </div>}

        {/* ── Follow-up plan ── */}
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--yk-ink-500, #6b7280)", marginBottom: "8px" }}>
            Follow-up plan
          </div>
          {selectedManagement === "medical" && (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px", padding: "14px 16px",
            }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#14532D", marginBottom: "8px" }}>Medical management follow-up</div>
              <div style={{ fontSize: "12px", color: "#166534", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div><strong>Follow-up visit:</strong> In approximately 1 week — in-person or telemedicine</div>
                <div><strong>Confirm completion:</strong> By clinical assessment, serum hCG, or ultrasound</div>
                <div><strong>Earlier follow-up:</strong> If symptomatic or concerned about incomplete abortion</div>
                <div><strong>Provider support:</strong> ACCESS-Bridge clinician support line available 24/7</div>
              </div>
            </div>
          )}
          {selectedManagement === "surgical" && (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px", padding: "14px 16px",
            }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#14532D", marginBottom: "8px" }}>Procedural management follow-up</div>
              <div style={{ fontSize: "12px", color: "#166534", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div><strong>Referral:</strong> Outpatient procedural abortion services for manual uterine aspiration</div>
                <div><strong>Post-procedure follow-up:</strong> Typically 1–2 weeks to confirm completion</div>
                <div><strong>Before discharge:</strong> Provide referral documentation and contact information</div>
              </div>
            </div>
          )}
          {selectedManagement === "undecided" && (
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "8px", padding: "14px 16px",
            }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#78350F", marginBottom: "8px" }}>Outpatient family planning follow-up</div>
              <div style={{ fontSize: "12px", color: "#92400E", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div><strong>Referral:</strong> Outpatient family planning follow-up before discharge</div>
                <div><strong>Documentation:</strong> Record that all pregnancy management options were discussed</div>
                <div><strong>Contact information:</strong> Ensure patient has follow-up provider details before leaving</div>
              </div>
            </div>
          )}
          {selectedManagement == null && (
            <div style={{
              background: "var(--yk-ink-100, #f5f5f4)",
              borderRadius: "8px", padding: "12px 14px",
              fontSize: "13px", color: "var(--yk-ink-500, #6b7280)", fontStyle: "italic",
            }}>
              Complete step 4 to see follow-up guidance.
            </div>
          )}
        </div>

        {/* ── Contraception counseling — medical/surgical only ── */}
        {(selectedManagement === "medical" || selectedManagement === "surgical") && <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--yk-ink-500, #6b7280)" }}>
              Contraception counseling
            </div>
            {onSwitchTab && (
              <button
                onClick={() => onSwitchTab("contraception")}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontSize: "12px", fontWeight: 600, color: "var(--yk-sage-600, #16A34A)",
                  cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
                }}
              >
                Open contraception pathway →
              </button>
            )}
          </div>
          <div style={{
            background: "white",
            border: "1px solid var(--yk-ink-150, #e5e5e5)",
            borderRadius: "8px", padding: "14px 16px",
          }}>
            <div style={{ fontSize: "12px", color: "var(--yk-ink-700, #374151)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div><strong>Fertility:</strong> Can return within 2 weeks of abortion — contraception can be started immediately (Quick Start)</div>
              <div><strong>Hormonal and barrier methods:</strong> Can begin same day</div>
              <div><strong>IUC (IUD or implant):</strong> Can be placed at follow-up after confirmed complete abortion</div>
              <div><strong>Next step:</strong> Counsel on all available options and provide prescription or referral</div>
            </div>
          </div>
        </div>}

        {/* ── Acknowledgment ── */}
        <label style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "8px",
          background: "white",
          border: `1.5px solid ${aftercareAck ? "var(--yk-sage-300, #86EFAC)" : "var(--yk-ink-150, #e5e5e5)"}`,
          cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={aftercareAck}
            onChange={() => setAftercareAck(v => !v)}
            style={{ display: "none" }}
          />
          <CheckCircle checked={aftercareAck} tone="sage" size={22} />
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: aftercareAck ? "var(--yk-sage-700, #166534)" : "var(--yk-ink-800, #1f2937)",
          }}>
            Discharge instructions and return precautions reviewed with patient
          </span>
        </label>

      </div>
    </Section>
  );

  return (
    <div style={{ padding: "0 0 100px" }}>

      {/* ── State legality banner ── */}
      {legalStatus && isBanned && (
        <div style={{
          background: "var(--yk-rose-200, #FECACA)",
          border: "2px solid var(--yk-rose-500, #EF4444)",
          borderRadius: "10px",
          padding: "16px 20px",
          margin: "14px 0",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            color: "var(--yk-rose-800, #7F1D1D)", fontWeight: 700, fontSize: "15px",
          }}>
            <span style={{ fontSize: "20px", lineHeight: 1 }}>⛔</span>
            Medication abortion is not permitted in {stateName || "this state"}.
          </div>
          <p style={{
            margin: 0, fontSize: "13.5px", fontWeight: 500,
            color: "var(--yk-rose-900, #7F1D1D)", lineHeight: 1.55,
          }}>
            State law prohibits medication abortion. Mifepristone for early pregnancy loss management is unaffected — see the EPL workflow.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a
              href="https://www.ineedana.com/"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-block", padding: "8px 14px",
                background: "var(--yk-rose-600, #DC2626)", color: "white",
                borderRadius: "6px", fontWeight: 600, fontSize: "12.5px",
                textDecoration: "none",
              }}
            >
              Referral — INeedAnA.com
            </a>
          </div>
          <LegalSourceLine sources={legalStatus.sources} lastVerified={legalStatus.last_verified} color="var(--yk-rose-800, #7F1D1D)" />
        </div>
      )}
      {legalStatus && isRestricted && (
        <div style={{
          background: "var(--yk-amber-50, #FFFBEB)",
          border: "1px solid var(--yk-amber-300, #FCD34D)",
          borderRadius: "8px",
          padding: "12px 16px",
          margin: "14px 0",
          fontSize: "13px",
          color: "var(--yk-amber-700, #78350F)",
          lineHeight: 1.55,
        }}>
          <span style={{ marginRight: "6px" }}>⚠</span>
          Medication abortion is permitted in <strong>{stateName}</strong>
          {stateLimitWeeks != null
            ? <> with a gestational limit of <strong>{stateLimitWeeks} weeks</strong>.</>
            : <> with state-specific restrictions.</>}
          <LegalSourceLine sources={legalStatus.sources} lastVerified={legalStatus.last_verified} color="var(--yk-amber-700, #78350F)" />
        </div>
      )}
      {legalStatus && isLegal && (
        <div style={{
          background: "var(--yk-sage-200, #BBF7D0)",
          border: "1.5px solid var(--yk-sage-500, #10B981)",
          borderRadius: "10px",
          padding: "14px 18px",
          margin: "14px 0",
          color: "var(--yk-sage-800, #065F46)",
          lineHeight: 1.5,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
            <CheckCircle checked tone="sage" size={26} />
            <span>Medication abortion is legal in <strong>{stateName}</strong>.</span>
          </div>
          <LegalSourceLine sources={legalStatus.sources} lastVerified={legalStatus.last_verified} color="var(--yk-sage-800, #065F46)" />
        </div>
      )}

      {!isBanned && (
        <>
          {/* ── Step 1: Gestational Age ── */}
          {(!isMobile && step1Done) ? collapsedStep1 : (isMobile && currentStep !== 1) ? null : expandedStep1}

          {/* ── Step 2: Ultrasound Findings ── */}
          {(!isMobile && stepUsDone) ? collapsedStepUs : (isMobile && currentStep !== 2) ? null : expandedStepUs}

          {/* ── Steps 3–6 only shown when ectopic is not selected ── */}
          {usImpression !== "ectopic" && (<>
          {/* ── Step 3: Contraindications ── */}
          {(!isMobile && step2Done) ? collapsedStep2 : (isMobile && currentStep !== 3) ? null : expandedStep2}

          {/* ── Step 4: Rh Status ── */}
          {(!isMobile && step3Done) ? collapsedStep3 : (isMobile && currentStep !== 4) ? null : expandedStep3}

          {/* ── Step 5: Counseling ── */}
          {(!isMobile && step4Done) ? collapsedStep4 : (isMobile && currentStep !== 5) ? null : expandedStep4}

          {/* ── Step 6: Aftercare ── */}
          {(!isMobile && step5Done) ? collapsedStep5 : (isMobile && currentStep !== 6) ? null : expandedStep5}
          </>)}
        </>
      )}

      {/* ── Sticky progress footer ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "var(--yk-sage-50, #f4f7f4)",
        borderTop: "1px solid var(--yk-sage-200)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.07)",
      }}>
        <div style={{
          margin: "0 auto", padding: "12px 20px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          {isMobile && currentStep > 1 && (
            <button onClick={() => {
              if (currentStep === 6) setStep4Done(false);
              else if (currentStep === 5) setStep3Done(false);
              else if (currentStep === 4) setStep2Done(false);
              else if (currentStep === 3) setStepUsDone(false);
              else if (currentStep === 2) setStep1Done(false);
            }} style={{
              appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)",
              borderRadius: "999px", padding: "7px 12px", fontSize: "12px", fontWeight: 600,
              color: "var(--yk-ink-600)", cursor: "pointer", flexShrink: 0,
            }}>← Back</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--yk-ink-800, #1f2937)" }}>
              Step {currentStep} of 6 — {currentStepLabel}
            </div>
            <div style={{ marginTop: "6px", height: "4px", width: "100%", maxWidth: "240px", background: "var(--yk-ink-150, #e5e5e5)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: "2px", width: `${(doneCount / 6) * 100}%`, background: "#10B981", transition: "width 0.35s ease" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {!isMobile && <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-600, #4b5563)" }}>{doneCount} of 6 complete</div>}
            {onAsk && (
              <button onClick={() => onAsk()} style={{
                appearance: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 12px", borderRadius: "999px",
                background: "var(--yk-sage-500)", border: "none",
                fontSize: "12px", fontWeight: 600, color: "white", cursor: "pointer", flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Ask Yukti
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
