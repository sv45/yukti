// EPL pathway — left side CDS tool.
// Ported from design_handoff_yukti/design_files/components/EPLPathway.jsx
// Adapted from window globals to ES module. Clinical logic preserved verbatim.

import React, { useState } from 'react';
import { Section, Row, Segmented, NumInput, Recommendation, RiskBand, ResultBlock, Cite } from './primitives';

function AcogDefinition() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "0 16px 12px" }}>
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
  return (
    <div style={{marginTop:"10px", paddingTop:"8px", borderTop:"1px solid var(--yk-sage-100)"}}>
      <div style={{fontSize:"11px", fontWeight:600, color:"var(--yk-ink-500)", letterSpacing:"0.06em", marginBottom:"6px"}}>FROM GUIDELINES</div>
      {chunks.slice(0, 2).map((c, i) => (
        <div key={i} style={{marginBottom:"8px"}}>
          <div style={{fontSize:"10.5px", color:"var(--yk-ink-400)", marginBottom:"2px"}}>
            {c.source_filename} · relevance {c.score}
          </div>
          <div style={{fontSize:"11.5px", color:"var(--yk-ink-600)", lineHeight:"1.55"}}>
            {c.text.slice(0, 320)}{c.text.length > 320 ? "…" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function CollapsibleRefs({ ids }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "0 16px 10px" }}>
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

export default function EPLPathway({ state, setState, onAsk, onSwitchTab }) {
  const s = state;
  const set = (k, v) => setState(prev => ({ ...prev, [k]: v }));
  const [copied, setCopied] = useState(false);
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
    console.log("interpret clicked", report);
    setUsInterpretError(null);
    if (!report || !report.trim()) {
      console.warn("[interpret-us] aborting — report is empty");
      setUsInterpretError("Please enter ultrasound findings before interpreting.");
      return;
    }
    const url = "/api/interpret-us";
    const payload = { report };
    console.log("[interpret-us] fetching", url, "payload:", payload);
    setUsInterpreting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("[interpret-us] response status:", res.status, res.statusText);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[interpret-us] non-OK response body:", errText);
        setUsInterpretError(`Server error ${res.status}: ${errText}`);
        return;
      }
      const data = await res.json();
      console.log("[interpret-us] success data:", data);
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

  /* ---- MSD–CRL difference flag (Doubilet 2013) ---- */
  const msdCrlFlag = !s.usNoEmbryo
    && s.usCrl != null && s.usMsd != null
    && (s.usMsd - s.usCrl) < 5;

  if (msdCrlFlag && !usDefinitive && imp !== "definitive-epl" && imp !== "ectopic" && imp !== "pul") {
    usResult = "Probable nonviable pregnancy";
    usBand   = <RiskBand level="mod">Repeat scan to confirm</RiskBand>;
    usDetail = "MSD to CRL difference <5mm — probable nonviable pregnancy. Consider repeat scan to confirm.";
  }

  // Append ectopic-excluded note when an intrauterine sac is visualized
  // For pul with iusSeen=true (indeterminate), the ectopic-excluded note is appropriate
  if (iusSeen && !cardiacNoEmbryo && usResult !== "Awaiting input"
      && imp !== "iup" && imp !== "complete-epl" && imp !== "ectopic" && imp !== "no-us") {
    usDetail = (usDetail ? usDetail + " " : "") + "Ectopic excluded by visualized intrauterine gestational sac (heterotopic pregnancy possible but rare — consider if IVF conception).";
  }

  // Build criterion lists for rich summary box
  const triggeredDefinitive = [];
  const triggeredProbable = [];
  let indeterminateReason = null;

  // Include pul with iusSeen (indeterminate sub-case) so criterion lists render when findings entered
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
  let hcgBand = null;
  let hcgDetail = null;
  if (hcg != null && hcg48 != null && hcg > 0) {
    const change = ((hcg48 - hcg) / hcg) * 100;
    const sign = change >= 0 ? "+" : "";
    hcgInterp = `${sign}${change.toFixed(0)}% over 48h`;
    if (change <= -21) {
      hcgBand = <RiskBand level="low">Falling — consistent with EPL</RiskBand>;
      hcgDetail = "≥21% drop / 48h is consistent with completed or resolving EPL.";
    } else {
      const minRise = hcg < 1500 ? 49 : hcg < 3000 ? 40 : 33;
      const baseLabel = hcg < 1500 ? "<1,500" : hcg < 3000 ? "1,500–3,000" : ">3,000";
      if (change >= minRise) {
        hcgBand = <RiskBand level="info">Rising appropriately</RiskBand>;
        hcgDetail = `≥${minRise}% rise (threshold for baseline ${baseLabel} mIU/mL) — consistent with viable IUP. Normal rise does not guarantee normal pregnancy. (ACCESS-Bridge protocol.)`;
      } else {
        hcgBand = <RiskBand level="mod">Abnormal trend — ectopic must be excluded</RiskBand>;
        hcgDetail = `Does not meet minimum rise (≥${minRise}% expected for baseline ${baseLabel} mIU/mL) and is not falling ≥21%. Ectopic must be excluded — workup per PUL/Ectopic pathway. (ACCESS-Bridge protocol.)`;
      }
    }
  } else if (hcg != null) {
    hcgInterp = `${hcg.toLocaleString()} mIU/mL — single value`;
    hcgBand = <RiskBand level="info">Reference only</RiskBand>;
    hcgDetail = "Single hCG rarely diagnostic. Trend over 48h if diagnosis uncertain.";
  }

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
        // True PUL — nothing seen
        if (_hiRisk || (_hv != null && _hv >= 10000)) finalConclusion = "pul-highrisk";
        else if (_hv != null && _hv >= 3500) finalConclusion = "pul-discriminatory";
        else finalConclusion = "pul-serial";
      } else {
        // Indeterminate — something was seen
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

  return (
    <>
      {/* === Emergent consult alert (only when red flags present) === */}
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

      {/* Section 1 — Patient context */}
      <Section
        num="01 / PATIENT CONTEXT"
        title="Gestational age"
        sub="Use best available dating (LMP or earliest ultrasound)."
        headerRight={
          <button
            className="hcg-toggle"
            onClick={() => set("gaOpen", !s.gaOpen)}
            aria-expanded={s.gaOpen}
          >
            {s.gaOpen ? "− Hide Gestational Age" : "+ Add Gestational Age"}
          </button>
        }
      >
        {s.gaOpen && (
          <>
            <Row
              label="Last menstrual period (LMP)"
              hint="First day of last period"
              citeIds={["acog-200-2018"]}
              control={
                <input
                  type="date"
                  value={s.lmp || ""}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => set("lmp", e.target.value || null)}
                  style={{ padding: "5px 8px", border: "1px solid var(--yk-ink-200)", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--yk-font-sans, sans-serif)" }}
                />
              }
              points={gaBand}
            />
            {s.lmp && lmpGaWeeks != null && (
              <div style={{ padding: "2px 18px 10px", fontSize: "12.5px", color: "var(--yk-ink-600)" }}>
                GA by LMP: <strong>{lmpGaWeeks}w {lmpGaDaysRem}d</strong>
              </div>
            )}
            <Row
              label="GA by ultrasound"
              hint="Optional — overrides LMP dating if entered"
              control={
                <div className="ga-input">
                  <NumInput
                    value={s.usGaWeeks}
                    onChange={(v) => set("usGaWeeks", v)}
                    unit="weeks"
                    placeholder="—"
                    min={0} max={23} step={1}
                  />
                  <NumInput
                    value={s.usGaDays}
                    onChange={(v) => set("usGaDays", v)}
                    unit="days"
                    placeholder="—"
                    min={0} max={6} step={1}
                  />
                </div>
              }
              points={hasUsGa ? `${s.usGaWeeks ?? 0}w ${s.usGaDays ?? 0}d` : "—"}
            />
          </>
        )}
      </Section>

      {/* Section 2 — Clinical findings (no scoring) */}
      <Section
        num="02 / CLINICAL FINDINGS"
        title="Bleeding, pain & exam"
        sub="Document findings. Findings flagged → consult OB trigger the alert above."
        headerRight={
          <button
            className="hcg-toggle"
            onClick={() => set("examOpen", !s.examOpen)}
            aria-expanded={s.examOpen}
          >
            {s.examOpen ? "− Hide Physical Exam" : "+ Add Physical Exam"}
          </button>
        }
      >
        {s.examOpen && (
          <>
            <Row
              label="Hemodynamic status"
              hint="HR, BP, mentation, perfusion"
              control={
                <Segmented
                  value={s.hemoStatus}
                  onChange={(v) => set("hemoStatus", v)}
                  options={[
                    {value:"stable", label:"Stable"},
                    {value:"borderline", label:"Borderline"},
                    {value:"unstable", label:"Unstable"},
                  ]}
                />
              }
              points={s.hemoStatus === "unstable" ? "→ consult OB" : "—"}
            />
            <Row
              label="Vaginal bleeding"
              hint="Pad count last hour"
              citeIds={["acog-200-2018"]}
              control={
                <Segmented
                  value={s.bleedSeverity}
                  onChange={(v) => set("bleedSeverity", v)}
                  options={[
                    {value:"none", label:"None / spotting"},
                    {value:"light", label:"Light (<1/hr)"},
                    {value:"moderate", label:"Moderate (1–2/hr)"},
                    {value:"heavy", label:"Heavy (≥2/hr)"},
                  ]}
                />
              }
              points={s.bleedSeverity === "heavy" ? "→ consult OB" : "—"}
            />
            <Row
              label="Signs of infection"
              hint="Fever, foul discharge, uterine tenderness"
              control={
                <Segmented
                  value={s.signsOfInfection}
                  onChange={(v) => set("signsOfInfection", v)}
                  options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]}
                />
              }
              points={s.signsOfInfection === "yes" ? "→ consult OB" : "—"}
            />
            <Row
              label="Products of conception at os"
              hint="On speculum exam"
              control={
                <Segmented
                  value={s.pocOs}
                  onChange={(v) => set("pocOs", v)}
                  options={[{value:"no",label:"No"},{value:"yes",label:"Yes"}]}
                />
              }
              points={s.pocOs === "yes" ? "tissue noted" : "—"}
            />
            {s.pocOs === "yes" && (
              <div className="alert alert--warn" style={{ margin: "0 0 0.75rem" }}>
                <div className="alert__body">
                  <div className="alert__title">Products of conception at the os — this is consistent with miscarriage / early pregnancy loss.</div>
                  <div className="alert__detail">All three management options (expectant, medical, surgical) may be appropriate. Discuss with patient.</div>
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* Section 3 — TVUS */}
      <Section
        num="03 / TRANSVAGINAL ULTRASOUND"
        title="Ultrasonographic Findings"
        sub="Most discriminating evidence for definitive nonviability."
        collapsible
      >
        <div style={{padding:"4px 16px 8px"}}>
          <textarea
            rows={3}
            placeholder="Input ultrasound findings"
            value={usReportText}
            onChange={e => setUsReportText(e.target.value)}
            style={{width:"100%", boxSizing:"border-box", padding:"8px 12px", borderRadius:"6px",
                    border:"1px solid var(--yk-ink-150)", fontSize:"13px", resize:"vertical",
                    marginBottom:"6px"}}
          />
          <div style={{marginBottom:"10px", display:"flex", alignItems:"center", gap:"10px"}}>
            <button
              className="hcg-toggle"
              disabled={usInterpreting}
              onClick={() => { console.log("interpret onClick fired, text:", usReportText); fetchUSInterpretation(usReportText); }}
            >
              {usInterpreting ? "Interpreting…" : "Interpret"}
            </button>
            {usInterpretError && (
              <span style={{fontSize:"12px", color:"#B91C1C"}}>{usInterpretError}</span>
            )}
          </div>
          {s.usInterpretation && (
            <div style={{marginBottom:"10px", padding:"12px 14px", borderRadius:"8px",
                         background:"var(--yk-info-bg)", border:"1px solid var(--yk-info-bd)"}}>
              <div style={{fontWeight:600, fontSize:"14px", color:"var(--yk-info-fg)", marginBottom:"6px"}}>
                AI Interpretation: {s.usInterpretation.classification.category.replace(/_/g," ")}
              </div>
              <ul style={{margin:0, paddingLeft:"18px", fontSize:"13px", color:"var(--yk-info-fg)"}}>
                {s.usInterpretation.classification.criteria.map((c,i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div className="seg" style={{display:"flex", flexDirection:"column", width:"100%", maxWidth:"420px", gap:"6px"}}>
          {[
            {value:"iup",             label:"Confirmed intrauterine pregnancy"},
            {value:"pul",             label:"Indeterminate / Pregnancy of Unknown Location"},
            {value:"ectopic",         label:"Ectopic pregnancy"},
            {value:"definitive-epl",  label:"Definitive early pregnancy loss"},
            {value:"no-us",           label:"No ultrasound performed"},
          ].map(opt => (
            <button
              key={opt.value}
              role="radio"
              aria-pressed={s.usImpression === opt.value}
              className="seg__opt"
              style={{
                display:"block", width:"100%", textAlign:"left",
                justifyContent:"flex-start", borderRadius:"6px", padding:"9px 14px",
                ...(opt.value === "definitive-epl" && s.usImpression === "definitive-epl"
                  ? {background:"#B91C1C", borderColor:"#991B1B", color:"white"}
                  : {}),
              }}
              onClick={() => set("usImpression", opt.value)}
            >
              {opt.label}
            </button>
          ))}
          </div>
        </div>
        {s.usImpression === "ectopic" && (
          <div className="alert" style={{marginBottom:"0.75rem"}}>
            <div className="alert__body">
              <div className="alert__title">
                <span className="alert__icon">!</span>
                Emergent OB consult indicated
              </div>
            </div>
          </div>
        )}
        {s.usImpression === "no-us" && (
          <div className="alert alert--warn" style={{marginBottom:"0.75rem"}}>
            <div className="alert__body">
              <div className="alert__title">No ultrasound performed — ectopic cannot be excluded</div>
              <div className="alert__detail">Transvaginal ultrasound is required to exclude ectopic pregnancy. Obtain TVUS before discharge unless immediately transferring to OB/Gyn care.</div>
            </div>
          </div>
        )}
        <div style={s.usImpression !== "pul" ? {display:"none"} : undefined}>
        <Row
          label="Cardiac activity"
          hint="M-mode preferred; document HR if present"
          citeIds={["doubilet-2013"]}
          control={
            <Segmented
              value={s.usCardiac}
              onChange={(v) => set("usCardiac", v)}
              options={[
                {value:"present", label:"Present"},
                {value:"absent", label:"Absent"},
              ]}
            />
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
                    if (v === 0) {
                      setState(prev => ({ ...prev, usCrl: null, usNoEmbryo: true }));
                    } else {
                      set("usCrl", v);
                    }
                  }}
                  unit="mm"
                  placeholder="—"
                  min={0}
                  step={1}
                />
              </div>
              <label style={{display:"flex", alignItems:"center", gap:"6px", marginTop:"6px", fontSize:"12.5px", color:"var(--yk-ink-600)", cursor:"pointer"}}>
                <input
                  type="checkbox"
                  checked={!!s.usNoEmbryo}
                  onChange={e => set("usNoEmbryo", e.target.checked)}
                />
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
            <Segmented
              value={s.usYolkSac}
              onChange={(v) => set("usYolkSac", v)}
              options={[
                {value:"present", label:"Present"},
                {value:"absent",  label:"Absent"},
              ]}
            />
          }
        />
        )}
        {(s.usCrl == null || s.usNoEmbryo) && (
          <Row
            label="Mean sac diameter (MSD)"
            hint="If gestational sac without embryo"
            citeIds={["doubilet-2013"]}
            control={
              <NumInput
                value={s.usMsd}
                onChange={(v) => set("usMsd", v)}
                unit="mm"
                placeholder="—"
                min={0}
                step={1}
              />
            }
          />
        )}
        {!yolkSacSeen && (s.usCrl == null || s.usNoEmbryo) && (
          <Row
            label="Time since sac seen — no yolk sac"
            hint="From earliest US showing sac without YS"
            citeIds={["doubilet-2013"]}
            control={
              <Segmented
                value={s.usSinceNoYS}
                onChange={(v) => set("usSinceNoYS", v)}
                options={[
                  {value:"none",   label:"N/A"},
                  {value:"lt11d",  label:"<11 days"},
                  {value:"ge11d",  label:"≥11 days"},
                ]}
              />
            }
          />
        )}
        {(s.usCrl == null || s.usNoEmbryo) && s.usYolkSac === "present" && (
        <Row
          label="Time since sac + yolk sac — no embryo"
          hint="From earliest US with YS but no embryo"
          citeIds={["doubilet-2013"]}
          control={
            <Segmented
              value={s.usSinceWithYS}
              onChange={(v) => set("usSinceWithYS", v)}
              options={[
                {value:"none", label:"N/A"},
                {value:"lt11d", label:"<11 days"},
                {value:"ge11d", label:"≥11 days"},
              ]}
            />
          }
        />
        )}
        <Row
          label="Free fluid in cul-de-sac"
          hint="Large fluid suggests ectopic rupture or hemorrhage"
          citeIds={["acog-tubal-2018"]}
          control={
            <Segmented
              value={s.freeFluid}
              onChange={(v) => set("freeFluid", v)}
              options={[
                {value:"none",label:"None"},
                {value:"trace",label:"Trace"},
                {value:"mod",label:"Moderate"},
                {value:"large",label:"Large"},
              ]}
            />
          }
          points={s.freeFluid === "large" ? "→ consult OB" : "—"}
        />
        </div>
      </Section>

      {/* Section 4 — hCG: collapsed by default; opt-in */}
      <Section
        num="04 / β-HCG (OPTIONAL)"
        title="β-hCG 48 hour Trend"
        sub="Skip when SRU criteria already met. Useful for indeterminate scans or PUL workup."
        headerRight={
          <button
            className="hcg-toggle"
            onClick={() => set("hcgOpen", !s.hcgOpen)}
            aria-expanded={s.hcgOpen}
          >
            {s.hcgOpen ? "− Hide hCG trend" : "+ Add hCG trend"}
          </button>
        }
      >
        {s.hcgOpen && (
          <>
            <Row
              label="Initial β-hCG"
              citeIds={["acog-200-2018"]}
              control={<NumInput value={s.hcg} onChange={(v)=>set("hcg",v)} unit="mIU/mL" placeholder="0" min={0} step={1}/>}
              points="—"
            />
            <Row
              label="48h repeat β-hCG"
              hint="Optional — for trend interpretation"
              control={<NumInput value={s.hcg48} onChange={(v)=>set("hcg48",v)} unit="mIU/mL" placeholder="0" min={0} step={1}/>}
              points="—"
            />
            <ResultBlock label="hCG interpretation" primary={hcgInterp} detail={hcgDetail} band={hcgBand} />
          </>
        )}
      </Section>

      {/* Section 5 — Rh status (collapsible) */}
      <Section
        num="05 / Rh STATUS"
        title="Rh(D) status"
        sub="Determines RhoGAM eligibility. Collect before discharge."
        headerRight={
          <button
            className="hcg-toggle"
            onClick={() => set("rhOpen", !s.rhOpen)}
            aria-expanded={s.rhOpen}
          >
            {s.rhOpen ? "− Hide Rh status" : "+ Add Rh status"}
          </button>
        }
      >
        {s.rhOpen && (
          <Row
            label="Rh(D) status"
            hint="Determines RhoGAM eligibility"
            citeIds={["smfm-rh-2024"]}
            control={
              <Segmented
                value={s.rhStatus}
                onChange={(v) => set("rhStatus", v)}
                options={[
                  {value:"positive", label:"Rh positive"},
                  {value:"negative", label:"Rh negative"},
                  {value:"unknown",  label:"Unknown"},
                ]}
              />
            }
            points={s.rhStatus === "negative" ? "+RhIG" : s.rhStatus === "unknown" ? "type & screen" : "—"}
          />
        )}
      </Section>

      {/* Section 6 — Diagnosis & Management */}
      <Section
        num="06 / DIAGNOSIS & MANAGEMENT"
        title="Evidence-based recommendations"
        sub="Tailored to inputs above. Citations link to the reference list."
        headerRight={<span className={`tag ${_color === "red" ? "tag--high" : "tag--info"}`}>{diagnosis}</span>}
        collapsible
      >
        {s.pocOs === "yes" && (
          <>
            <div className="alert alert--ok" style={{ margin: "0 16px 12px" }}>
              <div className="alert__body">
                <div className="alert__title">Complete early pregnancy loss confirmed</div>
                <div className="alert__detail">Products of conception visualized or reported — passage is complete. Management selection not required.</div>
              </div>
            </div>
            <AcogDefinition />
            <div style={{ padding: "0 16px 12px", fontSize: "12.5px", color: "var(--yk-ink-700)" }}>
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>Discharge &amp; follow-up</div>
              <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: "1.8" }}>
                <li>Confirm completeness: serial β-hCG to zero, with optional repeat TVUS if clinical concern</li>
                <li>OB/GYN follow-up within 1–2 weeks</li>
                <li>Return precautions: soaking more than 2 pads per hour for two hours, or fever above 101°F</li>
              </ul>
            </div>
          </>
        )}
        {s.pocOs !== "yes" && (
          <>
        {usNoIUP && (
          <Recommendation
            index="!"
            title="No intrauterine pregnancy — switch pathway"
            body={<>EPL cannot be diagnosed without an established IUP. Move to the <strong>PUL / Ectopic</strong> tab to risk-stratify and plan workup.</>}
            citeIds={["acog-tubal-2018"]}
            tags={[{kind:"info", label:"Wrong pathway"}]}
            onAsk={() => onAsk("This patient has no IUP visualized — what's the workup for PUL?")}
          />
        )}
        <Recommendation
          index="A"
          title="Confirm diagnosis"
          body={<>
            <div style={{marginBottom:"10px"}}>Use Society of Radiologists in Ultrasound (2013) / ACOG criteria for definitive failed IUP.</div>
            <div style={{fontWeight:600, fontSize:"12px", color:"var(--yk-ink-700)", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.04em"}}>Definitive criteria — any one is sufficient</div>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:"12.5px", marginBottom:"10px"}}>
              <tbody>
                {[
                  ["CRL ≥7 mm, no cardiac activity", <><a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a> / <a href="https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/11/early-pregnancy-loss" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>ACOG PB 200</a></>],
                  ["Mean sac diameter ≥25 mm, no embryo", <><a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a> / <a href="https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/11/early-pregnancy-loss" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>ACOG PB 200</a></>],
                  ["No yolk sac ≥11 days after scan showing GS without yolk sac", <><a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a> / <a href="https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/11/early-pregnancy-loss" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>ACOG PB 200</a></>],
                  ["No embryo ≥11 days after scan showing GS with yolk sac", <><a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a> / <a href="https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/11/early-pregnancy-loss" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>ACOG PB 200</a></>],
                ].map(([criterion, source], i) => (
                  <tr key={i} style={{borderTop:"1px solid var(--yk-border)"}}>
                    <td style={{padding:"5px 8px 5px 0", verticalAlign:"top", color:"var(--yk-ink-800)"}}>{criterion}</td>
                    <td style={{padding:"5px 0 5px 8px", verticalAlign:"top", color:"var(--yk-ink-400)", whiteSpace:"nowrap", fontSize:"11px"}}>{source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:"flex", alignItems:"baseline", gap:"8px", marginBottom:"4px", flexWrap:"wrap"}}>
              <div style={{fontWeight:600, fontSize:"12px", color:"var(--yk-ink-700)", textTransform:"uppercase", letterSpacing:"0.04em"}}>Suggestive criteria — require follow-up to confirm</div>
              <div style={{fontSize:"12px", color:"var(--yk-ink-500)", fontStyle:"italic"}}>When findings are suggestive but not definitive, repeat TVUS in <strong>7–14 days</strong> rather than acting prematurely.</div>
            </div>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:"12.5px"}}>
              <tbody>
                {[
                  ["MSD–CRL difference <5 mm", <a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a>],
                  ["No yolk sac 7–10 days after scan showing GS without yolk sac", <><a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a> / <a href="https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/11/early-pregnancy-loss" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>ACOG PB 200</a></>],
                  ["No embryo 7–10 days after scan showing GS with yolk sac", <><a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a> / <a href="https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/11/early-pregnancy-loss" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>ACOG PB 200</a></>],
                  ["Expanding GS with persistently abnormal shape", <a href="https://pubmed.ncbi.nlm.nih.gov/24106935/" target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Doubilet 2013</a>],
                ].map(([criterion, source], i) => (
                  <tr key={i} style={{borderTop:"1px solid var(--yk-border)"}}>
                    <td style={{padding:"5px 8px 5px 0", verticalAlign:"top", color:"var(--yk-ink-800)"}}>{criterion}</td>
                    <td style={{padding:"5px 0 5px 8px", verticalAlign:"top", color:"var(--yk-ink-400)", whiteSpace:"nowrap", fontSize:"11px"}}>{source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>}
          citeIds={["doubilet-2013"]}
          onAsk={() => onAsk("Walk me through the Society of Radiologists in Ultrasound (2013) criteria for diagnosing nonviable pregnancy in this patient.")}
        />
        {(triggeredDefinitive.length > 0 || triggeredProbable.length > 0 || indeterminateReason) && (
          <div style={{
            margin: "0 16px 12px",
            borderRadius: "8px",
            border: `1.5px solid ${triggeredDefinitive.length > 0 ? "#FCA5A5" : "#FCD34D"}`,
            background: triggeredDefinitive.length > 0 ? "#FEF2F2" : "#FFFBEB",
            padding: "12px 14px",
            fontSize: "12.5px",
          }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", color: triggeredDefinitive.length > 0 ? "#B91C1C" : "#92400E", fontSize: "13px" }}>
              {triggeredDefinitive.length > 0
                ? "Definitive Early Pregnancy Loss"
                : triggeredProbable.length > 0
                ? "Probable Early Pregnancy Loss"
                : "Indeterminate — Too Early to Confirm"}
            </div>
            {triggeredDefinitive.length > 0 && triggeredDefinitive.map((c, i) => (
              <div key={i} style={{ marginBottom: "6px", color: "#B91C1C" }}>
                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444", marginRight: "8px", verticalAlign: "middle" }} />
                <strong>{c.threshold}</strong>{" — "}<span style={{ color: "#7F1D1D" }}>{c.text}</span>
                <span style={{ display: "block", marginLeft: "14px", fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>Source: {c.cite}</span>
              </div>
            ))}
            {triggeredProbable.length > 0 && (
              <>
                {triggeredProbable.map((c, i) => (
                  <div key={i} style={{ marginBottom: "6px", color: "#92400E" }}>
                    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", marginRight: "8px", verticalAlign: "middle" }} />
                    <strong>{c.threshold}</strong>{" — "}<span style={{ color: "#78350F" }}>{c.text}</span>
                    <span style={{ display: "block", marginLeft: "14px", fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>Source: {c.cite}</span>
                  </div>
                ))}
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#92400E", fontStyle: "italic" }}>
                  High likelihood of nonviable pregnancy — serial scan recommended to confirm.
                </div>
              </>
            )}
            {indeterminateReason && (
              <div style={{ color: "#92400E" }}>
                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", marginRight: "8px", verticalAlign: "middle" }} />
                {indeterminateReason}
              </div>
            )}
          </div>
        )}
        {/* ===== FINAL INTERPRETATION BOX ===== */}
        {finalConclusion !== "pending" && usResult !== "Awaiting input" && (
          <div style={{
            margin: "0 16px 16px",
            borderRadius: "10px",
            background: conclusionBg,
            border: `1.5px solid ${conclusionBorder}`,
            padding: "14px 16px",
          }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: conclusionDark, marginBottom: "6px" }}>
              {usResult}
            </div>
            {usDetail && (
              <div style={{ fontSize: "12.5px", color: conclusionDark, lineHeight: 1.6, marginBottom: fibFields.length > 0 ? "10px" : 0 }}>
                {usDetail}
              </div>
            )}
            {fibFields.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "4px" }}>
                {fibFields.map((f, i) => (
                  <span key={i} style={{
                    fontSize: "11px",
                    background: conclusionChip,
                    color: conclusionMid,
                    borderRadius: "4px",
                    padding: "2px 7px",
                    fontFamily: "var(--yk-font-mono, monospace)",
                  }}>{f}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== B — TAILORED MANAGEMENT / RECOMMENDATIONS ===== */}

        {/* EPL management (definitive or complete EPL) */}
        {(isEplConclusion) && (
        <div style={{margin:"0 0 4px"}}>
          <div style={{padding:"10px 16px 2px", fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>
            B — Choose a management pathway
          </div>
          <div style={{fontSize:"12px", color:"var(--yk-ink-500)", padding:"0 16px 8px"}}>All three options are first-line — choose based on patient preference and clinical status.</div>
          <div style={{display:"flex", flexDirection:"column", gap:"8px", margin:"0 16px 12px"}}>

            {/* Expectant */}
            <div style={{border:"1px solid var(--yk-ink-200)", borderRadius:"8px", overflow:"hidden"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px"}}>
                <div>
                  <div style={{fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>Expectant Management</div>
                  <div style={{fontSize:"12px", color:"var(--yk-ink-600)", marginTop:"2px"}}>Allow natural expulsion; no medication or procedure required</div>
                </div>
                <button
                  className="hcg-toggle"
                  onClick={() => { set("expectantOpen", !s.expectantOpen); if (!s.expectantOpen) fetchMgmtGuidance("expectant"); }}
                  aria-expanded={s.expectantOpen}
                >
                  {s.expectantOpen ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{display: s.expectantOpen ? "block" : "none", padding:"0 12px 12px 32px", fontSize:"12.5px", color:"var(--yk-ink-700)", borderTop:"1px solid var(--yk-sage-100)"}}>
                <p style={{margin:"8px 0 4px"}}><strong>Indications:</strong> Hemodynamically stable, first trimester, patient prefers to avoid intervention</p>
                <p style={{margin:"4px 0"}}><strong>Contraindications:</strong> Instability, active infection, heavy bleeding, patient unwilling to wait</p>
                <p style={{margin:"4px 0"}}><strong>Details:</strong> Success ~50–80% within 2 weeks; allow up to 4 weeks. Confirm completion with repeat TVUS or urine hCG at 2–4 weeks.</p>
                <p style={{margin:"4px 0"}}><strong>Counseling:</strong> Heavy bleeding and cramping expected over days–weeks. Return if soaking more than 2 pads per hour for two hours, fever, or severe pain.</p>
                {mgmtGuidance.expectant?.length > 0 && <MgmtGuidancePanel chunks={mgmtGuidance.expectant} />}
              </div>
            </div>

            {/* Medical */}
            <div style={{border:"1px solid var(--yk-ink-200)", borderRadius:"8px", overflow:"hidden"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px"}}>
                <div>
                  <div style={{fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>Medical Management</div>
                  <div style={{fontSize:"12px", color:"var(--yk-ink-600)", marginTop:"2px"}}>Mifepristone 200mg PO → Misoprostol 800mcg vaginally/buccal 24–48h later (~84% complete by day 8)</div>
                </div>
                <button
                  className="hcg-toggle"
                  onClick={() => { set("medOpen", !s.medOpen); if (!s.medOpen) fetchMgmtGuidance("medical"); }}
                  aria-expanded={s.medOpen}
                >
                  {s.medOpen ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{display: s.medOpen ? "block" : "none", padding:"0 12px 12px 32px", fontSize:"12.5px", color:"var(--yk-ink-700)", borderTop:"1px solid var(--yk-sage-100)"}}>
                <p style={{margin:"8px 0 4px"}}><strong>Indications:</strong> Stable, ≤12 weeks, patient prefers non-surgical, no prostaglandin allergy</p>
                <p style={{margin:"4px 0"}}><strong>Contraindications:</strong> Prostaglandin allergy, IUD in situ (remove first), coagulopathy, active infection</p>
                <p style={{margin:"8px 0 2px"}}><strong>Step 1:</strong> Mifepristone 200mg PO</p>
                <p style={{margin:"2px 0 4px"}}><strong>Step 2:</strong> Misoprostol 800mcg vaginally or buccally, 24–48 hours after mifepristone</p>
                <p style={{margin:"4px 0"}}><strong>Counseling:</strong> Heavy bleeding and cramping 1–4h after second pill. Pre-treat with ibuprofen 600mg. Passage of tissue confirms effect.</p>
                {mgmtGuidance.medical?.length > 0 && <MgmtGuidancePanel chunks={mgmtGuidance.medical} />}
              </div>
            </div>

            {/* Surgical */}
            <div style={{border:"1px solid var(--yk-ink-200)", borderRadius:"8px", overflow:"hidden"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px"}}>
                <div>
                  <div style={{fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>Surgical Management (MVA / D&amp;C)</div>
                  <div style={{fontSize:"12px", color:"var(--yk-ink-600)", marginTop:"2px"}}>Uterine aspiration — highest single-visit completion rate (&gt;95%)</div>
                </div>
                <button
                  className="hcg-toggle"
                  onClick={() => { set("surgOpen", !s.surgOpen); if (!s.surgOpen) fetchMgmtGuidance("surgical"); }}
                  aria-expanded={s.surgOpen}
                >
                  {s.surgOpen ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{display: s.surgOpen ? "block" : "none", padding:"0 12px 12px 32px", fontSize:"12.5px", color:"var(--yk-ink-700)", borderTop:"1px solid var(--yk-sage-100)"}}>
                <p style={{margin:"8px 0 4px"}}><strong>Indications:</strong> Patient preference, failed expectant/medical Mx, heavy bleeding, instability, infection, tissue at os</p>
                <p style={{margin:"4px 0"}}><strong>Contraindications:</strong> Coagulopathy (relative); recent uterine surgery (discuss with OB/Gyn)</p>
                <p style={{margin:"4px 0"}}><strong>Details:</strong> MVA preferred in first trimester; D&amp;C is the alternative. Usually outpatient, local or general anesthesia. Completion &gt;95%.</p>
                <p style={{margin:"4px 0"}}><strong>Counseling:</strong> Same-day discharge. Light cramping and bleeding 1–2 weeks. Follow-up in 1–2 weeks to confirm completion.</p>
                {mgmtGuidance.surgical?.length > 0 && <MgmtGuidancePanel chunks={mgmtGuidance.surgical} />}
              </div>
            </div>
          </div>

          {/* Management Selected */}
          <div style={{margin:"0 16px 12px", paddingTop:"8px", borderTop:"1px solid var(--yk-sage-100)"}}>
            <div style={{fontSize:"12.5px", fontWeight:600, color:"var(--yk-ink-700)", marginBottom:"6px"}}>Management selected</div>
            <Segmented
              value={s.mxChoice}
              onChange={(v) => set("mxChoice", v)}
              options={[
                {value:"expectant", label:"Expectant"},
                {value:"medical",   label:"Medical"},
                {value:"surgical",  label:"Surgical"},
              ]}
            />
            {s.mxChoice === "expectant" && (
              <ResultBlock
                label="Next steps — Expectant"
                primary="Allow up to 4 weeks for natural expulsion"
                detail="Confirm TVUS or urine hCG follow-up at 2–4 weeks. Provide written return precautions. Verify reliable phone access."
                band={<RiskBand level="info">Expectant</RiskBand>}
              />
            )}
            {s.mxChoice === "medical" && (
              <ResultBlock
                label="Next steps — Medical"
                primary={
                  <>
                    <span style={{display:"block"}}><strong>Step 1:</strong> Mifepristone 200mg PO</span>
                    <span style={{display:"block", marginTop:"2px"}}><strong>Step 2:</strong> Misoprostol 800mcg vaginally or buccally, 24–48 hours after mifepristone</span>
                  </>
                }
                detail="Pre-treat with ibuprofen 600mg before misoprostol. Follow-up call at 48h. TVUS or hCG to confirm completion at 2–4 weeks."
                band={<RiskBand level="info">Medical</RiskBand>}
              />
            )}
            {s.mxChoice === "medical" && !s.remsConfirmed && (
              <div style={{
                margin: "10px 0 0",
                padding: "10px 14px",
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                borderRadius: "8px",
                fontSize: "12.5px",
                color: "#78350F",
              }}>
                <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                  Mifepristone requires REMS certification before prescribing. Are you certified?
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => set("remsConfirmed", true)}
                    style={{
                      padding: "5px 12px", borderRadius: "6px",
                      background: "#92400E", color: "#fff",
                      border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    }}
                  >
                    Yes, I am certified
                  </button>
                  <button
                    onClick={() => onSwitchTab("rems")}
                    style={{
                      padding: "5px 12px", borderRadius: "6px",
                      background: "transparent", color: "#78350F",
                      border: "1px solid #FCD34D", cursor: "pointer", fontSize: "12px",
                    }}
                  >
                    Take me to the REMS guide
                  </button>
                </div>
              </div>
            )}
            {s.mxChoice === "surgical" && (
              <ResultBlock
                label="Next steps — Surgical"
                primary="Schedule MVA/D&C — outpatient, same-day procedure"
                detail="Provide NPO instructions if applicable. Confirm procedure availability. Follow-up in 1–2 weeks to confirm completion."
                band={<RiskBand level="info">Surgical</RiskBand>}
              />
            )}
          </div>
          <CollapsibleRefs ids={["acog-200-2018","schreiber-pregloss-2018","rcog-gtg17"]} />
        </div>
        )}

        {/* Ectopic / PUL high-risk recommendations */}
        {isEctopicConclusion && (
        <div style={{margin:"0 0 4px"}}>
          <div style={{padding:"10px 16px 2px", fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>
            B — Ectopic / PUL Workup &amp; Consultation
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:"8px", margin:"0 16px 12px"}}>
            <Recommendation
              index="1"
              title={s.hemoStatus === "unstable" ? "Emergent OB/Gyn consultation — activate now" : "OB/Gyn consultation required — do not discharge without GYN evaluation"}
              body={s.hemoStatus === "unstable"
                ? "Patient is hemodynamically unstable — emergent surgical consultation required immediately. Two large-bore IVs, type & crossmatch, activate OB on-call now."
                : "GYN consultation required before any disposition decision. Do not discharge without OB/Gyn evaluation and documented plan."}
              citeIds={["acog-tubal-2018"]}
              tags={[{kind:"warn", label:"Required"}]}
              onAsk={() => onAsk("What are the indications for emergent vs. non-emergent GYN consult for suspected ectopic pregnancy?")}
            />
            <Recommendation
              index="2"
              title="Quantitative β-hCG if not yet obtained"
              body="Obtain serum β-hCG urgently. Discriminatory zone: ≥3,500 mIU/mL — if no IUP identified at this level, ectopic is the working diagnosis. If ≥10,000 mIU/mL, emergent GYN consult is mandated per ACCESS-Bridge protocol. Serial hCG in 48–72h if non-emergent workup."
              citeIds={["acog-tubal-2018"]}
              onAsk={() => onAsk("How should I interpret β-hCG in a patient with suspected ectopic pregnancy?")}
            />
            <Recommendation
              index="3"
              title="IV access · type &amp; screen · hemodynamic monitoring"
              body="Establish IV access and send type & screen. Monitor vitals continuously. If free fluid or instability: two large-bore IVs, type & crossmatch, surgical team notification."
              onAsk={() => onAsk("What initial stabilization steps are needed for suspected ectopic in the ED?")}
            />
            {hcg != null && hcg < 5000 && finalConclusion !== "pul-highrisk" && (
              <Recommendation
                index="4"
                title="Methotrexate candidacy — GYN decision"
                body={`β-hCG ${hcg.toLocaleString()} mIU/mL is below 5,000 mIU/mL. Patient may be a methotrexate candidate (50 mg/m² IM) if: mass <3.5 cm, no cardiac activity, no contraindications. This decision requires GYN consultation — do not initiate without specialist input. (ACCESS-Bridge protocol.)`}
                citeIds={["acog-tubal-2018"]}
                onAsk={() => onAsk("What are the criteria for methotrexate treatment of ectopic pregnancy?")}
              />
            )}
          </div>
          <CollapsibleRefs ids={["acog-tubal-2018"]} />
        </div>
        )}

        {/* Viable IUP / location confirmed — follow-up recommendations */}
        {isViableConclusion && (
        <div style={{margin:"0 0 4px"}}>
          <div style={{padding:"10px 16px 2px", fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>
            B — Viable Pregnancy — Next Steps
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:"8px", margin:"0 16px 12px"}}>
            <Recommendation
              index="1"
              title={finalConclusion === "iup-confirmed" ? "OB/Gyn follow-up — repeat TVUS in 7–10 days" : "OB/Gyn follow-up — routine"}
              body={finalConclusion === "iup-confirmed"
                ? "Intrauterine location confirmed by gestational sac ± yolk sac; viability is not yet assessable. OB/Gyn follow-up with repeat TVUS in 7–10 days to assess embryo development and cardiac activity."
                : "Viable IUP confirmed with cardiac activity. Reassure patient — bleeding in early pregnancy is common and often not dangerous. Manage symptomatically; OB/Gyn follow-up at appropriate interval."}
              citeIds={["acog-200-2018"]}
              onAsk={() => onAsk("What follow-up is appropriate for a viable IUP with first-trimester bleeding?")}
            />
            <Recommendation
              index="2"
              title="Return precautions"
              body="Return to ED immediately if: soaking more than 2 pads per hour for two hours; fever above 101°F (38.3°C); severe one-sided abdominal pain; dizziness or fainting. Light spotting and mild cramping are expected and are not emergencies."
              onAsk={() => onAsk("What return precautions should I give a patient with a viable IUP and first-trimester spotting?")}
            />
          </div>
          <CollapsibleRefs ids={["acog-200-2018"]} />
        </div>
        )}

        {/* Probable EPL / indeterminate / PUL serial — serial monitoring */}
        {isProbableOrSerial && !isEplConclusion && !isViableConclusion && !isEctopicConclusion && (
        <div style={{margin:"0 0 4px"}}>
          <div style={{padding:"10px 16px 2px", fontWeight:600, fontSize:"13px", color:"var(--yk-ink-800)"}}>
            B — Serial Monitoring Plan
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:"8px", margin:"0 16px 12px"}}>
            <Recommendation
              index="1"
              title="Repeat TVUS in 7–14 days — do not initiate management before confirmation"
              body="Findings are not yet diagnostic for EPL per Society of Radiologists in Ultrasound (2013) criteria. Repeat TVUS is required before any management decision. Do not initiate expectant, medical, or surgical management without confirming nonviability."
              citeIds={["doubilet-2013"]}
              onAsk={() => onAsk("How should I counsel a patient about waiting for repeat ultrasound to confirm pregnancy failure?")}
            />
            <Recommendation
              index="2"
              title="Serial β-hCG in 48–72h"
              body={hcg != null
                ? `Baseline β-hCG ${hcg.toLocaleString()} mIU/mL. Repeat in 48–72h. Normal rise: ≥${hcg < 1500 ? 49 : hcg < 3000 ? 40 : 33}% (for this baseline) suggests viable IUP. Fall ≥21% suggests EPL. Abnormal trend (neither rising adequately nor falling) requires ectopic exclusion.`
                : "Obtain baseline β-hCG now. Serial trend in 48–72h differentiates viable IUP (normal rise), EPL (≥21% fall), and ectopic (abnormal pattern). Correlate with repeat TVUS."}
              citeIds={["acog-200-2018"]}
              onAsk={() => onAsk("How do I interpret serial β-hCG trends in a patient with indeterminate ultrasound findings?")}
            />
            <Recommendation
              index="3"
              title="Ectopic precautions — document and counsel"
              body="7% of PULs are ultimately ectopic. Patient must be counseled on ectopic precautions and instructed to return immediately if: soaking more than 2 pads per hour, severe one-sided pain, shoulder tip pain, dizziness, or fainting. Document ectopic precautions given in the chart."
              citeIds={["acog-tubal-2018"]}
              onAsk={() => onAsk("What ectopic precautions should I document for a patient with indeterminate ultrasound findings?")}
            />
          </div>
          <CollapsibleRefs ids={["doubilet-2013","acog-200-2018","acog-tubal-2018"]} />
        </div>
        )}
        {s.rhStatus === "negative" && (
          <Recommendation
            index="C"
            title="RhoGAM — Rh(D)-negative patient"
            body="Rh(D) immune globulin is indicated for Rh-negative patients with early pregnancy loss or bleeding. Administer within 72h. Dose per institutional formulary (typically 300mcg IM for ≥12 weeks, 50mcg or 300mcg for <12 weeks per local availability). Consult your institution's protocol."
            citeIds={["smfm-rh-2024"]}
            onAsk={() => onAsk("What are the SMFM recommendations for Rh(D) immune globulin in early pregnancy loss?")}
          />
        )}
          </>
        )}
      </Section>

      {/* Section 7 — Disposition: only relevant for confirmed EPL with a management plan */}
      {isEplConclusion && <Section
        num="07 / DISPOSITION"
        title="Discharge planning & follow-up"
        sub="Complete after management pathway is selected above."
        collapsible
      >
        {/* — Subsection 1: Discharge Instructions — */}
        {(() => {
          const isMedical = s.mxChoice === "medical";

          // Medical-specific strings
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

          // Non-medical strings
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

          const plainText = isMedical
            ? [
                medIntro,
                "",
                medOverview,
                "",
                "Step 1: " + medStep1,
                "Step 2: " + medStep2,
                "",
                "Second dose of misoprostol: " + medSecondIntro,
                ...medSecondConditions.map(c => `• ${c}`),
                medSecondOutro,
                "",
                medReturnIntro,
                ...medReturnItems.map(item => `• ${item}`),
              ].join("\n")
            : [
                mgmtText,
                "",
                "Return to the ED if you experience any of the following:",
                ...returnPrecautions.map(p => `• ${p}`),
              ].join("\n");

          console.log("[EPLPathway] discharge plainText:\n" + plainText);

          return (
            <div style={{borderTop:"1px solid var(--yk-sage-100)", paddingTop:"8px", margin:"0 16px 12px"}}>
              <div style={{fontSize:"12.5px", fontWeight:600, color:"var(--yk-ink-700)", marginBottom:"6px"}}>Discharge Instructions</div>
              {isMedical ? (
                <div style={{fontSize:"12px", color:"var(--yk-ink-700)", display:"flex", flexDirection:"column", gap:"6px", marginBottom:"8px"}}>
                  <div>{medIntro}</div>
                  <div>{medOverview}</div>
                  <div><strong>Step 1:</strong> {medStep1}</div>
                  <div><strong>Step 2:</strong> {medStep2}</div>
                  <div>
                    <strong>Second dose of misoprostol:</strong> {medSecondIntro}
                    <ul style={{margin:"4px 0 2px 16px", padding:0}}>
                      {medSecondConditions.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                    {medSecondOutro}
                  </div>
                  <div>
                    {medReturnIntro}
                    <ul style={{margin:"4px 0 2px 16px", padding:0}}>
                      {medReturnItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{fontSize:"12px", color:"var(--yk-ink-700)", marginBottom:"8px"}}>{mgmtText}</div>
                  <div style={{fontSize:"12px", color:"var(--yk-ink-700)", marginBottom:"4px"}}><strong>Return to the ED if you experience any of the following:</strong></div>
                  <ul style={{fontSize:"12px", color:"var(--yk-ink-700)", margin:"0 0 8px 16px", padding:0}}>
                    {returnPrecautions.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(plainText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  fontSize:"11px",
                  border:"1px solid var(--yk-sage-300, #ccc)",
                  borderRadius:"4px",
                  padding:"3px 8px",
                  cursor:"pointer",
                  color:"var(--yk-ink-500)",
                  background:"transparent",
                }}
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
          );
        })()}

        {/* — Subsection 2: Follow-Up Information — */}
        {(() => {
          const timingPhrase = s.mxChoice === "medical"   ? "after misoprostol"
                             : s.mxChoice === "expectant" ? "after passage of tissue"
                             : s.mxChoice === "surgical"  ? "after procedure"
                             : "after treatment";
          return (
            <div style={{borderTop:"1px solid var(--yk-sage-100)", paddingTop:"8px", margin:"0 16px 12px"}}>
              <div style={{fontSize:"12.5px", fontWeight:600, color:"var(--yk-ink-700)", marginBottom:"6px"}}>Follow-Up Information</div>
              <div style={{fontSize:"12px", color:"var(--yk-ink-700)", display:"flex", flexDirection:"column", gap:"4px"}}>
                <div><strong>OB/GYN follow-up:</strong> within 1–2 weeks</div>
                <div><strong>Serum β-hCG:</strong> 1–2 weeks {timingPhrase}; expect ≥50% decline from baseline</div>
                <div><strong>Repeat ultrasound:</strong> 1–2 weeks if symptoms persist, hCG not declining, or baseline showed retained products — not routinely needed if asymptomatic and hCG declining</div>
                <div><strong>Repeat urine pregnancy test:</strong> 4 weeks {timingPhrase}</div>
              </div>
            </div>
          );
        })()}
      </Section>}
    </>
  );
}
