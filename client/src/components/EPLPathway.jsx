// EPL pathway — step-by-step rebuild.
// Clinical logic preserved verbatim from original. UI shell replaced with 6-step layout.

import React, { useState, useEffect } from 'react';
import { Section, Row, Segmented, NumInput, Recommendation, RiskBand, ResultBlock, Cite } from './primitives';
import HCGInterpreter from './shared/HCGInterpreter';
import logoUrl from '../assets/yukti-logo.png';

// ─── Step list ────────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Gestational Age" },
  { num: 2, label: "Clinical Assessment" },
  { num: 3, label: "Ultrasound Findings" },
  { num: 4, label: "48-Hour Serial β-hCG" },
  { num: 5, label: "Clinical Assessment" },
  { num: 6, label: "Aftercare & Discharge" },
];

// ─── Short citation lookup (filename → abridged APA) ─────────────────────────
const SHORT_CITATION = {
  "acog_epl_200.pdf":            "ACOG Practice Bulletin 200 (2018, reaffirmed 2025)",
  "acog_epl_150.pdf":            "ACOG Practice Bulletin 150 (2015)",
  "acog_ectopic_193.pdf":        "ACOG Practice Bulletin 193 (2018)",
  "acog_mab_225.pdf":            "ACOG Practice Bulletin 225 (2020)",
  "acog_contraception_206.pdf":  "ACOG Practice Bulletin 206 (2016)",
  "acog_ec_112.pdf":             "ACOG Practice Bulletin 112 (2015)",
  "acog_ec_152.pdf":             "ACOG Practice Bulletin 152 (2015, reaffirmed 2025)",
  "acog_prepregnancy_762.pdf":   "ACOG Committee Opinion 762 (2019)",
  "cdc-mec-summary-chart-2024.pdf": "CDC U.S. MEC (2024)",
  "acep_pregnancy.pdf":          "ACEP Clinical Policy (2012)",
  "acep_pregnancy_2017.pdf":     "Hahn et al., Ann Emerg Med (2017)",
  "goldberg_2022_pul_mab.pdf":   "Goldberg et al. (2022)",
  "mua_2011.pdf":                "Allison et al. (2011)",
  "clinical_obgyn_contraception_abortion.pdf": "Rivlin & Davis (2022)",
};

// ─── Existing helper components (unchanged) ───────────────────────────────────
function AcogDefinition() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "0 0 12px" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ fontSize: "12px", color: "var(--yk-ink-500)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
      >
        <span style={{ fontSize: "9px", display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
        ACOG Practice Bulletin No. 200 — definition of complete EPL
      </button>
      {open && (
        <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--yk-ink-600)", lineHeight: "1.6" }}>
          <strong>Complete early pregnancy loss</strong> is defined as passage of all products of conception, confirmed by provider visualization or patient report with clinical correlation (ACOG Practice Bulletin No. 200, 2018; reaffirmed 2023).
        </div>
      )}
    </div>
  );
}

function MgmtGuidancePanel({ chunks }) {
  const uniqueCitations = [...new Set(chunks.map(c => SHORT_CITATION[c.source_filename] ?? c.source_filename))];
  return (
    <div style={{marginTop:"10px", paddingTop:"8px", borderTop:"1px solid var(--yk-sage-100)"}}>
      <div style={{fontSize:"11px", fontWeight:600, color:"var(--yk-ink-500)", letterSpacing:"0.06em", marginBottom:"4px"}}>FROM GUIDELINES</div>
      {uniqueCitations.map((cite, i) => (
        <div key={i} style={{fontSize:"10.5px", color:"var(--yk-ink-400)", lineHeight:"1.5"}}>{cite}</div>
      ))}
    </div>
  );
}

function CollapsibleRefs({ ids }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ paddingBottom: "10px" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ fontSize: "11.5px", color: "var(--yk-ink-500)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
      >
        <span style={{ fontSize: "9px", display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
        References
      </button>
      {open && <div style={{ marginTop: "6px" }}><Cite ids={ids} /></div>}
    </div>
  );
}

// ─── Step UI components (copied from MedicationAbortionPathway.jsx) ────────────
function CheckCircle({ checked, tone = "sage", size = 22, disabled = false }) {
  const palettes = {
    sage: { border: "var(--yk-sage-300, #86EFAC)", fillBorder: "#10B981", fill: "#10B981" },
    rose: { border: "var(--yk-rose-300, #FCA5A5)", fillBorder: "var(--yk-rose-500, #EF4444)", fill: "var(--yk-rose-500, #EF4444)" },
    ink:  { border: "var(--yk-ink-800, #1f2937)", fillBorder: "var(--yk-ink-800, #1f2937)", fill: "var(--yk-ink-800, #1f2937)" },
  };
  const c = palettes[tone] || palettes.sage;
  return (
    <span style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      border: `2px solid ${checked ? c.fillBorder : c.border}`,
      background: checked ? c.fill : "white",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
    }}>
      {checked && <span style={{ color: "white", fontSize: `${Math.round(size * 0.6)}px`, lineHeight: 1 }}>✓</span>}
    </span>
  );
}

function StepCheckbox({ done, onChange }) {
  if (!done) return null;
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", userSelect: "none" }} onClick={e => e.stopPropagation()}>
      <CheckCircle checked tone="sage" size={26} />
      <input type="checkbox" checked onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>Done</span>
    </label>
  );
}

function CollapsedStepBar({ stepNum, headline, detail, onEdit }) {
  return (
    <div
      onClick={onEdit}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        background: "var(--yk-sage-50, #F0FDF4)", border: "1px solid var(--yk-sage-200)",
        borderLeft: "4px solid var(--yk-sage-500)",
        borderRadius: "10px", padding: "14px 18px", margin: "16px 0", cursor: "pointer",
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
        onClick={e => { e.stopPropagation(); onEdit(); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--yk-sage-600, #16A34A)", fontWeight: 600, fontSize: "13px", textDecoration: "underline" }}
      >
        Edit
      </button>
    </div>
  );
}

// ─── Expanded step wrapper ────────────────────────────────────────────────────
function ExpandedStep({ num, label, labelNode, hideNum, children, eligibilityOk, done, onDone }) {
  return (
    <div style={{
      border: "1.5px solid var(--yk-ink-150, #e5e5e5)", borderRadius: "10px",
      margin: "16px 0", background: "white", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid var(--yk-ink-100, #f3f4f6)",
        background: "var(--yk-canvas, #fafaf7)",
      }}>
        <div>
          {!hideNum && (
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--yk-ink-400)", textTransform: "uppercase", marginBottom: "2px" }}>
            Step {String(num).padStart(2, "0")}
          </div>
          )}
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--yk-ink-800)" }}>{labelNode || label}</div>
        </div>
        <StepCheckbox done={done} onChange={onDone} disabled={!eligibilityOk} />
      </div>
      {/* Body */}
      <div style={{ padding: "16px 18px" }}>
        {children}
      </div>
      {/* Bottom mark-done bar — appears when eligible */}
      {eligibilityOk && !done && (
        <div style={{
          borderTop: "1px solid var(--yk-ink-100, #f3f4f6)",
          padding: "12px 18px",
          background: "var(--yk-sage-50, #F0FDF4)",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
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
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EPLPathway({ state, setState, onAsk, onSwitchTab }) {
  const s = state;
  const set = (k, v) => setState(prev => ({ ...prev, [k]: v }));

  // Step done state
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [step4Done, setStep4Done] = useState(false);
  const [step5Done, setStep5Done] = useState(false);
  const [step6Done, setStep6Done] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = e => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const [aftercareAck, setAftercareAck] = useState(false);
  const [epl6Copied, setEpl6Copied] = useState(false);

  const [sruOpen, setSruOpen] = useState(false);
  const [usReportText, setUsReportText] = useState("");
  const [usInterpreting, setUsInterpreting] = useState(false);
  const [usInterpretError, setUsInterpretError] = useState(null);
  const [mgmtGuidance, setMgmtGuidance] = useState({});

  const fetchMgmtGuidance = async (type) => {
    if (mgmtGuidance[type]) return;
    try {
      const res = await fetch(`/api/management-guidance?type=${type}`);
      if (!res.ok) return;
      const data = await res.json();
      setMgmtGuidance(prev => ({ ...prev, [type]: data.chunks }));
    } catch (_) {}
  };

  const fetchUSInterpretation = async (report) => {
    setUsInterpretError(null);
    if (!report || !report.trim()) {
      setUsInterpretError("Please enter ultrasound findings before interpreting.");
      return;
    }
    setUsInterpreting(true);
    try {
      const res = await fetch("/api/interpret-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      if (!res.ok) {
        const errText = await res.text();
        setUsInterpretError(`Server error ${res.status}: ${errText}`);
        return;
      }
      const data = await res.json();
      set("usInterpretation", data);
      if (!s.usImpression) set("usImpression", data.classification.impression_key);
      const rf = data.raw_fields;
      if (rf.crl_mm != null)   set("usCrl",     rf.crl_mm);
      if (rf.msd_mm != null)   set("usMsd",     rf.msd_mm);
      if (rf.cardiac_activity) set("usCardiac", rf.cardiac_activity === "present" ? "present" : "absent");
      if (rf.free_fluid)       set("freeFluid", rf.free_fluid);
    } catch (err) {
      console.error("[interpret-us] fetch threw:", err);
      setUsInterpretError(`Network error: ${err.message}`);
    } finally {
      setUsInterpreting(false);
    }
  };

  /* ---- GA: LMP-derived + optional US GA ---- */
  const lmpDate = s.lmp ? new Date(s.lmp + "T12:00:00") : null;
  const lmpGaTotalDays = lmpDate ? Math.floor((Date.now() - lmpDate.getTime()) / 86400000) : null;
  const lmpGaWeeks = lmpGaTotalDays != null ? Math.floor(lmpGaTotalDays / 7) : null;
  const lmpGaDaysRem = lmpGaTotalDays != null ? lmpGaTotalDays % 7 : null;
  const hasUsGa = s.usGaWeeks != null;
  const gaW = hasUsGa ? s.usGaWeeks : lmpGaWeeks;
  const gaD = hasUsGa ? (s.usGaDays ?? 0) : lmpGaDaysRem;
  const gaTotalWeeks = (gaW != null ? gaW : 0) + (gaD != null ? gaD/7 : 0);
  const gaBand = gaTotalWeeks === 0 ? "—"
    : gaTotalWeeks < 6 ? "<6w"
    : gaTotalWeeks < 10 ? "6–10w"
    : gaTotalWeeks < 14 ? "10–14w" : "≥14w";

  /* ---- MSD–CRL flag — declared early so it is in scope across all US branches ---- */
  const msdCrlFlag = !s.usNoEmbryo
    && s.usCrl != null && s.usMsd != null
    && (s.usMsd - s.usCrl) < 5;

  /* ---- β-hCG values — declared early so they are in scope for US interpretation branches ---- */
  const hcg = s.hcg;
  const hcg48 = s.hcg48;

  /* ---- Red-flag findings: trigger emergent OB consult ---- */
  const redFlags = [];
  if (s.hemoStatus === "unstable") redFlags.push("Hemodynamic instability");
  if (s.bleedSeverity === "heavy") redFlags.push("Heavy bleeding (≥2 pads/hr)");
  if (s.freeFluid === "large") redFlags.push("Large free fluid in cul-de-sac");
  if (s.signsOfInfection === "yes") redFlags.push("Signs of infection (septic abortion)");
  const showAlert = redFlags.length > 0;

  /* ---- Section 3: TVUS findings (Society of Radiologists in Ultrasound (2013) criteria) ----
     Split into orthogonal questions; system computes which criterion is met. */
  const cardiac     = s.usCardiac;       // present | absent | na
  const crlBand     = s.usNoEmbryo || s.usCrl == null ? "none" : s.usCrl < 7 ? "lt7" : "ge7";
  const msdBand     = s.usMsd == null ? "none"
                    : s.usMsd < 20   ? "lt20"
                    : s.usMsd < 25   ? "b20to24"
                    : "ge25";          // derived from numeric usMsd
  const sinceNoYS   = s.usSinceNoYS;      // none | lt11d | ge11d
  const sinceWithYS = s.usSinceWithYS;    // none | lt11d | ge11d
  const yolkSacSeen     = s.usYolkSac === "present";
  // iusSeen: true when any intrauterine structure has been entered (sac, yolk sac, or embryo)
  const iusSeen = s.usMsd != null || yolkSacSeen || (s.usCrl != null && !s.usNoEmbryo);
  // For PUL/Indeterminate: "no IUP" only when nothing was seen — allows SRU criteria to run when findings are entered
  const iupSeen = s.usImpression === "iup"    ? "yes"
                : s.usImpression === "ectopic" ? "no"
                : (s.usImpression === "pul" && !iusSeen) ? "no"
                : "na";
  // cardiac present WITH embryo = potentially viable; cardiac present WITHOUT embryo = must exclude ectopic
  const usViable        = cardiac === "present" && !s.usNoEmbryo;
  const cardiacNoEmbryo = cardiac === "present" && !!s.usNoEmbryo;
  const usNoIUP         = iupSeen === "no";
  const usDefinitive = !usNoIUP && !usViable && !cardiacNoEmbryo && (
    (crlBand === "ge7" && cardiac === "absent")
    || msdBand === "ge25"
    || sinceNoYS === "ge11d"
    || sinceWithYS === "ge11d"
  );
  const usSuggestive = !usDefinitive && !usViable && !cardiacNoEmbryo && !usNoIUP && (
    (crlBand === "lt7" && cardiac === "absent")
    || msdBand === "lt20"
    || msdBand === "b20to24"
    || sinceNoYS === "lt11d"
    || sinceWithYS === "lt11d"
  );

  let usResult = "Awaiting input";
  let usBand = null;
  let usDetail = null;
  const imp = s.usImpression;
  if (imp === "iup") {
    usResult = "Viable intrauterine pregnancy identified";
    usBand = <RiskBand level="low">Reassuring</RiskBand>;
    usDetail = "Cardiac activity present — manage symptomatically, OB follow-up.";
  } else if (imp === "definitive-epl") {
    usResult = "Definitive early pregnancy loss";
    usBand = <RiskBand level="high">Diagnostic</RiskBand>;
    usDetail = "Meets criteria for nonviability — proceed to management.";
  } else if (imp === "complete-epl") {
    usResult = "Complete early pregnancy loss";
    usBand = <RiskBand level="low">Complete EPL confirmed</RiskBand>;
    usDetail = "Provider visualization or patient report of passed products of conception — complete EPL per ACOG Practice Bulletin No. 200 (2018, reaffirmed 2023).";
  } else if (imp === "pul") {
    const hcgVal = hcg;
    const highRiskFluid = s.freeFluid === "mod" || s.freeFluid === "large";
    if (!iusSeen) {
      // ── True PUL: no intrauterine structure seen ──
      usResult = "Pregnancy of unknown location (PUL) — no intrauterine findings";
      if (highRiskFluid || (hcgVal != null && hcgVal >= 10000)) {
        usBand = <RiskBand level="high">Emergent GYN consult</RiskBand>;
        const reasons = [];
        if (hcgVal != null && hcgVal >= 10000) reasons.push(`β-hCG ${hcgVal.toLocaleString()} mIU/mL ≥10,000`);
        if (highRiskFluid) reasons.push(`${s.freeFluid} free fluid in cul-de-sac`);
        usDetail = `PUL with high-risk feature(s): ${reasons.join("; ")}. Emergent OB/Gyn consultation required — do not delay. (ACCESS-Bridge protocol.)`;
      } else if (hcgVal != null && hcgVal >= 3500) {
        usBand = <RiskBand level="high">IUP should be visible — ectopic suspected</RiskBand>;
        usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL is at or above the discriminatory zone (3,500 mIU/mL): an IUP should be visible on TVUS. No IUP identified — ectopic pregnancy must be excluded. GYN consult and serial hCG required. (ACCESS-Bridge protocol.)`;
      } else if (hcgVal != null) {
        const minRise = hcgVal < 1500 ? 49 : hcgVal < 3000 ? 40 : 33;
        usBand = <RiskBand level="mod">Serial hCG — ectopic workup</RiskBand>;
        usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL is below the discriminatory zone (3,500 mIU/mL). Repeat hCG in 48–72h: expect ≥${minRise}% rise (viable IUP) or ≥21% fall (EPL). Abnormal rise pattern requires ectopic exclusion. 7% of PULs are ectopic — ectopic precautions and close follow-up required. (ACCESS-Bridge protocol.)`;
      } else {
        usBand = <RiskBand level="mod">Serial hCG — ectopic workup</RiskBand>;
        usDetail = "No intrauterine sac identified. Obtain β-hCG: if ≥3,500 mIU/mL (discriminatory zone), IUP should be visible — absent IUP requires ectopic exclusion. Repeat hCG in 48–72h; 7% of PULs are ectopic. (ACCESS-Bridge protocol.)";
      }
    } else {
      // ── Indeterminate: intrauterine findings present but not yet diagnostic ──
      if (usDefinitive) {
        usResult = "Definitive early pregnancy loss";
        usBand = <RiskBand level="high">Diagnostic</RiskBand>;
        usDetail = "Meets Society of Radiologists in Ultrasound (2013) criteria for nonviability — proceed to EPL management.";
      } else if (usViable) {
        usResult = "Potentially viable IUP";
        usBand = <RiskBand level="low">Cardiac activity present</RiskBand>;
        usDetail = "Embryo with cardiac activity — potentially viable IUP. Manage symptomatically; OB/Gyn follow-up.";
      } else if (yolkSacSeen && !usSuggestive && !msdCrlFlag) {
        usResult = "IUP location confirmed — viability indeterminate";
        usBand = <RiskBand level="low">Intrauterine pregnancy</RiskBand>;
        usDetail = "Gestational sac with yolk sac visualized — intrauterine location confirmed. Viability not yet assessable; repeat TVUS in 7–10 days to assess embryo development.";
      } else if (usSuggestive || msdCrlFlag) {
        usResult = "Indeterminate — suspicious for early pregnancy loss";
        usBand = <RiskBand level="mod">Serial scan in 7–14 days</RiskBand>;
        const susp = [];
        if (msdCrlFlag && s.usMsd != null && s.usCrl != null) susp.push(`MSD–CRL difference ${(s.usMsd - s.usCrl).toFixed(1)}mm (<5mm threshold)`);
        if (msdBand === "b20to24" && s.usNoEmbryo) susp.push(`MSD ${s.usMsd}mm without embryo (approaching ≥25mm threshold)`);
        if (msdBand === "lt20" && s.usNoEmbryo) susp.push(`MSD ${s.usMsd}mm without embryo (below diagnostic threshold)`);
        if (crlBand === "lt7" && cardiac === "absent") susp.push(`CRL ${s.usCrl}mm without cardiac activity (below 7mm threshold)`);
        usDetail = `Intrauterine findings are suspicious but not yet diagnostic for EPL.${susp.length > 0 ? " " + susp.join("; ") + "." : ""} Repeat TVUS in 7–14 days to confirm or exclude nonviability (Society of Radiologists in Ultrasound (2013) criteria).${hcgVal != null ? ` β-hCG ${hcgVal.toLocaleString()} mIU/mL — serial trend in 48–72h.` : " Obtain β-hCG for serial trend."}`;
      } else {
        usResult = "Indeterminate — too early to assess";
        usBand = <RiskBand level="mod">Serial scan in 7–10 days</RiskBand>;
        usDetail = `Intrauterine gestational sac identified but too small or early to meet nonviability or viability criteria. Repeat TVUS in 7–10 days.${hcgVal != null ? ` β-hCG ${hcgVal.toLocaleString()} mIU/mL — serial trend in 48–72h.` : ""}`;
      }
    }
  } else if (imp === "ectopic") {
    usResult = "Ectopic pregnancy";
    const hcgVal = hcg;
    const highRiskFluid = s.freeFluid === "mod" || s.freeFluid === "large";
    const cardiacOnUS = cardiac === "present" && !s.usNoEmbryo;
    const hemodynamicInstability = s.hemoStatus === "unstable";
    const emergentFeatures = hemodynamicInstability || highRiskFluid || cardiacOnUS || (hcgVal != null && hcgVal >= 10000);
    if (emergentFeatures) {
      usBand = <RiskBand level="high">Emergent GYN consult</RiskBand>;
      const reasons = [];
      if (hemodynamicInstability) reasons.push("hemodynamic instability");
      if (cardiacOnUS) reasons.push("cardiac activity on US");
      if (highRiskFluid) reasons.push(`${s.freeFluid} free fluid in cul-de-sac`);
      if (hcgVal != null && hcgVal >= 10000) reasons.push(`β-hCG ${hcgVal.toLocaleString()} mIU/mL ≥10,000`);
      usDetail = `High-risk feature(s): ${reasons.join("; ")}. Emergent OB/Gyn consultation required — do not delay. Surgical management likely; methotrexate contraindicated if unstable or cardiac activity present. (ACCESS-Bridge protocol.)`;
    } else if (hcgVal != null && hcgVal >= 5000) {
      usBand = <RiskBand level="high">GYN consult recommended</RiskBand>;
      usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL (5,000–9,999 range): GYN consult recommended. Medical management (methotrexate 50 mg/m² IM) is possible but failure rate ~15% at this level. Surgical consultation advised. (ACCESS-Bridge protocol.)`;
    } else if (hcgVal != null && hcgVal >= 3500) {
      usBand = <RiskBand level="high">GYN consult</RiskBand>;
      usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL is at the discriminatory zone (3,500 mIU/mL). Consult GYN; methotrexate 50 mg/m² IM may be appropriate if hCG <5,000, mass <3.5 cm, and no contraindications. Follow hCG weekly until zero. (ACCESS-Bridge protocol.)`;
    } else if (hcgVal != null) {
      usBand = <RiskBand level="high">GYN consult</RiskBand>;
      usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL (below discriminatory zone of 3,500 mIU/mL). Ectopic confirmed by imaging. Methotrexate may be appropriate if no contraindications — consult GYN. Serial hCG follow-up required until zero. (ACCESS-Bridge protocol.)`;
    } else {
      usBand = <RiskBand level="high">Emergent GYN consult</RiskBand>;
      usDetail = "Ectopic pregnancy confirmed. Obtain β-hCG urgently: ≥10,000 mIU/mL or high-risk features (free fluid, cardiac activity, instability) → emergent consult. Discriminatory zone: 3,500 mIU/mL. (ACCESS-Bridge protocol.)";
    }
  } else if (imp === "no-us") {
    usResult = "No ultrasound performed";
    usBand = <RiskBand level="mod">TVUS required — ectopic not excluded</RiskBand>;
    const hcgVal = hcg;
    if (hcgVal != null && hcgVal >= 3500) {
      usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL is at or above the discriminatory zone (3,500 mIU/mL) — an IUP should be visible on TVUS. Transvaginal ultrasound urgently required to exclude ectopic. (ACCESS-Bridge protocol.)`;
    } else if (hcgVal != null) {
      usDetail = `β-hCG ${hcgVal.toLocaleString()} mIU/mL. Transvaginal ultrasound required to exclude ectopic before discharge. If hCG rises to ≥3,500 mIU/mL (discriminatory zone) without visible IUP, ectopic must be excluded. (ACCESS-Bridge protocol.)`;
    } else {
      usDetail = "Transvaginal ultrasound required to exclude ectopic pregnancy. Obtain β-hCG and TVUS before discharge or transfer to OB/Gyn care.";
    }
  } else if (cardiacNoEmbryo) {
    if (iusSeen) {
      usResult = "Cardiac activity without visible embryo — intrauterine sac present";
      usBand = <RiskBand level="high">Urgent OB consult</RiskBand>;
      usDetail = "Cardiac activity identified without a visible embryo; intrauterine gestational sac is present. Ectopic excluded by visualized IUG sac (heterotopic pregnancy rare — consider if IVF). Per ACCESS-Bridge protocol, cardiac activity on US is a high-risk feature — urgent OB/Gyn consultation required; methotrexate contraindicated.";
    } else {
      usResult = "Cardiac activity without embryo — exclude ectopic";
      usBand = <RiskBand level="high">Ectopic must be excluded</RiskBand>;
      usDetail = "Cardiac activity identified without a visible embryo. Ectopic pregnancy with cardiac activity cannot be excluded — urgent OB/Gyn consultation required. Per ACCESS-Bridge protocol, cardiac activity on US is a high-risk feature mandating emergent GYN consult; methotrexate is contraindicated.";
    }
  } else if (usDefinitive) {
    usResult = "Definitive early pregnancy loss";
    usBand = <RiskBand level="high">Diagnostic</RiskBand>;
    if (crlBand === "ge7" && cardiac === "absent") {
      usDetail = "Embryo with CRL ≥7mm and absent cardiac activity — definitive EPL by Society of Radiologists in Ultrasound (2013) criteria (Doubilet et al.).";
    } else if (msdBand === "ge25" && crlBand === "none") {
      usDetail = "Gestational sac ≥25mm without yolk sac or embryo — definitive EPL by Society of Radiologists in Ultrasound (2013) criteria (Doubilet et al.).";
    } else if (sinceNoYS === "ge11d") {
      usDetail = "No yolk sac development ≥11 days from initial scan — definitive EPL by Society of Radiologists in Ultrasound (2013) criteria (Doubilet et al.).";
    } else if (sinceWithYS === "ge11d") {
      usDetail = "No embryo development ≥11 days from scan showing yolk sac — definitive EPL by Society of Radiologists in Ultrasound (2013) criteria (Doubilet et al.).";
    } else {
      usDetail = "Meets criteria for nonviability — proceed to management.";
    }
  } else if (usViable) {
    usResult = "Potentially viable IUP";
    usBand = <RiskBand level="low">Cardiac activity present</RiskBand>;
    usDetail = "Embryo with CRL ≥7mm and cardiac activity present — potentially viable IUP. Manage symptomatically; OB follow-up.";
  } else if (yolkSacSeen) {
    usResult = "IUP location confirmed";
    usBand = <RiskBand level="low">Intrauterine pregnancy</RiskBand>;
    usDetail = "Gestational sac with yolk sac visualized — intrauterine location confirmed. Viability not yet assessable; repeat TVUS in 7–10 days to assess embryo development.";
  } else if (usSuggestive) {
    if (msdBand === "b20to24" && crlBand === "none") {
      usResult = "Suspicious for EPL — approaching diagnostic threshold";
      usBand = <RiskBand level="mod">Repeat in 7–10 days</RiskBand>;
      usDetail = "Gestational sac 20–24mm without yolk sac or embryo — approaching the ≥25mm diagnostic threshold. Repeat TVUS in 7–10 days.";
    } else if (msdBand === "lt20" && crlBand === "none" && sinceNoYS === "none" && sinceWithYS === "none") {
      usResult = "Too early to confirm";
      usBand = <RiskBand level="mod">Serial scan in 7–10 days</RiskBand>;
      usDetail = "Gestational sac <20mm without yolk sac or embryo — too early to confirm pregnancy failure. Serial scan recommended in 7–10 days.";
    } else {
      usResult = "Suggestive of failed pregnancy";
      usBand = <RiskBand level="mod">Repeat in 7–14 days</RiskBand>;
      usDetail = "Findings suspicious but not definitive. Confirm with follow-up imaging.";
    }
  } else if (usNoIUP) {
    usResult = "No intrauterine pregnancy visualized";
    usBand = <RiskBand level="mod">Evaluate for ectopic</RiskBand>;
    usDetail = "EPL cannot be diagnosed without first establishing IUP. Switch to PUL/Ectopic pathway.";
  }

  if (msdCrlFlag && !usDefinitive && imp !== "definitive-epl" && imp !== "ectopic" && imp !== "pul") {
    usResult = "Probable nonviable pregnancy";
    usBand   = <RiskBand level="mod">Repeat scan to confirm</RiskBand>;
    usDetail = "MSD to CRL difference <5mm — probable nonviable pregnancy. Consider repeat scan to confirm.";
  }

  // Append ectopic-excluded note when an intrauterine sac is visualized
  if (iusSeen && !cardiacNoEmbryo && usResult !== "Awaiting input"
      && imp !== "iup" && imp !== "complete-epl" && imp !== "ectopic" && imp !== "no-us") {
    usDetail = (usDetail ? usDetail + " " : "") + "Ectopic excluded by visualized intrauterine gestational sac (heterotopic pregnancy possible but rare — consider if IVF conception).";
  }

  // Build criterion lists for rich summary box
  const triggeredDefinitive = [];
  const triggeredProbable = [];
  let indeterminateReason = null;

  if (!usNoIUP && !usViable && !cardiacNoEmbryo && imp !== "iup" && imp !== "complete-epl" && imp !== "ectopic" && imp !== "no-us") {
    if (crlBand === "ge7" && cardiac === "absent")
      triggeredDefinitive.push({ text: `CRL ${s.usCrl}mm without cardiac activity`, threshold: "CRL ≥7mm without cardiac activity", cite: "Society of Radiologists in Ultrasound (2013) / ACOG PB 200" });
    if (msdBand === "ge25" && s.usNoEmbryo)
      triggeredDefinitive.push({ text: `MSD ${s.usMsd}mm without embryo`, threshold: "MSD ≥25mm without embryo", cite: "Society of Radiologists in Ultrasound (2013) / ACOG PB 200" });
    if (sinceNoYS === "ge11d")
      triggeredDefinitive.push({ text: "No yolk sac development on serial scan ≥11 days", threshold: "No yolk sac ≥11 days after initial scan", cite: "Society of Radiologists in Ultrasound (2013) / ACOG PB 200" });
    if (sinceWithYS === "ge11d")
      triggeredDefinitive.push({ text: "No embryo ≥11 days after scan showing yolk sac", threshold: "No embryo development on serial scan ≥11 days", cite: "Society of Radiologists in Ultrasound (2013) / ACOG PB 200" });

    if (triggeredDefinitive.length === 0) {
      if (msdCrlFlag)
        triggeredProbable.push({ text: `MSD–CRL difference ${(s.usMsd - s.usCrl).toFixed(1)}mm (less than 5mm threshold)`, threshold: "MSD–CRL <5mm", cite: "Doubilet 2013" });
      if (msdBand === "b20to24" && s.usNoEmbryo)
        triggeredProbable.push({ text: `MSD ${s.usMsd}mm without embryo (approaching ≥25mm threshold)`, threshold: "MSD 20–24mm without embryo", cite: "Doubilet 2013" });
      if (crlBand === "lt7" && cardiac === "absent")
        triggeredProbable.push({ text: `CRL ${s.usCrl}mm without cardiac activity (below 7mm threshold)`, threshold: "CRL <7mm without cardiac activity", cite: "Doubilet 2013" });
      if (sinceNoYS === "lt11d")
        triggeredProbable.push({ text: "No yolk sac on serial scan — follow-up scan pending (<11 days)", threshold: "No yolk sac, <11 days on serial scan", cite: "Society of Radiologists in Ultrasound (2013)" });
      if (sinceWithYS === "lt11d")
        triggeredProbable.push({ text: "No embryo after yolk sac seen — follow-up scan pending (<11 days)", threshold: "No embryo, <11 days after scan with yolk sac", cite: "Society of Radiologists in Ultrasound (2013)" });

      if (triggeredProbable.length === 0) {
        if (msdBand === "lt20" && s.usNoEmbryo)
          indeterminateReason = `Gestational sac ${s.usMsd}mm — too small to meet nonviability threshold (≥25mm required). Repeat TVUS in 7–10 days.`;
        else if (msdBand === "b20to24" && !s.usNoEmbryo)
          indeterminateReason = "MSD 20–24mm — approaching diagnostic threshold. Repeat TVUS in 7–10 days.";
      }
    }
  }

  /* ---- hCG trend ---- */
  let hcgInterp = "Awaiting input";
  if (hcg != null && hcg48 != null && hcg > 0) {
    const change = ((hcg48 - hcg) / hcg) * 100;
    const sign = change >= 0 ? "+" : "";
    hcgInterp = `${sign}${change.toFixed(0)}% over 48h`;
  } else if (hcg != null) {
    hcgInterp = `${hcg.toLocaleString()} mIU/mL — single value`;
  }

  // Map ultrasound impression to HCGInterpreter context
  const hcgUsContext = s.usImpression === "pul"     ? "pul_no_mass"
                     : s.usImpression === "ectopic" ? "suspicious_ectopic"
                     : "confirmed_iup";
  const hcgContextNote = (s.usImpression && s.usImpression !== "iup" && s.usImpression !== "pul" && s.usImpression !== "ectopic")
    ? "No ultrasound impression set — defaulting to confirmed IUP thresholds."
    : null;

  /* ---- Diagnosis synthesis ---- */
  let diagnosis = "Pending data";
  if (imp === "no-us") diagnosis = "No ultrasound — ectopic not excluded";
  else if (imp === "complete-epl") diagnosis = "Complete early pregnancy loss — confirmed";
  else if (usDefinitive) diagnosis = "Early Pregnancy Loss — confirmed";
  else if (cardiacNoEmbryo) diagnosis = "Cardiac without embryo — exclude ectopic";
  else if (usSuggestive) diagnosis = "Suspected EPL";
  else if (usViable) diagnosis = "Potentially viable IUP";
  else if (yolkSacSeen) diagnosis = "IUP location confirmed";
  else if (usNoIUP) diagnosis = "No IUP — see PUL/Ectopic pathway";

  /* ---- Final conclusion — drives colored box and tailored recommendations ---- */
  let finalConclusion = "pending";
  {
    const _hv = hcg;
    const _hiRisk = s.freeFluid === "mod" || s.freeFluid === "large";
    if (imp === "no-us") finalConclusion = "pul-serial";
    else if (imp === "iup" || usViable) finalConclusion = "viable-iup";
    else if (imp === "complete-epl") finalConclusion = "complete-epl";
    else if (imp === "definitive-epl" || usDefinitive) finalConclusion = "definitive-epl";
    else if (imp === "ectopic" || cardiacNoEmbryo) finalConclusion = "ectopic";
    else if (imp === "pul") {
      if (!iusSeen) {
        if (_hiRisk || (_hv != null && _hv >= 10000)) finalConclusion = "pul-highrisk";
        else if (_hv != null && _hv >= 3500) finalConclusion = "pul-discriminatory";
        else finalConclusion = "pul-serial";
      } else {
        if (usDefinitive) finalConclusion = "definitive-epl";
        else if (usViable) finalConclusion = "viable-iup";
        else if (yolkSacSeen && !usSuggestive && !msdCrlFlag) finalConclusion = "iup-confirmed";
        else if (usSuggestive || msdCrlFlag) finalConclusion = "probable-epl";
        else finalConclusion = "indeterminate";
      }
    } else if (yolkSacSeen) finalConclusion = "iup-confirmed";
    else if (msdCrlFlag || usSuggestive) finalConclusion = "probable-epl";
    else if (usNoIUP) finalConclusion = "pul-serial";
    else if (indeterminateReason) finalConclusion = "indeterminate";
  }

  const isEctopicConclusion = finalConclusion === "ectopic" || finalConclusion === "pul-highrisk" || finalConclusion === "pul-discriminatory";
  const isEplConclusion     = finalConclusion === "definitive-epl" || finalConclusion === "complete-epl";
  const isProbableOrSerial  = finalConclusion === "probable-epl" || finalConclusion === "indeterminate" || finalConclusion === "pul-serial";
  const isViableConclusion  = finalConclusion === "viable-iup" || finalConclusion === "iup-confirmed";

  const _color = isEctopicConclusion || isEplConclusion ? "red" : isViableConclusion ? "green" : "amber";
  const conclusionBg     = _color === "red" ? "#FEE2E2" : _color === "green" ? "#D1FAE5" : "#FEF3C7";
  const conclusionBorder = _color === "red" ? "#FCA5A5" : _color === "green" ? "#6EE7B7" : "#FCD34D";
  const conclusionDark   = _color === "red" ? "#7F1D1D" : _color === "green" ? "#064E3B" : "#78350F";
  const conclusionMid    = _color === "red" ? "#991B1B" : _color === "green" ? "#065F46" : "#92400E";
  const conclusionChip   = _color === "red" ? "rgba(127,29,29,0.1)" : _color === "green" ? "rgba(6,78,59,0.1)" : "rgba(120,53,15,0.1)";

  /* ---- Field summary pills for the interpretation box ---- */
  const fibFields = [];
  if (gaW != null && (gaW > 0 || gaD > 0)) fibFields.push(`GA: ${gaW}w${gaD ? ` ${gaD}d` : ""}`);
  if (s.usCrl != null && !s.usNoEmbryo) fibFields.push(`CRL: ${s.usCrl}mm`);
  if (s.usNoEmbryo) fibFields.push("No embryo");
  if (s.usYolkSac) fibFields.push(`Yolk sac: ${s.usYolkSac}`);
  if (s.usMsd != null) fibFields.push(`MSD: ${s.usMsd}mm`);
  if (s.usCardiac) fibFields.push(`Cardiac: ${s.usCardiac}`);
  if (s.freeFluid && s.freeFluid !== "none") fibFields.push(`Free fluid: ${s.freeFluid}`);
  if (s.usSinceNoYS && s.usSinceNoYS !== "none") fibFields.push(`No-YS interval: ${s.usSinceNoYS === "lt11d" ? "<11d" : "≥11d"}`);
  if (s.usSinceWithYS && s.usSinceWithYS !== "none") fibFields.push(`No-embryo interval: ${s.usSinceWithYS === "lt11d" ? "<11d" : "≥11d"}`);
  if (hcg != null && hcg48 != null && hcg > 0) {
    const _ch = ((hcg48 - hcg) / hcg * 100);
    fibFields.push(`β-hCG: ${hcg.toLocaleString()} → ${hcg48.toLocaleString()} (${_ch >= 0 ? "+" : ""}${_ch.toFixed(0)}%/48h)`);
  } else if (hcg != null) {
    fibFields.push(`β-hCG: ${hcg.toLocaleString()} mIU/mL`);
  }

  /* ---- Eligibility constants ---- */
  const step1EligibilityOk = s.lmp != null || s.usGaWeeks != null;
  const step2EligibilityOk = true; // optional step — always skippable
  const step3EligibilityOk = s.usImpression != null;
  const step4EligibilityOk = true; // always skippable — hCG optional
  const step5EligibilityOk = s.rhStatus != null;
  const step6EligibilityOk = aftercareAck;

  /* ---- Progress footer math ---- */
  const totalSteps = 6;
  const doneCount = [step1Done, step2Done, step3Done, step4Done, step5Done, step6Done].filter(Boolean).length;
  const firstUndone = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !step4Done ? 4 : 4;
  const currentStep = Math.min(firstUndone, 4);
  const mobileStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !step4Done ? 4 : !step5Done ? 5 : !step6Done ? 6 : 6;
  const mobileStepLabels = ['Gestational Age','Clinical Assessment','Ultrasound Findings','48h Serial β-hCG','Rh Status & RhoGAM','Aftercare & Discharge'];

  /* ---- US impression label for collapsed bar ---- */
  const usImpressionLabel = {
    iup: "Confirmed IUP", pul: "PUL / Indeterminate", ectopic: "Ectopic",
    "definitive-epl": "Definitive EPL", "complete-epl": "Complete EPL", "no-us": "No US performed",
  }[s.usImpression] ?? s.usImpression;

  /* ---- mxChoice label for collapsed bar ---- */
  const mxChoiceLabel = {
    expectant: "Expectant management",
    medical: "Medical — mifepristone/misoprostol",
    surgical: "Surgical — MVA/D&C",
  }[s.mxChoice] ?? s.mxChoice;

  /* ---- Discharge plain text ---- */
  const isMedical = s.mxChoice === "medical";
  const medIntro    = "You have been diagnosed with a miscarriage.";
  const medOverview = "Your miscarriage will be managed with two medications taken in sequence. The first medication, mifepristone, was given to you today in the emergency department. You will take the second medication, misoprostol, at home 24–48 hours after the mifepristone. Together, these two medications will help you pass the pregnancy to complete the miscarriage.";
  const medStep1    = "You received mifepristone 200mg by mouth today in the emergency department.";
  const medStep2    = "Take misoprostol 800mcg vaginally or dissolved in your cheek at home 24–48 hours after the mifepristone. Do not take it before 24 hours have passed.";
  const medSecondIntro = "We have also given you an extra dose of misoprostol. Only take it if needed — take the second dose if:";
  const medSecondConditions = [
    "You have no bleeding within 4–24 hours after the first dose",
    "You are soaking more than 2 pads per hour for two hours",
  ];
  const medSecondOutro = "Do not take the second dose for normal cramping and bleeding.";
  const medReturnIntro = "Return to the emergency department if you experience any of the following:";
  const medReturnItems = [
    "Soaking more than 2 pads per hour for two hours",
    "Fever above 101°F",
    "Severe pain not controlled by ibuprofen",
    "Feeling faint or lightheaded",
  ];
  const mgmtText = s.mxChoice === "expectant"
    ? "The pregnancy will pass naturally over 1–4 weeks. Timing varies. Return if the pregnancy has not passed by 4 weeks."
    : s.mxChoice === "surgical"
    ? "MVA/D&C is scheduled as a same-day outpatient procedure. Light bleeding and mild cramping are normal afterward. Avoid strenuous activity, tampons, and sex for 1–2 weeks."
    : "You have experienced an early pregnancy loss. Your care team will review your discharge instructions with you.";
  const returnPrecautions = [
    "Soaking more than 2 pads per hour for two hours",
    "Fever >38°C (100.4°F) or chills",
    "Severe pain not controlled with ibuprofen",
    "Dizziness or fainting",
    "Signs of infection (foul-smelling discharge, worsening pain)",
  ];
  const dischargePlainText = isMedical
    ? [medIntro,"",medOverview,"","Step 1: "+medStep1,"Step 2: "+medStep2,"","Second dose of misoprostol: "+medSecondIntro,...medSecondConditions.map(c=>`• ${c}`),medSecondOutro,"",medReturnIntro,...medReturnItems.map(i=>`• ${i}`)].join("\n")
    : [mgmtText,"","Return to the ED if you experience any of the following:",...returnPrecautions.map(p=>`• ${p}`)].join("\n");

  const timingPhrase = s.mxChoice === "medical"   ? "after misoprostol"
                     : s.mxChoice === "expectant" ? "after passage of tissue"
                     : s.mxChoice === "surgical"  ? "after procedure"
                     : "after treatment";

  /* ======================================================================
     JSX RETURN — 6-step layout
  ====================================================================== */
  return (
    <div style={{ padding: "0 0 100px" }}>

      {/* === Emergent consult alert === */}
      {showAlert && (
        <div className="alert">
          <div className="alert__body">
            <div className="alert__title">
              <span className="alert__icon">!</span>
              Emergent OB/Gyn consultation indicated
            </div>
            <div className="alert__detail">
              {redFlags.join(" · ")}. This pathway does not replace the bedside escalation. Page OB on-call now.
            </div>
          </div>
          <button className="alert__btn" onClick={() => onAsk("Walk me through emergent stabilization for an unstable patient with first-trimester bleeding.")}>
            Stabilization steps
          </button>
        </div>
      )}

      {/* ── Step 1: Gestational Age ── */}
      {(!isMobile && step1Done) ? (
        <CollapsedStepBar
          stepNum={1}
          headline="Gestational Age"
          detail={gaW != null ? `GA ${gaW}w ${gaD ?? 0}d${hasUsGa ? " (by US)" : " (by LMP)"}` : undefined}
          onEdit={() => setStep1Done(false)}
        />
      ) : (isMobile && mobileStep !== 1) ? null : (
        <ExpandedStep
          num={1} label="Gestational Age"
          eligibilityOk={step1EligibilityOk}
          done={step1Done}
          onDone={() => setStep1Done(true)}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <button onClick={() => setStep1Done(true)} style={{ appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)", borderRadius: "4px", fontSize: "11.5px", color: "var(--yk-ink-500)", cursor: "pointer", padding: "1px 7px" }}>
              Hide — not applicable
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* US GA */}
            <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--yk-ink-150)", background: hasUsGa ? "var(--yk-sage-50)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-800)" }}>GA by ultrasound</span>
                  <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, color: "#065F46", background: "#D1FAE5", borderRadius: "4px", padding: "1px 7px" }}>Preferred</span>
                </div>
                {hasUsGa && <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--yk-ink-900)" }}>{s.usGaWeeks}w {s.usGaDays ?? 0}d <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--yk-ink-400)", background: "var(--yk-ink-100)", borderRadius: "4px", padding: "1px 6px" }}>{gaBand}</span></span>}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <NumInput value={s.usGaWeeks} onChange={(v) => set("usGaWeeks", v)} unit="weeks" placeholder="—" min={0} max={23} step={1} />
                <NumInput value={s.usGaDays}  onChange={(v) => set("usGaDays", v)}  unit="days"  placeholder="—" min={0} max={6}  step={1} />
              </div>
            </div>
            {/* LMP */}
            <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--yk-ink-150)", background: (s.lmp && !hasUsGa) ? "var(--yk-sage-50)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-800)" }}>Last menstrual period (LMP)</span>
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "var(--yk-ink-400)" }}>{hasUsGa ? "optional" : "required if no US GA"}</span>
                </div>
                {s.lmp && lmpGaWeeks != null && <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--yk-ink-900)" }}>{lmpGaWeeks}w {lmpGaDaysRem}d{!hasUsGa && <>{" "}<span style={{ fontSize: "11px", fontWeight: 400, color: "var(--yk-ink-400)", background: "var(--yk-ink-100)", borderRadius: "4px", padding: "1px 6px" }}>{gaBand}</span></>}</span>}
              </div>
              <input
                type="date"
                value={s.lmp || ""}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("lmp", e.target.value || null)}
                style={{ padding: "6px 10px", border: "1px solid var(--yk-ink-200)", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--yk-font-sans, sans-serif)" }}
              />
            </div>
          </div>
        </ExpandedStep>
      )}

      {/* ── Step 2: Clinical Assessment ── */}
      {(!isMobile && step2Done) ? (
        <CollapsedStepBar
          stepNum={2}
          headline="Clinical Assessment"
          detail={
            s.hemoStatus === "unstable" ? "hemodynamically unstable"
            : s.hemoStatus === "stable" ? "hemodynamically stable"
            : s.hemoStatus === "borderline" ? "borderline hemodynamics"
            : "not assessed"
          }
          onEdit={() => setStep2Done(false)}
        />
      ) : (isMobile && mobileStep !== 2) ? null : (
        <ExpandedStep
          num={2} label="Clinical Assessment"
          eligibilityOk={step2EligibilityOk}
          done={step2Done}
          onDone={() => setStep2Done(true)}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
            <button onClick={() => setStep2Done(true)} style={{ appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)", borderRadius: "4px", fontSize: "11.5px", color: "var(--yk-ink-500)", cursor: "pointer", padding: "1px 7px" }}>
              Hide — not applicable
            </button>
          </div>
          <Row label="Hemodynamic status" hint="HR, BP, mentation, perfusion" control={
            <div className="seg" role="radiogroup">
              {[{v:"stable",l:"Stable"},{v:"borderline",l:"Borderline"},{v:"unstable",l:"Unstable"}].map(({v,l}) => (
                <button key={v} type="button" className="seg__opt" aria-pressed={s.hemoStatus === v} onClick={() => set("hemoStatus", v)} style={{ minWidth: "88px" }}>{l}</button>
              ))}
            </div>
          } />
          <Row label="Vaginal bleeding" hint="Pad count last hour" control={
            <Segmented value={s.bleedSeverity} onChange={(v) => set("bleedSeverity", v)} options={[
              {value:"none", label:"None / spotting"},
              {value:"light", label:"Light (<1/hr)"},
              {value:"moderate", label:"Moderate (1–2/hr)"},
              {value:"heavy", label:"Heavy (≥2/hr)"},
            ]} />
          } />
          <Row label="Signs of infection" hint="Fever, foul discharge, uterine tenderness" control={
            <div className="seg" role="radiogroup">
              {["no","yes"].map(v => <button key={v} type="button" className="seg__opt" aria-pressed={s.signsOfInfection === v} onClick={() => set("signsOfInfection", v)} style={{ minWidth: "72px" }}>{v === "no" ? "No" : "Yes"}</button>)}
            </div>
          } />
          <Row label="Products of conception at os" hint="On speculum exam" control={
            <div className="seg" role="radiogroup">
              {["no","yes"].map(v => <button key={v} type="button" className="seg__opt" aria-pressed={s.pocOs === v} onClick={() => set("pocOs", v)} style={{ minWidth: "72px" }}>{v === "no" ? "No" : "Yes"}</button>)}
            </div>
          } />
          {s.pocOs === "yes" && (
            <div className="alert alert--warn" style={{ margin: "0 16px 8px" }}>
              <div className="alert__body">
                <div className="alert__title">Products of conception at the os — consistent with miscarriage / early pregnancy loss.</div>
                <div className="alert__detail">All three management options (expectant, medical, surgical) may be appropriate. Discuss with patient.</div>
              </div>
            </div>
          )}
        </ExpandedStep>
      )}

      {/* ── Step 3: Ultrasound Findings ── */}
      {(!isMobile && step3Done) ? (
        <CollapsedStepBar
          stepNum={3}
          headline="Ultrasound Findings"
          detail={usImpressionLabel}
          onEdit={() => setStep3Done(false)}
        />
      ) : (isMobile && mobileStep !== 3) ? null : (
        <ExpandedStep
          num={3} label="Ultrasound Findings"
          eligibilityOk={step3EligibilityOk}
          done={step3Done}
          onDone={() => setStep3Done(true)}
        >
          {/* Impression selector */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "6px" }}>Impression</label>
            {s.usImpressionUnverified && (
              <div style={{ marginBottom: "8px", padding: "8px 12px", borderRadius: "6px", background: "var(--yk-warn-bg)", border: "1px solid var(--yk-warn-bd)", fontSize: "12.5px", color: "var(--yk-warn-fg)", fontWeight: 500 }}>
                Pre-filled from entry screen — confirm below
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "480px", gap: "8px" }}>
              {[
                {value:"iup",            label:"Intrauterine pregnancy",                       desc:"Yolk sac or embryo identified within intrauterine gestational sac"},
                {value:"pul",            label:"Pregnancy of unknown location / Indeterminate",   desc:"No IUP, no adnexal mass — ectopic not yet excluded"},
                {value:"ectopic",        label:"Ectopic pregnancy",                            desc:"No intrauterine pregnancy; adnexal mass / suspicious findings present"},
                {value:"definitive-epl", label:"Definitive early pregnancy loss",              desc:"Meets SRU 2013 criteria for nonviability"},
              ].map(opt => {
                const isSelected = s.usImpression === opt.value;
                const isEpl = opt.value === "definitive-epl";
                return (
                  <div
                    key={opt.value}
                    style={{
                      borderRadius: "8px", overflow: "hidden",
                      border: `1.5px solid ${isSelected ? "var(--yk-sage-500)" : "var(--yk-ink-150)"}`,
                      background: isSelected ? "var(--yk-sage-50)" : "white",
                      transition: "border-color 0.12s, background 0.12s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", cursor: "pointer" }}
                      onClick={() => { set("usImpression", opt.value); set("usImpressionUnverified", false); }}>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--yk-ink-900)" }}>{opt.label}</div>
                        <div style={{ fontSize: "12px", color: "var(--yk-ink-500)", marginTop: "2px" }}>{opt.desc}</div>
                      </div>
                      {isSelected && (
                        <button onClick={e => { e.stopPropagation(); set("usImpression", null); set("usImpressionUnverified", false); }} style={{
                          appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)",
                          borderRadius: "4px", cursor: "pointer", fontFamily: "inherit",
                          fontSize: "11px", color: "var(--yk-ink-400)", padding: "2px 7px", flexShrink: 0, marginLeft: "8px",
                        }}>✕ Clear</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paste & interpret */}
          <div style={{ marginBottom: "14px" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <button
                disabled={usInterpreting}
                onClick={() => fetchUSInterpretation(usReportText)}
                style={{
                  appearance: "none", padding: "7px 16px", borderRadius: "6px", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "13px", fontWeight: 600,
                  background: "white", color: "var(--yk-ink-700)",
                  border: "1px solid var(--yk-ink-200)",
                }}
              >
                {usInterpreting ? "Interpreting…" : "Input"}
              </button>
              {usInterpretError && <span style={{ fontSize: "12px", color: "#B91C1C" }}>{usInterpretError}</span>}
            </div>
            {s.usInterpretation && (
              <div style={{ padding: "12px 14px", borderRadius: "8px", background: "var(--yk-info-bg)", border: "1px solid var(--yk-info-bd)" }}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-info-fg)", marginBottom: "6px" }}>
                  AI impression: {s.usInterpretation.classification.category.replace(/_/g," ")}
                </div>
                <ul style={{ margin: "0 0 10px", paddingLeft: "18px", fontSize: "12.5px", color: "var(--yk-info-fg)" }}>
                  {s.usInterpretation.classification.criteria.map((c,i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Measurement inputs — PUL/indeterminate only */}
          <div style={s.usImpression !== "pul" ? {display:"none"} : undefined}>

            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "10px" }}>Measurement inputs (SRU criteria)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Row
                label="Cardiac activity"
                hint="M-mode preferred; document HR if present"
                citeIds={["doubilet-2013"]}
                control={
                  <div className="seg" role="radiogroup">
                    {[{v:"present",l:"Present"},{v:"absent",l:"Absent"}].map(({v,l}) => (
                      <button key={v} type="button" className="seg__opt" aria-pressed={s.usCardiac === v} onClick={() => set("usCardiac", v)} style={{ minWidth: "76px" }}>{l}</button>
                    ))}
                  </div>
                }
              />
              <Row
                label="Crown–rump length (CRL)"
                hint="If embryo visible and measurable"
                citeIds={["doubilet-2013"]}
                control={
                  <div>
                    <div style={s.usNoEmbryo ? {opacity:0.4, pointerEvents:"none"} : undefined}>
                      <NumInput
                        value={s.usCrl}
                        onChange={(v) => {
                          if (v === 0) { setState(prev => ({ ...prev, usCrl: null, usNoEmbryo: true })); }
                          else { set("usCrl", v); }
                        }}
                        unit="mm" placeholder="—" min={0} step={1}
                      />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12.5px", color: "var(--yk-ink-600)", cursor: "pointer" }}>
                      <input type="checkbox" checked={!!s.usNoEmbryo} onChange={e => set("usNoEmbryo", e.target.checked)} />
                      No embryo visualized
                    </label>
                  </div>
                }
              />
              {(s.usCrl == null || s.usNoEmbryo) && (
                <Row
                  label="Yolk sac"
                  hint="Presence confirms intrauterine location"
                  citeIds={["doubilet-2013"]}
                  control={
                    <div className="seg" role="radiogroup">
                      {[{v:"present",l:"Present"},{v:"absent",l:"Absent"}].map(({v,l}) => (
                        <button key={v} type="button" className="seg__opt" aria-pressed={s.usYolkSac === v} onClick={() => set("usYolkSac", v)} style={{ minWidth: "76px" }}>{l}</button>
                      ))}
                    </div>
                  }
                />
              )}
              {(s.usCrl == null || s.usNoEmbryo) && (
                <Row
                  label="Mean sac diameter (MSD)"
                  citeIds={["doubilet-2013"]}
                  control={<NumInput value={s.usMsd} onChange={(v) => set("usMsd", v)} unit="mm" placeholder="—" min={0} step={1} />}
                />
              )}
              {!yolkSacSeen && (s.usCrl == null || s.usNoEmbryo) && (
                <Row
                  label="Time since gestational sac seen without a yolk sac"
                  citeIds={["doubilet-2013"]}
                  control={
                    <div className="seg" role="radiogroup">
                      {[{v:"none",l:"N/A"},{v:"lt11d",l:"<11 days"},{v:"ge11d",l:"≥11 days"}].map(({v,l}) => (
                        <button key={v} type="button" className="seg__opt" aria-pressed={s.usSinceNoYS === v} onClick={() => set("usSinceNoYS", v)} style={{ minWidth: "76px" }}>{l}</button>
                      ))}
                    </div>
                  }
                />
              )}
              {(s.usCrl == null || s.usNoEmbryo) && s.usYolkSac === "present" && (
                <Row
                  label="Time since sac + yolk sac — no embryo"
                  hint="From earliest US with YS but no embryo"
                  citeIds={["doubilet-2013"]}
                  control={
                    <div className="seg" role="radiogroup">
                      {[{v:"none",l:"N/A"},{v:"lt11d",l:"<11 days"},{v:"ge11d",l:"≥11 days"}].map(({v,l}) => (
                        <button key={v} type="button" className="seg__opt" aria-pressed={s.usSinceWithYS === v} onClick={() => set("usSinceWithYS", v)} style={{ minWidth: "76px" }}>{l}</button>
                      ))}
                    </div>
                  }
                />
              )}
              <Row
                label="Free fluid in cul-de-sac"
                hint="Large fluid suggests ectopic rupture or hemorrhage"
                citeIds={["acog-tubal-2018"]}
                control={
                  <div className="seg" role="radiogroup">
                    {[{v:"none",l:"None"},{v:"trace",l:"Trace"},{v:"mod",l:"Moderate"},{v:"large",l:"Large"}].map(({v,l}) => (
                      <button key={v} type="button" className="seg__opt" aria-pressed={s.freeFluid === v} onClick={() => set("freeFluid", v)} style={{ minWidth: "72px" }}>{l}</button>
                    ))}
                  </div>
                }
                points={s.freeFluid === "large" ? "→ consult OB" : "—"}
              />
            </div>
          </div>

        </ExpandedStep>
      )}

      {/* ── Step 4: β-hCG ── */}
      {(!isMobile && step4Done) ? (
        <CollapsedStepBar
          stepNum={4}
          headline="48-Hour Serial β-hCG"
          detail={hcg != null ? (hcg48 != null && hcg > 0 ? `${hcg.toLocaleString()} → ${hcg48.toLocaleString()} mIU/mL (${hcgInterp})` : `${hcg.toLocaleString()} mIU/mL`) : "Not applicable"}
          onEdit={() => setStep4Done(false)}
        />
      ) : (isMobile && mobileStep !== 4) ? null : (
        <ExpandedStep
          num={4} label="48-Hour Serial β-hCG"
          eligibilityOk={step4EligibilityOk}
          done={step4Done}
          onDone={() => setStep4Done(true)}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--yk-ink-500)" }}>
              Skip when SRU criteria already met. Useful for indeterminate scans or PUL workup.
            </span>
            <button
              onClick={() => setStep4Done(true)}
              style={{
                appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)",
                borderRadius: "6px", padding: "4px 12px", fontFamily: "inherit",
                fontSize: "11.5px", color: "var(--yk-ink-500)", cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Hide — not applicable
            </button>
          </div>
          <Row
            label="Initial β-hCG"
            citeIds={["acog-200-2018"]}
            control={<NumInput value={s.hcg} onChange={(v)=>set("hcg",v)} unit="mIU/mL" placeholder="0" min={0} step={1}/>}
            points="—"
          />
          {s.hcg != null && s.hcg48 == null && (
            <button onClick={() => set("hcg48", "")} style={{
              appearance: "none", background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: "12.5px", color: "var(--yk-sage-600)", fontWeight: 600,
              padding: 0, textAlign: "left",
            }}>+ Add 48-hour follow-up value</button>
          )}
          {(s.hcg48 != null) && (
          <Row
            label="48h repeat β-hCG"
            hint="Optional — for trend interpretation"
            control={<NumInput value={s.hcg48} onChange={(v)=>set("hcg48",v)} unit="mIU/mL" placeholder="0" min={0} step={1}/>}
            points="—"
          />
          )}
          {hcgContextNote && (
            <div style={{ fontSize: '12px', color: 'var(--yk-ink-400)', marginBottom: '8px', fontStyle: 'italic' }}>
              {hcgContextNote}
            </div>
          )}
          {hcg != null && hcg48 != null ? (
            <HCGInterpreter
              baselineHCG={hcg}
              followUpHCG={hcg48}
              intervalHours={48}
              usContext={hcgUsContext}
            />
          ) : hcg != null ? (
            <div style={{ fontSize: '12.5px', color: 'var(--yk-ink-400)', fontStyle: 'italic' }}>Enter 48h follow-up hCG above to see trend interpretation.</div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--yk-ink-400)' }}>Enter initial β-hCG to see interpretation.</div>
          )}
        </ExpandedStep>
      )}

      {/* ── Step 5: Rh Status & RhoGAM ── */}
      {step4Done && ((!isMobile && step5Done) ? (
        <CollapsedStepBar
          stepNum={5}
          headline="Rh Status & RhoGAM"
          detail={s.rhStatus === "negative" ? "Rh-negative — RhoGAM indicated" : s.rhStatus === "positive" ? "Rh-positive" : s.rhStatus === "unknown" ? "Unknown" : undefined}
          onEdit={() => setStep5Done(false)}
        />
      ) : (isMobile && mobileStep !== 5) ? null : (
        <ExpandedStep
          num={5}
          label="Rh Status & RhoGAM"
          eligibilityOk={step5EligibilityOk}
          done={step5Done}
          onDone={() => setStep5Done(true)}
        >
          <div style={{ padding: "4px 0 8px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "6px" }}>
              Rh(D) status <span style={{ fontWeight: 400, color: "var(--yk-ink-400)" }}>Determines RhoGAM eligibility</span>
            </label>
            <Segmented
              value={s.rhStatus}
              onChange={(v) => set("rhStatus", v)}
              options={[
                {value:"positive", label:"Rh positive"},
                {value:"negative", label:"Rh negative"},
                {value:"unknown",  label:"Unknown"},
              ]}
            />
            {s.rhStatus === "negative" && (
              <div style={{ marginTop: "12px" }}>
                <Recommendation
                  title="RhoGAM — Rh(D)-negative patient"
                  body="Rh(D) immune globulin is indicated for Rh-negative patients with early pregnancy loss or bleeding. Administer within 72h. Dose per institutional formulary (typically 300mcg IM for ≥12 weeks, 50mcg or 300mcg for <12 weeks per local availability). Consult your institution's protocol."
                  citeIds={["smfm-rh-2024"]}
                  onAsk={() => onAsk("What are the SMFM recommendations for Rh(D) immune globulin in early pregnancy loss?")}
                />
              </div>
            )}
            {(s.rhStatus === "positive" || s.rhStatus === "unknown") && (
              <div style={{ marginTop: "10px", fontSize: "12.5px", color: "var(--yk-ink-500)" }}>
                {s.rhStatus === "positive" ? "Rh-positive — RhoGAM not indicated." : "Rh status unknown — obtain type & screen if not already done."}
              </div>
            )}
          </div>
        </ExpandedStep>
      ))}

      {/* ── Clinical Assessment — appears as soon as impression is selected ── */}
      {s.usImpression != null && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "28px", marginBottom: "14px" }}>
            <img src={logoUrl} alt="" style={{ width: "18px", height: "18px", objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--yk-ink-900)" }}>Clinical Assessment</span>
          </div>
          <div style={{ background: "white", border: "1px solid var(--yk-sage-200)", borderRadius: "var(--yk-radius-lg)", overflow: "hidden", padding: "16px" }}>
          {/* Final interpretation box */}
          {finalConclusion !== "pending" && usResult !== "Awaiting input" && (
            <div style={{
              marginBottom: "16px", borderRadius: "10px",
              background: (s.usImpression === "ectopic" || isEplConclusion) ? "#FEE2E2" : conclusionBg,
              border: `1.5px solid ${(s.usImpression === "ectopic" || isEplConclusion) ? "#FCA5A5" : conclusionBorder}`,
              padding: "14px 16px",
            }}>
              {(() => {
                const ectopicOverride = s.usImpression === "ectopic" || isEplConclusion;
                const textColor = ectopicOverride ? "#7F1D1D" : conclusionDark;
                const chipBg = ectopicOverride ? "rgba(127,29,29,0.1)" : conclusionChip;
                const chipColor = ectopicOverride ? "#991B1B" : conclusionMid;
                return (<>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: textColor, marginBottom: "6px" }}>{usResult}</div>
                  {usDetail && triggeredDefinitive.length === 0 && triggeredProbable.length === 0 && !indeterminateReason && (
                    <div style={{ fontSize: "12.5px", color: textColor, lineHeight: 1.6, marginBottom: fibFields.length > 0 ? "10px" : 0 }}>
                      {usDetail}
                    </div>
                  )}
                  {fibFields.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "4px", marginBottom: triggeredDefinitive.length > 0 ? "10px" : 0 }}>
                      {fibFields.map((f, i) => (
                        <span key={i} style={{ fontSize: "11px", background: chipBg, color: chipColor, borderRadius: "4px", padding: "2px 7px", fontFamily: "var(--yk-font-mono, monospace)" }}>{f}</span>
                      ))}
                    </div>
                  )}
                  {/* Merge criteria inline for EPL — avoids duplicate box */}
                  {isEplConclusion && triggeredDefinitive.map((c, i) => (
                    <div key={i} style={{ marginTop: "8px", fontSize: "12.5px", color: "#7F1D1D" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444", marginRight: "8px", verticalAlign: "middle" }} />
                      <strong>{c.threshold}</strong>{" — "}{c.text}
                      <span style={{ display: "block", marginLeft: "14px", fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>Source: {c.cite}</span>
                    </div>
                  ))}
                </>);
              })()}
            </div>
          )}
          {/* Criterion match panel — hidden for EPL (merged into interpretation box above) */}
          {!isEplConclusion && (triggeredDefinitive.length > 0 || triggeredProbable.length > 0 || indeterminateReason) && (
            <div style={{ marginBottom: "12px", borderRadius: "8px", border: `1.5px solid ${triggeredDefinitive.length > 0 ? "#FCA5A5" : "#FCD34D"}`, background: triggeredDefinitive.length > 0 ? "#FEF2F2" : "#FFFBEB", padding: "12px 14px", fontSize: "12.5px" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px", color: triggeredDefinitive.length > 0 ? "#B91C1C" : "#92400E", fontSize: "13px" }}>
                {triggeredDefinitive.length > 0 ? "Definitive Early Pregnancy Loss" : triggeredProbable.length > 0 ? "Probable Early Pregnancy Loss" : "Indeterminate — Too Early to Confirm"}
              </div>
              {triggeredDefinitive.map((c, i) => (
                <div key={i} style={{ marginBottom: "6px", color: "#B91C1C" }}>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444", marginRight: "8px", verticalAlign: "middle" }} />
                  <strong>{c.threshold}</strong>{" — "}<span style={{ color: "#7F1D1D" }}>{c.text}</span>
                  <span style={{ display: "block", marginLeft: "14px", fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>Source: {c.cite}</span>
                </div>
              ))}
              {triggeredProbable.length > 0 && (<>
                {triggeredProbable.map((c, i) => (
                  <div key={i} style={{ marginBottom: "6px", color: "#92400E" }}>
                    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", marginRight: "8px", verticalAlign: "middle" }} />
                    <strong>{c.threshold}</strong>{" — "}<span style={{ color: "#78350F" }}>{c.text}</span>
                    <span style={{ display: "block", marginLeft: "14px", fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>Source: {c.cite}</span>
                  </div>
                ))}
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#92400E", fontStyle: "italic" }}>High likelihood of nonviable pregnancy — serial scan recommended to confirm.</div>
              </>)}
              {indeterminateReason && (
                <div style={{ color: "#92400E" }}>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", marginRight: "8px", verticalAlign: "middle" }} />
                  {indeterminateReason}
                </div>
              )}
            </div>
          )}
          {/* No IUP — route to PUL tab */}
          {usNoIUP && (
            <button onClick={() => onSwitchTab("pul-ectopic")} style={{ appearance: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "6px", marginBottom: "16px", background: "var(--yk-sage-500)", border: "none", fontSize: "13.5px", fontWeight: 700, color: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
              Go to Pregnancy of Unknown Location & Ectopic →
            </button>
          )}
          {/* Ectopic recommendations */}
          {isEctopicConclusion && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-ink-800)", marginBottom: "8px" }}>Ectopic / PUL Workup &amp; Consultation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Recommendation index="1" title={s.hemoStatus === "unstable" ? "Emergent OB/Gyn consultation — activate now" : "OB/Gyn consultation required — do not discharge without GYN evaluation"} body={s.hemoStatus === "unstable" ? "Patient is hemodynamically unstable — emergent surgical consultation required immediately. Two large-bore IVs, type & crossmatch, activate OB on-call now." : "GYN consultation required before any disposition decision. Do not discharge without OB/Gyn evaluation and documented plan."} citeIds={["acog-tubal-2018"]} tags={[{kind:"warn", label:"Required"}]} onAsk={() => onAsk("What are the indications for emergent vs. non-emergent GYN consult for suspected ectopic pregnancy?")} />
                <Recommendation index="2" title="Quantitative β-hCG if not yet obtained" body="Obtain serum β-hCG urgently. Discriminatory zone: ≥3,500 mIU/mL — if no IUP identified at this level, ectopic is the working diagnosis. If ≥10,000 mIU/mL, emergent GYN consult is mandated per ACCESS-Bridge protocol. Serial hCG in 48–72h if non-emergent workup." citeIds={["acog-tubal-2018"]} onAsk={() => onAsk("How should I interpret β-hCG in a patient with suspected ectopic pregnancy?")} />
                <Recommendation index="3" title="IV access · type &amp; screen · hemodynamic monitoring" body="Establish IV access and send type & screen. Monitor vitals continuously. If free fluid or instability: two large-bore IVs, type & crossmatch, surgical team notification." onAsk={() => onAsk("What initial stabilization steps are needed for suspected ectopic in the ED?")} />
                {hcg != null && hcg < 5000 && finalConclusion !== "pul-highrisk" && (
                  <Recommendation index="4" title="Methotrexate candidacy — GYN decision" body={`β-hCG ${hcg.toLocaleString()} mIU/mL is below 5,000 mIU/mL. Patient may be a methotrexate candidate (50 mg/m² IM) if: mass <3.5 cm, no cardiac activity, no contraindications. This decision requires GYN consultation — do not initiate without specialist input. (ACCESS-Bridge protocol.)`} citeIds={["acog-tubal-2018"]} onAsk={() => onAsk("What are the criteria for methotrexate treatment of ectopic pregnancy?")} />
                )}
              </div>
              <CollapsibleRefs ids={["acog-tubal-2018"]} />
              <button onClick={() => onSwitchTab("pul-ectopic")} style={{ appearance: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "6px", marginTop: "12px", background: "var(--yk-sage-500)", border: "none", fontSize: "13.5px", fontWeight: 700, color: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>Go to Pregnancy of Unknown Location & Ectopic →</button>
            </div>
          )}
          {/* Viable IUP recommendations */}
          {isViableConclusion && !isEctopicConclusion && !isEplConclusion && s.usImpression !== "ectopic" && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-ink-800)", marginBottom: "8px" }}>Viable Pregnancy — Next Steps</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Recommendation index="1" title={finalConclusion === "iup-confirmed" ? "OB/Gyn follow-up — repeat TVUS in 7–10 days" : "OB/Gyn follow-up — routine"} body={finalConclusion === "iup-confirmed" ? "Intrauterine location confirmed by gestational sac ± yolk sac; viability is not yet assessable. OB/Gyn follow-up with repeat TVUS in 7–10 days to assess embryo development and cardiac activity." : "Viable IUP confirmed with cardiac activity. Reassure patient — bleeding in early pregnancy is common and often not dangerous. Manage symptomatically; OB/Gyn follow-up at appropriate interval."} citeIds={["acog-200-2018"]} onAsk={() => onAsk("What follow-up is appropriate for a viable IUP with first-trimester bleeding?")} />
                <Recommendation index="2" title="Return precautions" body="Return to ED immediately if: soaking more than 2 pads per hour for two hours; fever above 101°F (38.3°C); severe one-sided abdominal pain; dizziness or fainting. Light spotting and mild cramping are expected and are not emergencies." onAsk={() => onAsk("What return precautions should I give a patient with a viable IUP and first-trimester spotting?")} />
              </div>
              <CollapsibleRefs ids={["acog-200-2018"]} />
            </div>
          )}
          {/* Serial monitoring plan */}
          {isProbableOrSerial && !isEplConclusion && !isViableConclusion && !isEctopicConclusion && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-ink-800)", marginBottom: "8px" }}>Serial Monitoring Plan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Recommendation index="1" title="Repeat TVUS in 7–14 days — do not initiate management before confirmation" body="Findings are not yet diagnostic for EPL per Society of Radiologists in Ultrasound (2013) criteria. Repeat TVUS is required before any management decision. Do not initiate expectant, medical, or surgical management without confirming nonviability." citeIds={["doubilet-2013"]} onAsk={() => onAsk("How should I counsel a patient about waiting for repeat ultrasound to confirm pregnancy failure?")} />
                <Recommendation index="2" title="Serial β-hCG in 48–72h" body={hcg != null ? `Baseline β-hCG ${hcg.toLocaleString()} mIU/mL. Repeat in 48–72h. Normal rise: ≥${hcg < 1500 ? 49 : hcg < 3000 ? 40 : 33}% (for this baseline) suggests viable IUP. Fall ≥21% suggests EPL. Abnormal trend (neither rising adequately nor falling) requires ectopic exclusion.` : "Obtain baseline β-hCG now. Serial trend in 48–72h differentiates viable IUP (normal rise), EPL (≥21% fall), and ectopic (abnormal pattern). Correlate with repeat TVUS."} citeIds={["acog-200-2018"]} onAsk={() => onAsk("How do I interpret serial β-hCG trends in a patient with indeterminate ultrasound findings?")} />
                <Recommendation index="3" title="Ectopic precautions — document and counsel" body="7% of PULs are ultimately ectopic. Patient must be counseled on ectopic precautions and instructed to return immediately if: soaking more than 2 pads per hour, severe one-sided pain, shoulder tip pain, dizziness, or fainting. Document ectopic precautions given in the chart." citeIds={["acog-tubal-2018"]} onAsk={() => onAsk("What ectopic precautions should I document for a patient with indeterminate ultrasound findings?")} />
              </div>
              <CollapsibleRefs ids={["doubilet-2013","acog-200-2018","acog-tubal-2018"]} />
            </div>
          )}
          {/* SRU 2013 reference card — shown under EPL conclusion */}
          {isEplConclusion && (
            <div style={{ border: "1px solid var(--yk-ink-150)", borderRadius: "8px", overflow: "hidden" }}>
              <button onClick={() => setSruOpen(o => !o)} style={{ appearance: "none", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--yk-ink-50)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-800)" }}>SRU 2013 — EPL Diagnostic Criteria</span>
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none" style={{ transform: sruOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {sruOpen && (
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#B91C1C", marginBottom: "6px" }}>Definitive nonviable pregnancy</div>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {["hCG falls, or rises less than 11% over 48h, if initial US showed IUP","No pregnancy on ultrasound and visible fetus passed by patient or on exam","CRL ≥7mm with no fetal cardiac activity","MSD ≥25mm with no embryo","No embryo with cardiac activity ≥2 weeks after scan showing empty gestational sac","No embryo with cardiac activity ≥11 days after scan showing gestational sac with yolk sac","Prior scan showing cardiac activity; current scan shows no cardiac activity or no embryo"].map((c,i) => (
                        <li key={i} style={{ fontSize: "12px", color: "var(--yk-ink-700)", lineHeight: 1.55 }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#92400E", marginBottom: "6px" }}>Probable nonviable pregnancy</div>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {["CRL <7mm with no fetal cardiac activity","MSD 16–24mm with no embryo","No embryo with cardiac activity 7–13 days after scan showing empty gestational sac","No embryo with cardiac activity 7–10 days after scan showing gestational sac with yolk sac","No embryo ≥6 weeks after LMP (if patient certain of dates, normal cycles, no hormonal contraception or breastfeeding)","Empty sac seen adjacent to yolk sac with no embryo","Yolk sac >7mm","Difference between MSD and CRL <5mm"].map((c,i) => (
                        <li key={i} style={{ fontSize: "12px", color: "var(--yk-ink-700)", lineHeight: 1.55 }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--yk-ink-400)" }}>Doubilet et al., New England Journal of Medicine, 2013</div>
                </div>
              )}
            </div>
          )}

          {/* PUL + undesired pregnancy → MAB option */}
          {s.usImpression === "pul" && !isEplConclusion && (
            <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "8px", background: "var(--yk-ink-50)", border: "1px solid var(--yk-ink-200)" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-800)", marginBottom: "4px" }}>If this is an undesired pregnancy</div>
              <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)", lineHeight: 1.6, marginBottom: "10px" }}>
                Mifepristone + misoprostol is appropriate for PUL when the pregnancy is undesired — ectopic exclusion is not required before treatment. Serial hCG follow-up to zero is mandatory. (Goldberg et al., 2022)
              </div>
              <button onClick={() => onSwitchTab("med-abortion")} style={{ appearance: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "6px", background: "var(--yk-sage-500)", border: "none", fontSize: "13px", fontWeight: 600, color: "white" }}>
                Go to Medication Abortion tab →
              </button>
            </div>
          )}

          </div>
        </div>
      )}

      {/* ── Management Pathway — separate box, EPL only ── */}
      {s.usImpression != null && isEplConclusion && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", marginBottom: "14px" }}>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--yk-ink-900)" }}>Management Pathway</span>
          </div>
          <div style={{ background: "white", border: "1px solid var(--yk-sage-200)", borderRadius: "var(--yk-radius-lg)", overflow: "hidden", padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-800)", marginBottom: "4px" }}>Choose a management pathway</div>
            <div style={{ fontSize: "12px", color: "var(--yk-ink-500)", marginBottom: "10px" }}>All three options are first-line — choose based on patient preference and clinical status.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { value: "expectant", label: "Expectant Management", sub: "61% effective by 14 days — allow natural expulsion with no medication or procedure", mgmtType: null, content: (<div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><p style={{ margin: "0 0 4px" }}><strong>Indications:</strong> Hemodynamically stable, first trimester, patient prefers to avoid intervention</p><p style={{ margin: "4px 0" }}><strong>Contraindications:</strong> Instability, active infection, heavy bleeding, patient unwilling to wait</p><p style={{ margin: "4px 0" }}><strong>Details:</strong> Success ~50–80% within 2 weeks; allow up to 4 weeks. Confirm completion with repeat TVUS or urine hCG at 2–4 weeks.</p><p style={{ margin: "4px 0" }}><strong>Counseling:</strong> Heavy bleeding and cramping expected over days–weeks. Return if soaking more than 2 pads per hour for two hours, fever, or severe pain.</p>{mgmtGuidance.expectant?.length > 0 && <MgmtGuidancePanel chunks={mgmtGuidance.expectant} />}</div>) },
                { value: "medical", label: "Medical Management", sub: "84–93% effective by 8 days — Mifepristone 200mg PO → Misoprostol 800mcg vaginally/buccal 24–48h later", mgmtType: "medical", content: (<div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><p style={{ margin: "0 0 4px" }}><strong>Indications:</strong> Stable, ≤12 weeks, patient prefers non-surgical, no prostaglandin allergy</p><p style={{ margin: "4px 0" }}><strong>Contraindications:</strong> Prostaglandin allergy, IUD in situ (remove first), coagulopathy, active infection</p><p style={{ margin: "8px 0 2px" }}><strong>Step 1:</strong> Mifepristone 200mg PO</p><p style={{ margin: "2px 0 4px" }}><strong>Step 2:</strong> Misoprostol 800mcg vaginally or buccally, 24–48 hours after mifepristone</p><p style={{ margin: "4px 0" }}><strong>Counseling:</strong> Heavy bleeding and cramping 1–4h after second pill. Pre-treat with ibuprofen 600mg. Passage of tissue confirms effect.</p>{mgmtGuidance.medical?.length > 0 && <MgmtGuidancePanel chunks={mgmtGuidance.medical} />}</div>) },
                { value: "surgical", label: "Surgical Management (MVA / D&C)", sub: "97% effective after the procedure — uterine aspiration, highest single-visit completion rate", mgmtType: "surgical", content: (<div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><p style={{ margin: "0 0 4px" }}><strong>Indications:</strong> Patient preference, failed expectant/medical Mx, heavy bleeding, instability, infection, tissue at os</p><p style={{ margin: "4px 0" }}><strong>Contraindications:</strong> Coagulopathy (relative); recent uterine surgery (discuss with OB/Gyn)</p><p style={{ margin: "4px 0" }}><strong>Details:</strong> MVA preferred in first trimester; D&amp;C is the alternative. Usually outpatient, local or general anesthesia. Completion &gt;95%.</p><p style={{ margin: "4px 0" }}><strong>Counseling:</strong> Same-day discharge. Light cramping and bleeding 1–2 weeks. Follow-up in 1–2 weeks to confirm completion.</p>{mgmtGuidance.surgical?.length > 0 && <MgmtGuidancePanel chunks={mgmtGuidance.surgical} />}</div>) },
              ].map(card => {
                const selected = s.mxChoice === card.value;
                return (
                  <div key={card.value} onClick={() => { set("mxChoice", card.value); if (card.mgmtType) fetchMgmtGuidance(card.mgmtType); }} style={{ border: selected ? "2px solid #10B981" : "1px solid var(--yk-ink-200)", borderRadius: "8px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: selected ? "var(--yk-sage-50, #F0FDF4)" : "white" }}>
                      <div><div style={{ fontWeight: 600, fontSize: "13px", color: "var(--yk-ink-800)" }}>{card.label}</div><div style={{ fontSize: "12px", color: "var(--yk-ink-600)", marginTop: "2px" }}>{card.sub}</div></div>
                      <CheckCircle checked={selected} tone="sage" size={22} />
                    </div>
                    {selected && <div style={{ padding: "0 12px 12px 32px", borderTop: "1px solid var(--yk-sage-100)" }}>{card.content}</div>}
                  </div>
                );
              })}
            </div>
            {s.mxChoice === "medical" && !s.remsConfirmed && !s.remsSkipped && (<div style={{ marginTop: "10px", padding: "10px 14px", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", fontSize: "12.5px", color: "#78350F" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}><div style={{ fontWeight: 600 }}>Mifepristone requires REMS certification before prescribing. Are you certified?</div><button onClick={() => onSwitchTab("rems")} style={{ appearance: "none", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11.5px", color: "#92400E", fontWeight: 600, textDecoration: "underline", whiteSpace: "nowrap", marginLeft: "12px", padding: 0 }}>REMS Certification guide →</button></div><div style={{ display: "flex", gap: "8px" }}><button onClick={() => set("remsConfirmed", true)} style={{ padding: "5px 12px", borderRadius: "6px", background: "#92400E", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Yes, I am certified</button><button onClick={() => set("remsSkipped", true)} style={{ padding: "5px 12px", borderRadius: "6px", background: "transparent", color: "#78350F", border: "1px solid #FCD34D", cursor: "pointer", fontSize: "12px" }}>No / Skip for now</button></div></div>)}
            {s.mxChoice === "medical" && s.remsSkipped && !s.remsConfirmed && (<div style={{ fontSize: "12px", color: "var(--yk-ink-500)", display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>REMS certification skipped<button onClick={() => set("remsSkipped", false)} style={{ appearance: "none", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11.5px", color: "var(--yk-ink-400)", textDecoration: "underline", padding: 0 }}>Change</button></div>)}
            {s.mxChoice === "medical" && s.remsConfirmed && (<div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ fontSize: "12px", color: "#065F46", fontWeight: 600 }}>✓ REMS certification confirmed</div><button onClick={() => set("remsConfirmed", false)} style={{ appearance: "none", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11.5px", color: "var(--yk-ink-400)", textDecoration: "underline", padding: 0 }}>Change</button></div><div style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>Patient agreement form required:{" "}<a href="https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-716-Patient-Agreement.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yk-sage-700)", fontWeight: 600 }}>GenBioPro ↗</a>{" · "}<a href="https://www.earlyoptionpill.com/wp-content/uploads/2026/04/Danco_Prescriber-Agreement-Form_092025.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yk-sage-700)", fontWeight: 600 }}>Danco (Mifeprex) ↗</a></div></div>)}
            <div style={{ marginTop: "10px" }}><CollapsibleRefs ids={["acog-200-2018","schreiber-pregloss-2018","rcog-gtg17"]} /></div>
          </div>
        </div>
      )}




      {/* ── Step 6: Aftercare & Discharge — hidden when emergent escalation is needed ── */}
      {!showAlert && !isEctopicConclusion && ((!isMobile && step6Done) ? (
        <CollapsedStepBar
          stepNum={6}
          headline="Aftercare & Discharge"
          detail="discharge instructions reviewed"
          onEdit={() => setStep6Done(false)}
        />
      ) : (isMobile && mobileStep !== 6) ? null : !isEplConclusion ? (
        /* Greyed-out placeholder for non-EPL conclusions */
        <div style={{
          border: "2px dashed var(--yk-ink-150, #e5e5e5)", borderRadius: "10px",
          padding: "20px 24px", margin: "12px 0", background: "var(--yk-canvas, #fafaf7)",
          color: "var(--yk-ink-400, #9ca3af)", fontSize: "13.5px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Step 06</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--yk-ink-700)" }}>
              Aftercare & Discharge{" "}
              <span style={{ fontWeight: 400, color: "var(--yk-ink-400)" }}>— not applicable for this diagnosis</span>
            </div>
          </div>
          <StepCheckbox done={false} onChange={() => {}} disabled />
        </div>
      ) : (
        <ExpandedStep
          num={6} label="Aftercare & Discharge" hideNum
          eligibilityOk={step6EligibilityOk}
          done={step6Done}
          onDone={() => setStep6Done(true)}
        >
          {/* Discharge instructions */}
          <div style={{ marginBottom: "16px", padding: "14px 16px", borderRadius: "8px", background: "var(--yk-ink-50, #f9fafb)", border: "1px solid var(--yk-ink-200)" }}>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#9F1239", marginBottom: "8px" }}>
              Come back to the ED if…
            </div>
            {isMedical ? (
              <div style={{ fontSize: "12px", color: "#881337", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                <div>{medIntro}</div>
                <div>{medOverview}</div>
                <div><strong>Step 1:</strong> {medStep1}</div>
                <div><strong>Step 2:</strong> {medStep2}</div>
                <div>
                  <strong>Second dose of misoprostol:</strong> {medSecondIntro}
                  <ul style={{ margin: "4px 0 2px 16px", padding: 0 }}>
                    {medSecondConditions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                  {medSecondOutro}
                </div>
                <div>
                  {medReturnIntro}
                  <ul style={{ margin: "4px 0 2px 16px", padding: 0 }}>
                    {medReturnItems.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "12px", color: "#881337", marginBottom: "8px" }}>{mgmtText}</div>
                <div style={{ fontSize: "12px", color: "#881337", marginBottom: "4px" }}><strong>Return to the ED if you experience any of the following:</strong></div>
                <ul style={{ fontSize: "12px", color: "#881337", margin: "0 0 8px 16px", padding: 0 }}>
                  {returnPrecautions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(dischargePlainText);
                setEpl6Copied(true);
                setTimeout(() => setEpl6Copied(false), 2000);
              }}
              style={{
                fontSize: "11px", border: "1px solid var(--yk-ink-200)", borderRadius: "4px",
                padding: "3px 8px", cursor: "pointer", color: "var(--yk-ink-600)",
                background: epl6Copied ? "var(--yk-ink-100)" : "transparent",
              }}
            >
              {epl6Copied ? "✓ Copied!" : "Copy to clipboard"}
            </button>
          </div>

          {/* Follow-up plan */}
          <div style={{ marginBottom: "16px", padding: "14px 16px", borderRadius: "8px", background: "var(--yk-ink-50, #f9fafb)", border: "1px solid var(--yk-ink-200)" }}>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-800)", marginBottom: "8px" }}>Follow-up plan</div>
            <div style={{ fontSize: "12px", color: "var(--yk-ink-700)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><strong>OB/GYN follow-up:</strong> within 1–2 weeks</div>
              <div><strong>Serum β-hCG:</strong> 1–2 weeks {timingPhrase}; expect ≥50% decline from baseline</div>
              <div><strong>Repeat ultrasound:</strong> 1–2 weeks if symptoms persist, hCG not declining, or baseline showed retained products — not routinely needed if asymptomatic and hCG declining</div>
              <div><strong>Repeat urine pregnancy test:</strong> 4 weeks {timingPhrase}</div>
            </div>
          </div>

          {/* Acknowledgment */}
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "12px 14px", borderRadius: "8px", border: `1.5px solid ${aftercareAck ? "#10B981" : "var(--yk-ink-200)"}`, background: aftercareAck ? "#F0FDF4" : "white", transition: "all 0.15s" }}>
            <CheckCircle checked={aftercareAck} tone="sage" size={22} />
            <input type="checkbox" checked={aftercareAck} onChange={e => setAftercareAck(e.target.checked)} style={{ display: "none" }} />
            <span style={{ fontSize: "13px", color: aftercareAck ? "#065F46" : "var(--yk-ink-700)", fontWeight: aftercareAck ? 600 : 400 }}>
              Discharge instructions reviewed with patient
            </span>
          </label>
        </ExpandedStep>
      ))}

      {/* ── Sticky progress footer ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "var(--yk-sage-50, #f4f7f4)", borderTop: "1px solid var(--yk-sage-200)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.07)",
      }}>
        <div style={{
          margin: "0 auto", padding: "12px 20px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          {isMobile && mobileStep > 1 && (
            <button onClick={() => {
              if (mobileStep === 6) setStep5Done(false);
              else if (mobileStep === 5) setStep4Done(false);
              else if (mobileStep === 4) setStep3Done(false);
              else if (mobileStep === 3) setStep2Done(false);
              else if (mobileStep === 2) setStep1Done(false);
            }} style={{
              appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)",
              borderRadius: "999px", padding: "7px 12px", fontSize: "12px", fontWeight: 600,
              color: "var(--yk-ink-600)", cursor: "pointer", flexShrink: 0,
            }}>← Back</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--yk-ink-800, #1f2937)" }}>
              {`Step ${mobileStep} of ${totalSteps} — ${mobileStepLabels[mobileStep - 1]}`}
            </div>
            <div style={{ marginTop: "6px", height: "4px", width: "100%", maxWidth: "240px", background: "var(--yk-ink-150, #e5e5e5)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${((mobileStep - 1) / totalSteps) * 100}%`,
                background: "#10B981", transition: "width 0.35s ease",
              }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--yk-ink-600, #4b5563)" }}>{doneCount} of {totalSteps} complete</div>
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
