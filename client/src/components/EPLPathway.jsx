// EPL pathway — left side CDS tool.
// Ported from design_handoff_yukti/design_files/components/EPLPathway.jsx
// Adapted from window globals to ES module. Clinical logic preserved verbatim.

import React from 'react';
import { Section, Row, Segmented, NumInput, Recommendation, RiskBand, ResultBlock, Cite } from './primitives';

export default function EPLPathway({ state, setState, onAsk }) {
  const s = state;
  const set = (k, v) => setState(prev => ({ ...prev, [k]: v }));

  /* ---- GA: weeks + days ---- */
  const gaW = s.gaWeeks;
  const gaD = s.gaDays;
  const gaTotalWeeks = (gaW != null ? gaW : 0) + (gaD != null ? gaD/7 : 0);
  const gaDisplay = (gaW != null || gaD != null)
    ? `${gaW ?? 0}w ${gaD ?? 0}d`
    : "—";
  const gaBand = gaTotalWeeks === 0 ? "—"
    : gaTotalWeeks < 6 ? "<6w"
    : gaTotalWeeks < 10 ? "6–10w"
    : gaTotalWeeks < 14 ? "10–14w" : "≥14w";

  /* ---- Red-flag findings: trigger emergent OB consult ---- */
  const redFlags = [];
  if (s.hemoStatus === "unstable") redFlags.push("Hemodynamic instability");
  if (s.bleedSeverity === "heavy") redFlags.push("Heavy bleeding (≥2 pads/hr)");
  if (s.freeFluid === "large") redFlags.push("Large free fluid in cul-de-sac");
  if (s.signsOfInfection === "yes") redFlags.push("Signs of infection (septic abortion)");
  const showAlert = redFlags.length > 0;

  /* ---- Section 3: TVUS findings (SRU 2013 criteria) ----
     Split into orthogonal questions; system computes which criterion is met. */
  const cardiac     = s.usCardiac;       // present | absent | na
  const crlBand     = s.usCrlBand;        // none | lt7 | ge7
  const msdBand     = s.usMsdBand;        // none | lt25 | ge25
  const sinceNoYS   = s.usSinceNoYS;      // none | lt2w | ge2w
  const sinceWithYS = s.usSinceWithYS;    // none | lt11d | ge11d
  const iupSeen     = s.usIUPSeen;        // yes | no | na

  const usViable     = iupSeen === "yes" && cardiac === "present";
  const usNoIUP      = iupSeen === "no";
  const usDefinitive = !usNoIUP && !usViable && (
    crlBand === "ge7"
    || msdBand === "ge25"
    || sinceNoYS === "ge2w"
    || sinceWithYS === "ge11d"
  );
  const usSuggestive = !usDefinitive && !usViable && !usNoIUP && (
    crlBand === "lt7"
    || msdBand === "lt25"
    || sinceNoYS === "lt2w"
    || sinceWithYS === "lt11d"
  );

  let usResult = "Awaiting input";
  let usBand = null;
  let usDetail = null;
  if (usDefinitive) {
    usResult = "Definitive failed intrauterine pregnancy";
    usBand = <RiskBand level="high">Diagnostic</RiskBand>;
    usDetail = "Meets SRU 2013 criteria for nonviability — proceed to management.";
  } else if (usSuggestive) {
    usResult = "Suggestive of failed pregnancy";
    usBand = <RiskBand level="mod">Repeat in 7–14 days</RiskBand>;
    usDetail = "Findings suspicious but not definitive. Confirm with follow-up imaging.";
  } else if (usNoIUP) {
    usResult = "No intrauterine pregnancy visualized";
    usBand = <RiskBand level="mod">Evaluate for ectopic</RiskBand>;
    usDetail = "EPL cannot be diagnosed without first establishing IUP. Switch to PUL/Ectopic pathway.";
  } else if (usViable) {
    usResult = "Viable IUP";
    usBand = <RiskBand level="low">Reassuring</RiskBand>;
    usDetail = "Cardiac activity present — manage symptomatically, OB follow-up.";
  }

  /* ---- hCG trend ---- */
  const hcg = s.hcg;
  const hcg48 = s.hcg48;
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
    } else if (change >= 49) {
      hcgBand = <RiskBand level="info">Rising appropriately</RiskBand>;
      hcgDetail = "≥49% rise suggests viable IUP — re-evaluate diagnosis.";
    } else {
      hcgBand = <RiskBand level="mod">Abnormal trend</RiskBand>;
      hcgDetail = "Suboptimal change. Ectopic must be ruled out — see PUL/Ectopic pathway.";
    }
  } else if (hcg != null) {
    hcgInterp = `${hcg.toLocaleString()} mIU/mL — single value`;
    hcgBand = <RiskBand level="info">Reference only</RiskBand>;
    hcgDetail = "Single hCG rarely diagnostic. Trend over 48h if diagnosis uncertain.";
  }

  /* ---- Diagnosis synthesis ---- */
  let diagnosis = "Pending data";
  if (usDefinitive) diagnosis = "Early Pregnancy Loss — confirmed";
  else if (usSuggestive) diagnosis = "Suspected EPL";
  else if (usViable) diagnosis = "Viable IUP — threatened miscarriage if bleeding";
  else if (usNoIUP) diagnosis = "No IUP — see PUL/Ectopic pathway";

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
        title="Gestational age & Rh status"
        sub="Anchors all downstream recommendations. Use best available dating."
      >
        <Row
          label="Gestational age"
          hint="By LMP or earliest US"
          citeIds={["acog-200-2018"]}
          control={
            <div className="ga-input">
              <NumInput
                value={s.gaWeeks}
                onChange={(v) => set("gaWeeks", v)}
                unit="weeks"
                placeholder="0"
                min={0} max={23} step={1}
              />
              <NumInput
                value={s.gaDays}
                onChange={(v) => set("gaDays", v)}
                unit="days"
                placeholder="0"
                min={0} max={6} step={1}
              />
            </div>
          }
          points={gaBand}
        />
        <Row
          label="Rh(D) status"
          hint="Determines RhoGAM eligibility"
          citeIds={["smfm-rh-2024","yukti-local-rh"]}
          localTag={s.rhStatus === "negative"}
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
      </Section>

      {/* Section 2 — Clinical findings (no scoring) */}
      <Section
        num="02 / CLINICAL FINDINGS"
        title="Bleeding, pain & exam"
        sub="Document findings. Findings flagged → consult OB trigger the alert above."
      >
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
          points={s.pocOs === "yes" ? "incomplete" : "—"}
        />
      </Section>

      {/* Section 3 — TVUS */}
      <Section
        num="03 / TRANSVAGINAL ULTRASOUND"
        title="Findings"
        sub="Most discriminating evidence for definitive nonviability."
      >
        <Row
          label="Intrauterine pregnancy seen"
          hint="Gestational sac in uterine cavity"
          citeIds={["acog-tubal-2018"]}
          control={
            <Segmented
              value={s.usIUPSeen}
              onChange={(v) => set("usIUPSeen", v)}
              options={[
                {value:"na", label:"Not assessed"},
                {value:"yes", label:"Yes"},
                {value:"no", label:"No"},
              ]}
            />
          }
          points={s.usIUPSeen === "no" ? "→ consult OB" : "—"}
        />
        <Row
          label="Cardiac activity"
          hint="M-mode preferred; document HR if present"
          citeIds={["doubilet-2013"]}
          control={
            <Segmented
              value={s.usCardiac}
              onChange={(v) => set("usCardiac", v)}
              options={[
                {value:"na", label:"Not assessed"},
                {value:"present", label:"Present"},
                {value:"absent", label:"Absent"},
              ]}
            />
          }
          points="—"
        />
        <Row
          label="Crown–rump length (CRL)"
          hint="If embryo measurable, with cardiac activity absent"
          citeIds={["doubilet-2013"]}
          control={
            <Segmented
              value={s.usCrlBand}
              onChange={(v) => set("usCrlBand", v)}
              options={[
                {value:"none", label:"Not measured"},
                {value:"lt7", label:"<7 mm"},
                {value:"ge7", label:"≥7 mm"},
              ]}
            />
          }
          points={s.usCrlBand === "ge7" ? "diagnostic" : s.usCrlBand === "lt7" ? "suggestive" : "—"}
        />
        <Row
          label="Mean sac diameter (MSD)"
          hint="If gestational sac without embryo"
          citeIds={["doubilet-2013"]}
          control={
            <Segmented
              value={s.usMsdBand}
              onChange={(v) => set("usMsdBand", v)}
              options={[
                {value:"none", label:"Not measured"},
                {value:"lt25", label:"<25 mm, no embryo"},
                {value:"ge25", label:"≥25 mm, no embryo"},
              ]}
            />
          }
          points={s.usMsdBand === "ge25" ? "diagnostic" : s.usMsdBand === "lt25" ? "suggestive" : "—"}
        />
        <Row
          label="Time since sac seen — no yolk sac"
          hint="From earliest US showing sac without YS"
          citeIds={["doubilet-2013"]}
          control={
            <Segmented
              value={s.usSinceNoYS}
              onChange={(v) => set("usSinceNoYS", v)}
              options={[
                {value:"none", label:"N/A"},
                {value:"lt2w", label:"<2 weeks"},
                {value:"ge2w", label:"≥2 weeks"},
              ]}
            />
          }
          points={s.usSinceNoYS === "ge2w" ? "diagnostic" : s.usSinceNoYS === "lt2w" ? "suggestive" : "—"}
        />
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
          points={s.usSinceWithYS === "ge11d" ? "diagnostic" : s.usSinceWithYS === "lt11d" ? "suggestive" : "—"}
        />
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
        <ResultBlock label="Interpretation" primary={usResult} detail={usDetail} band={usBand} />
      </Section>

      {/* Section 4 — hCG: collapsed by default; opt-in */}
      <Section
        num="04 / β-HCG (OPTIONAL)"
        title="48h trend — when imaging is non-diagnostic"
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

      {/* Section 5 — Diagnosis & Management */}
      <Section
        num="05 / DIAGNOSIS & MANAGEMENT"
        title="Evidence-based recommendations"
        sub="Tailored to inputs above. Citations link to the reference list."
        headerRight={<span className="tag tag--info">{diagnosis}</span>}
      >
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
          body={<>Use SRU 2013 criteria for definitive failed IUP. When findings are suggestive but not definitive, repeat TVUS in <strong>7–14 days</strong> rather than acting prematurely.</>}
          citeIds={["doubilet-2013"]}
          quote="Mean sac diameter ≥25mm with no embryo, or CRL ≥7mm with no cardiac activity, is diagnostic of pregnancy failure."
          onAsk={() => onAsk("Walk me through the SRU 2013 criteria for diagnosing nonviable pregnancy in this patient.")}
        />
        <Recommendation
          index="B"
          title="Choose a management pathway"
          body={
            <>
              <strong>Expectant</strong> — first trimester, hemodynamically stable, patient prefers to await spontaneous passage. Allow up to 4 weeks.<br/>
              <strong>Medical</strong> — Mifepristone 200mg PO → 24–48h later <strong>Misoprostol 800mcg PV</strong>. Repeat dose if no expulsion in 7–14 days. Mifepristone pretreatment improves completion (84% vs 67%).<br/>
              <strong>Surgical</strong> — uterine aspiration (MVA / D&C). Indicated for instability, infection, heavy bleeding, or patient preference.
            </>
          }
          citeIds={["acog-200-2018","schreiber-pregloss-2018","rcog-gtg17"]}
          tags={[{kind:"info", label:"All three are first-line"}]}
          onAsk={() => onAsk("Compare expectant, medical, and surgical management for this patient. Include success rates and contraindications.")}
        />
        {s.rhStatus === "negative" && (
          <Recommendation
            index="C"
            title="RhoGAM — Rh(D)-negative patient"
            body={<><strong>NYP Queens</strong> stocks <strong>300mcg IM</strong> (mini-dose 50mcg discontinued 2024). Administer within 72h of bleeding for any EPL ≥7 weeks GA. Consider for any first-trimester bleeding per local protocol.</>}
            citeIds={["smfm-rh-2024","yukti-local-rh"]}
            tags={[{kind:"local", label:"Locally adapted dose"}]}
            onAsk={() => onAsk("What is NYP Queens' RhoGAM protocol for this patient?")}
          />
        )}
      </Section>

      {/* Section 6 — Disposition */}
      <Section
        num="06 / DISPOSITION"
        title="Discharge planning & follow-up"
        sub="Per NYP Queens pathway."
      >
        <div className="branch">
          <div className="branch__row">
            <span className="branch__cond">Confirmed EPL</span>
            <span className="branch__action">
              Discharge with chosen pathway. Misoprostol prescription + RhoGAM if indicated. OB/Gyn follow-up <strong>within 7 days</strong>; written return precautions. <Cite ids={["yukti-local-referral"]} />
            </span>
          </div>
          <div className="branch__row">
            <span className="branch__cond">Suspected EPL</span>
            <span className="branch__action">
              Repeat TVUS in 7–14 days at OB/Gyn clinic. Strict return precautions. Confirm reliable phone access.
            </span>
          </div>
          <div className="branch__row">
            <span className="branch__cond">Viable IUP</span>
            <span className="branch__action">
              Reassure, treat symptomatically. Routine OB follow-up within 1 week. No bedrest or progesterone — neither improves outcomes.
            </span>
          </div>
          <div className="branch__row">
            <span className="branch__cond">Return precautions</span>
            <span className="branch__action">
              Heavy bleeding (&gt;2 pads/hr × 2h), fever &gt;38°C, severe pain, syncope, signs of infection.
            </span>
          </div>
        </div>
      </Section>
    </>
  );
}
