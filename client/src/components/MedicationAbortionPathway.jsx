// MedicationAbortionPathway.jsx
// Changes from review:
//  1. Title = "Medication Abortion", subtitle removed
//  2. Style consistent with EPL/Contraception tabs (Section/Segmented/RiskBand primitives throughout)
//  3. Extra top-margin (mt-reveal) on conditional boxes under radio buttons
//  4. Ultrasound Findings moved before Management (discharge instructions)
//  5. Patient Agreement Form section added (FDA generic form link)
//  6. REMS certification links fixed:
//       Mifeprex → https://www.earlyoptionpill.com/for-health-professionals/prescribing-mifeprex/
//       GenBioPro → https://genbiopro.com/rems

import React, { useState } from "react";
import StatePharmacyFinder from "./StatePharmacyFinder";
import {
  Section,
  Segmented,
  RiskBand,
  ResultBlock,
  NumInput,
  Row,
} from "./primitives";

// ─── inline style helpers (matches EPL / Contraception pattern) ──────────────
const revealBox = {
  marginTop: "12px",
  marginBottom: "16px",
  marginLeft: "2px",
  display: "block",
  maxWidth: "540px",
};

const linkStyle = {
  color: "var(--yk-sage-600)",
  textDecoration: "underline",
  fontSize: "0.85rem",
};

const smallLabel = {
  fontSize: "0.8rem",
  color: "var(--yk-ink-500)",
  marginBottom: "4px",
};

// ─── Patient Agreement Form content (FDA generic — fix #5) ──────────────────
const PATIENT_AGREEMENT_URL =
  "https://www.accessdata.fda.gov/drugsatfda_docs/rems/Mifepristone_2023_01_03_Patient_Agreement_Form.pdf";

// ─── REMS certification links (fix #6) ───────────────────────────────────────
const REMS_MIFEPREX_URL =
  "https://www.earlyoptionpill.com/for-health-professionals/prescribing-mifeprex/";
const REMS_GENBIOPRO_URL = "https://genbiopro.com/rems";

// ─── Component ───────────────────────────────────────────────────────────────

export default function MedicationAbortionPathway({
  selectedState = "",
  institutionId,
  legalStatus,
}) {
  // Step state
  const [pregnancyTest, setPregnancyTest] = useState(null); // "positive" | "negative"
  const [desiredPreg, setDesiredPreg] = useState(null); // "yes" | "undecided" | "no"
  const [counselingChoice, setCounselingChoice] = useState(null); // "later" | "surgical" | "mab"
  const [contraindications, setContraindications] = useState({});
  const [remsStatus, setRemsStatus] = useState(null); // "yes" | "no"
  const [gaWeeks, setGaWeeks] = useState(null);
  const [gaDays, setGaDays] = useState(null);
  const [usFindings, setUsFindings] = useState(null); // "not_performed" | "confirmed_iup" | "epl" | "pul" | "ectopic" | "other"
  const [patientAgreementReviewed, setPatientAgreementReviewed] = useState(null);
  const [followUpCollapsed, setFollowUpCollapsed] = useState(true);
  const [pharmacyCollapsed, setPharmacyCollapsed] = useState(true);

  const isMemorial = institutionId === "memorial";

  // Derived GA in days
  const gaTotalDays =
    (parseInt(gaWeeks) || 0) * 7 + (parseInt(gaDays) || 0);
  const gaValid = gaTotalDays > 0;
  const gaInRange = gaValid && gaTotalDays <= 84;
  const gaOutOfRange = gaValid && gaTotalDays > 84;

  // Legal gestational limit (from legalStatus prop)
  const legalLimitDays = legalStatus?.gestational_limit_weeks
    ? legalStatus.gestational_limit_weeks * 7
    : null;
  const gaWithinLegalLimit = legalLimitDays === null || gaTotalDays <= legalLimitDays;
  // Gate for everything below GA: must be within clinical 84-day limit AND state legal limit
  const gaOkForMAB = gaInRange && gaWithinLegalLimit;

  // Any contraindication checked?
  const anyContraindication = Object.values(contraindications).some(Boolean);

  // REMS cleared?
  const remsCleared = isMemorial || remsStatus === "yes";

  // Show management?
  const showManagement =
    pregnancyTest === "positive" &&
    desiredPreg === "no" &&
    counselingChoice === "mab" &&
    usFindings === "confirmed_iup" &&
    gaOkForMAB &&
    !anyContraindication &&
    remsCleared &&
    patientAgreementReviewed === "yes";

  // ── Contraindication list ────────────────────────────────────────────────
  const contraindicationItems = [
    { key: "allergy", label: "Allergy to mifepristone or misoprostol" },
    { key: "steroids", label: "Chronic systemic corticosteroid use" },
    { key: "anemia", label: "Severe anemia" },
    { key: "adrenal", label: "Adrenal insufficiency" },
    {
      key: "coag",
      label: "Coagulopathy or anticoagulant use",
    },
    { key: "iud", label: "IUD in place (must be removed first)" },
    { key: "porphyria", label: "Known porphyria" },
    {
      key: "ectopic",
      label: "Suspected ectopic pregnancy (must be excluded first)",
    },
  ];

  const toggleContraindication = (key) =>
    setContraindications((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Legal status banner ──────────────────────────────────────────────────
  const renderLegalBanner = () => {
    if (!legalStatus)
      return (
        <RiskBand level="mod" style={revealBox}>
          Legal status loading. Verify current law before prescribing.{" "}
          <a
            href="https://kff.org/womens-health-policy/dashboard/abortion-in-the-u-s-a-data-dashboard/"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            KFF Abortion Dashboard →
          </a>
        </RiskBand>
      );
    if (legalStatus.status === "legal")
      return (
        <RiskBand level="low" style={revealBox}>
          Medication abortion is legal in {legalStatus.state_name}
          {legalStatus.gestational_limit_weeks
            ? ` up to ${legalStatus.gestational_limit_weeks} weeks`
            : ""}
          . This tool does not provide legal advice. Verify current law before
          prescribing.
        </RiskBand>
      );
    if (legalStatus.status === "restricted")
      return (
        <RiskBand level="mod" style={revealBox}>
          Restricted in {legalStatus.state_name}
          {legalStatus.gestational_limit_weeks
            ? ` — limit: ${legalStatus.gestational_limit_weeks} weeks`
            : ""}
          {legalStatus.waiting_period_hours
            ? `, waiting period: ${legalStatus.waiting_period_hours} hrs`
            : ""}
          . This tool does not provide legal advice. Verify current law before
          prescribing.
        </RiskBand>
      );
    if (legalStatus.status === "banned")
      return (
        <RiskBand level="high" style={revealBox}>
          Medication abortion is banned in {legalStatus.state_name}. MAB cannot be
          initiated here.{" "}
          <a
            href="https://www.plancpills.org"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            Plan C Directory →
          </a>
          <br />
          <strong>Note:</strong> Mifepristone is legal for early pregnancy loss in this state, but not for medication abortion.
        </RiskBand>
      );
    return null;
  };

  return (
    <div className="pathway-root">
      {/* ══ 1. Pregnancy test ═══════════════════════════════════════════════ */}
      <Section title="Pregnancy Test">
        <div style={{ marginLeft: "2px" }}><Segmented
          options={[
            { label: "Positive", value: "positive" },
            { label: "Negative", value: "negative" },
          ]}
          value={pregnancyTest}
          onChange={setPregnancyTest}
        /></div>
        {pregnancyTest === "negative" && (
          <RiskBand level="mod" style={revealBox}>
            MAB pathway requires a confirmed pregnancy.
          </RiskBand>
        )}
      </Section>

      {/* ══ 2. Pregnancy desired? ════════════════════════════════════════════ */}
      {pregnancyTest === "positive" && (
        <Section title="Is This Pregnancy Desired?">
          <div style={{ marginLeft: "2px" }}><Segmented
            options={[
              { label: "Yes", value: "yes" },
              { label: "Undecided", value: "undecided" },
              { label: "No", value: "no" },
            ]}
            value={desiredPreg}
            onChange={setDesiredPreg}
          /></div>
          {(desiredPreg === "yes" || desiredPreg === "undecided") && (
            <RiskBand level="info" style={revealBox}>
              Offer prenatal vitamins (folic acid 400–800 mcg daily). Refer to
              OB/GYN via patient navigation.
            </RiskBand>
          )}
        </Section>
      )}

      {/* ══ 3. Options counseling ════════════════════════════════════════════ */}
      {pregnancyTest === "positive" && desiredPreg === "no" && (
        <Section title="Options Counseling">
          <div style={{ marginLeft: "2px" }}><Segmented
            options={[
              { label: "Decide later", value: "later" },
              { label: "Surgical abortion", value: "surgical" },
              { label: "Medication abortion", value: "mab" },
            ]}
            value={counselingChoice}
            onChange={setCounselingChoice}
          /></div>
          {counselingChoice === "later" && (
            <RiskBand level="info" style={revealBox}>
              Patient wishes to decide later. Provide discharge instructions and
              return precautions. Counsel on gestational age limits for all
              options.
            </RiskBand>
          )}
          {counselingChoice === "surgical" && (
            <RiskBand level="info" style={revealBox}>
              Refer for surgical abortion.{" "}
              <a
                href="https://www.plancpills.org"
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                Plan C Directory →
              </a>
            </RiskBand>
          )}
        </Section>
      )}

      {/* ══ MAB pathway continues only if "Medication abortion" chosen ═══════ */}
      {pregnancyTest === "positive" &&
        desiredPreg === "no" &&
        counselingChoice === "mab" && (
          <>
            {/* ── Legal status ──────────────────────────────────────────── */}
            {renderLegalBanner()}

            {/* ══ 4. Ultrasound Findings ════════════════════════════════════ */}
            <Section title="Ultrasound Findings">
              <div style={{ marginLeft: "2px" }}><Segmented
                options={[
                  { label: "Not yet performed", value: "not_performed" },
                  { label: "Confirmed intrauterine pregnancy", value: "confirmed_iup" },
                  { label: "Definitive early pregnancy loss", value: "epl" },
                  { label: "Pregnancy of unknown location", value: "pul" },
                  { label: "Ectopic pregnancy", value: "ectopic" },
                  { label: "Other / inconclusive", value: "other" },
                ]}
                value={usFindings}
                onChange={setUsFindings}
              /></div>
              {usFindings === "not_performed" && (
                <RiskBand level="mod" style={revealBox}>
                  Ultrasound recommended to exclude ectopic pregnancy before initiating MAB.
                </RiskBand>
              )}
              {usFindings === "confirmed_iup" && (
                <RiskBand level="low" style={revealBox}>
                  IUP confirmed. Proceed with MAB evaluation.
                </RiskBand>
              )}
              {usFindings === "epl" && (
                <RiskBand level="info" style={revealBox}>
                  EPL confirmed. MAB is not indicated — see EPL pathway for management.
                </RiskBand>
              )}
              {usFindings === "pul" && (
                <RiskBand level="mod" style={revealBox}>
                  Pregnancy of unknown location — ectopic not excluded. Serial hCG and repeat US required before MAB.
                </RiskBand>
              )}
              {usFindings === "ectopic" && (
                <RiskBand level="high" style={revealBox}>
                  Ectopic pregnancy confirmed. MAB is contraindicated — urgent OB/GYN consultation required.
                </RiskBand>
              )}
              {usFindings === "other" && (
                <RiskBand level="mod" style={revealBox}>
                  Inconclusive findings — additional workup required before initiating MAB.
                </RiskBand>
              )}
            </Section>

            {/* ══ 5–11: continue only if IUP confirmed ═══════════════════════ */}
            {usFindings === "confirmed_iup" && (<>

            {/* ══ 5. Gestational Age ════════════════════════════════════════ */}
            <Section title="Gestational Age">
                <Row>
                  <NumInput
                    label="Weeks"
                    value={gaWeeks}
                    onChange={setGaWeeks}
                    min={0}
                    max={20}
                  />
                  <NumInput
                    label="Days"
                    value={gaDays}
                    onChange={setGaDays}
                    min={0}
                    max={6}
                  />
                </Row>
                {gaValid && (
                  <div style={revealBox}>
                    {/* Summary row */}
                    <div style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--yk-ink-800)",
                      marginBottom: "8px",
                    }}>
                      GA: {Math.floor(gaTotalDays / 7)}w {gaTotalDays % 7}d ({gaTotalDays} days)
                    </div>
                    {/* Clinical limit */}
                    <RiskBand level={gaInRange ? "low" : "high"} style={{ marginBottom: "6px", display: "block" }}>
                      {gaInRange
                        ? `Within clinical MAB limit (≤84 days / 12 weeks)`
                        : `Exceeds clinical MAB limit of 84 days — refer for surgical abortion evaluation`}
                    </RiskBand>
                    {/* Legal limit — only shown if legalStatus has a gestational_limit_weeks */}
                    {legalLimitDays !== null && (
                      <RiskBand
                        level={gaWithinLegalLimit ? "low" : "high"}
                        style={{ display: "block" }}
                      >
                        {gaWithinLegalLimit
                          ? `Within ${legalStatus.state_name} legal limit (≤${legalStatus.gestational_limit_weeks} weeks)`
                          : `Exceeds ${legalStatus.state_name} legal limit of ${legalStatus.gestational_limit_weeks} weeks — MAB cannot be initiated in this state at this gestational age`}
                      </RiskBand>
                    )}
                  </div>
                )}
            </Section>

            {/* ══ 6. Contraindications ══════════════════════════════════════ */}
            {gaOkForMAB && (
              <Section title="Contraindications">
                <p style={smallLabel}>
                  Check any that apply. Any positive = MAB not indicated.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {contraindicationItems.map(({ key, label }) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        background: contraindications[key]
                          ? "var(--yk-risk-high-bg, #fff1f1)"
                          : "transparent",
                        color: contraindications[key]
                          ? "var(--yk-risk-high)"
                          : "inherit",
                        fontSize: "0.9rem",
                        transition: "background 0.15s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!contraindications[key]}
                        onChange={() => toggleContraindication(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {anyContraindication && (
                  <RiskBand level="high" style={revealBox}>
                    MAB should not be initiated. Review with OB/GYN.
                  </RiskBand>
                )}
              </Section>
            )}

            {/* ══ 7. REMS Certification ════════════════════════════════════ */}
            {gaOkForMAB &&
              !anyContraindication && (
                <Section title="REMS Certification">
                  {isMemorial ? (
                    <RiskBand level="info">
                      At Memorial Hospital, OB/GYN places the mifepristone
                      order under the REMS program. The EM physician initiates
                      the OB/GYN handoff — does not prescribe mifepristone
                      directly.
                    </RiskBand>
                  ) : (
                    <>
                      <div style={{ marginLeft: "2px" }}><Segmented
                        options={[
                          {
                            label: "Yes — I am REMS-certified",
                            value: "yes",
                          },
                          { label: "Not yet", value: "no" },
                        ]}
                        value={remsStatus}
                        onChange={setRemsStatus}
                      /></div>
                      {/* fix #6 — corrected registration links */}
                      {remsStatus === "no" && (
                        <RiskBand level="mod" style={revealBox}>
                          REMS certification is required before prescribing
                          mifepristone. Register with your manufacturer:
                          <div
                            style={{
                              display: "flex",
                              gap: "16px",
                              marginTop: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <a
                              href={REMS_MIFEPREX_URL}
                              target="_blank"
                              rel="noreferrer"
                              style={linkStyle}
                            >
                              Mifeprex (Danco) — Get Certified →
                            </a>
                            <a
                              href={REMS_GENBIOPRO_URL}
                              target="_blank"
                              rel="noreferrer"
                              style={linkStyle}
                            >
                              GenBioPro — Get Certified →
                            </a>
                          </div>
                        </RiskBand>
                      )}
                    </>
                  )}
                </Section>
              )}

            {/* ══ 8. Patient Agreement Form (fix #5 — new section) ════════ */}
            {gaOkForMAB &&
              !anyContraindication &&
              remsCleared && (
                <Section title="Patient Agreement Form">
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--yk-ink-700)",
                      marginBottom: "10px",
                      lineHeight: "1.5",
                    }}
                  >
                    The FDA REMS program requires that the Patient Agreement
                    Form be reviewed with and signed by the patient and
                    prescriber before mifepristone is dispensed. The patient
                    must receive a copy; the signed original goes in the medical
                    record.
                  </p>
                  <a
                    href={PATIENT_AGREEMENT_URL}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      background: "var(--yk-sage-100)",
                      border: "1px solid var(--yk-sage-300)",
                      borderRadius: "6px",
                      color: "var(--yk-sage-800)",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      textDecoration: "none",
                      marginBottom: "12px",
                    }}
                  >
                    📄 FDA Mifepristone Patient Agreement Form (PDF)
                  </a>
                  <div style={{ marginLeft: "2px" }}><Segmented
                    options={[
                      {
                        label: "Reviewed and signed with patient",
                        value: "yes",
                      },
                      { label: "Not yet completed", value: "no" },
                    ]}
                    value={patientAgreementReviewed}
                    onChange={setPatientAgreementReviewed}
                  /></div>
                  {patientAgreementReviewed === "no" && (
                    <RiskBand level="mod" style={revealBox}>
                      Patient Agreement Form must be completed before
                      mifepristone is dispensed per REMS requirements.
                    </RiskBand>
                  )}
                </Section>
              )}

            {/* ══ 9. Discharge Instructions (Management) ══════════════════ */}
            {showManagement && (
              <Section title="Discharge Instructions">
                {isMemorial ? (
                  <>
                    <RiskBand level="info">
                      <strong>At Memorial Hospital:</strong> OB/GYN places the
                      mifepristone order. Confirm handoff before patient
                      discharge.
                    </RiskBand>
                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <ResultBlock label="Day 1 — In ED (OB/GYN order)">
                        Mifepristone 200 mg PO
                      </ResultBlock>
                      <ResultBlock label="Day 2–3 — At home (24–48 hrs later)">
                        Misoprostol 800 mcg buccal or vaginal
                      </ResultBlock>
                      <ResultBlock label="Pain management">
                        Ibuprofen 600–800 mg q6–8h PRN pain
                      </ResultBlock>
                      <ResultBlock label="Nausea">
                        Ondansetron 4 mg PRN nausea
                      </ResultBlock>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <ResultBlock label="Day 1">
                        Mifepristone 200 mg PO — prescriber dispenses or sends
                        to REMS-certified pharmacy
                      </ResultBlock>
                      <ResultBlock label="Day 2–3 (24–48 hrs later)">
                        Misoprostol 800 mcg buccal or vaginal
                      </ResultBlock>
                      <ResultBlock label="Pain management">
                        Ibuprofen 600–800 mg q6–8h PRN pain
                      </ResultBlock>
                      <ResultBlock label="Nausea">
                        Ondansetron 4 mg PRN nausea
                      </ResultBlock>
                    </div>
                  </>
                )}
                <RiskBand level="high" style={{ marginTop: "12px" }}>
                  <strong>Return precautions — instruct patient to return
                  if:</strong>
                  <ul
                    style={{
                      margin: "6px 0 0 0",
                      paddingLeft: "18px",
                      lineHeight: "1.7",
                    }}
                  >
                    <li>Soaking &gt;2 pads/hr for 2+ consecutive hours</li>
                    <li>Fever &gt;101°F (38.3°C)</li>
                    <li>Severe abdominal pain not relieved by ibuprofen</li>
                    <li>Feeling faint or lightheaded</li>
                  </ul>
                </RiskBand>
              </Section>
            )}

            {/* ══ 10. Confirming Efficacy ══════════════════════════════════ */}
            {showManagement && (
              <Section
                title="Confirming Efficacy"
                collapsible
                collapsed={followUpCollapsed}
                onToggle={() => setFollowUpCollapsed((p) => !p)}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <ResultBlock label="4 weeks post-treatment">
                    Repeat urine pregnancy test
                  </ResultBlock>
                  <ResultBlock label="1–2 weeks (if baseline hCG drawn)">
                    Serum β-hCG — expect ≥50% decline
                  </ResultBlock>
                  <ResultBlock label="If symptoms persist or hCG not declining">
                    Pelvic ultrasound
                  </ResultBlock>
                  <ResultBlock label="Follow-up">
                    OB/GYN or primary care within 2 weeks
                  </ResultBlock>
                </div>
              </Section>
            )}

            {/* ══ 11. Pharmacy Options ═════════════════════════════════════ */}
            {showManagement && (
              <Section
                title="Pharmacy Options"
                collapsible
                collapsed={pharmacyCollapsed}
                onToggle={() => setPharmacyCollapsed((p) => !p)}
              >
                {/* Find a pharmacy button */}
                <a
                  href="https://medicationabortionpharmacies.com/#find-a-pharmacy"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block", padding: "10px 18px", marginBottom: "16px",
                    background: "var(--yk-sage-500)", color: "white", borderRadius: "6px",
                    fontWeight: 600, fontSize: "13.5px", textDecoration: "none",
                  }}
                >
                  Find a REMS-Certified Pharmacy Near You ↗
                </a>

                {/* Interactive map */}
                <div style={{ marginBottom: "6px" }}>
                  <iframe
                    src="https://birthcontrolpharmacist.com/medication-abortion-map/"
                    title="Medication abortion pharmacy map"
                    style={{ width: "100%", height: "380px", border: "1px solid var(--yk-ink-150)", borderRadius: "8px" }}
                    loading="lazy"
                  />
                  <p style={{ ...smallLabel, marginTop: "4px" }}>
                    Map is self-reported — call ahead to confirm availability.
                  </p>
                </div>

                <StatePharmacyFinder selectedState={selectedState} />
              </Section>
            )}

            </>)} {/* end usFindings === "confirmed_iup" */}
          </>
        )}
    </div>
  );
}
