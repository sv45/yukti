import React, { useState, useRef } from 'react';
import { Section } from './primitives';
import StatePharmacyFinder from "./StatePharmacyFinder";

const STEPS = [
  { num: 1, label: "What is REMS?" },
  { num: 2, label: "Get Certified" },
  { num: 3, label: "Patient Agreement" },
  { num: 4, label: "Find pharmacy" },
  { num: 5, label: "Ready to prescribe" },
];

const FAQS = [
  {
    q: "Does REMS certification expire?",
    a: "No. Once you complete REMS enrollment, your certification does not expire. You do not need to recertify periodically, though you must continue to follow the prescriber agreement terms.",
  },
  {
    q: "Can I prescribe if my hospital pharmacy is not REMS certified?",
    a: "Yes. If your hospital pharmacy is not REMS certified, you can still prescribe mifepristone and direct the patient to a certified retail or mail-order pharmacy. The prescription can be sent electronically to any certified pharmacy.",
  },
  {
    q: "Is REMS certification the same for EPL and medication abortion?",
    a: "Yes. The mifepristone REMS program covers all FDA-approved uses of mifepristone, including both early pregnancy loss management and medication abortion. One certification covers both indications.",
  },
  {
    q: "How do I know if I'm already certified?",
    a: "There is no online database to check your certification status. The fastest way is to call the manufacturer directly with your NPI number — they can look you up in under a minute. Mifeprex (Danco): 1-855-MIFE-877. GenBioPro: 1-855-4GB-REMS.",
  },
  {
    q: "Do I need to do anything to certify the pharmacy?",
    a: "No — pharmacies complete their own separate REMS certification directly with the manufacturer. Your job is to send your prescription to a pharmacy that is already certified. The directory in Step 3 shows certified pharmacies. If your hospital pharmacy is not yet certified, they can contact GenBioPro at RxAgreements@genbiopro.com or Danco at Mifeprex@dancodistributor.com to begin the process.",
  },
  {
    q: "What if I am using my hospital pharmacy?",
    a: "Hospital pharmacies vary in their process. Some verify your certification automatically through the manufacturer registry using your NPI. Others require you to notify your pharmacy director or credentialing office that you have completed REMS certification — check with your hospital pharmacy directly. If your hospital pharmacy is not yet REMS-certified, they can contact GenBioPro at RxAgreements@genbiopro.com or Danco at Mifeprex@dancodistributor.com to begin their own certification process.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid var(--yk-ink-150)", padding: "12px 0" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: "none", cursor: "pointer", width: "100%",
          textAlign: "left", display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: "12px", padding: 0,
        }}
      >
        <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--yk-ink-800)" }}>{q}</span>
        <span style={{
          fontSize: "11px", color: "var(--yk-ink-400)", flexShrink: 0,
          display: "inline-block",
          transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s",
        }}>▶</span>
      </button>
      {open && (
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--yk-ink-600)", lineHeight: "1.6" }}>{a}</p>
      )}
    </div>
  );
}

function LinkButton({ href, children, color = "#2563EB" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block", padding: "9px 16px",
        background: color, color: "white", borderRadius: "6px",
        fontWeight: 600, fontSize: "13px", textDecoration: "none",
        lineHeight: 1,
      }}
    >
      {children}
    </a>
  );
}

function StepCheckbox({ done, onChange }) {
  return (
    <label
      style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", userSelect: "none" }}
      onClick={e => e.stopPropagation()}
    >
      <span style={{
        width: "26px", height: "26px", borderRadius: "50%", border: `2px solid ${done ? "#10B981" : "var(--yk-ink-250, #ccc)"}`,
        background: done ? "#10B981" : "white", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0,
      }}>
        {done && <span style={{ color: "white", fontSize: "14px", lineHeight: 1 }}>✓</span>}
      </span>
      <input type="checkbox" checked={done} onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: "12px", color: done ? "#10B981" : "var(--yk-ink-400)", fontWeight: done ? 600 : 400 }}>
        {done ? "Done" : "Mark done"}
      </span>
    </label>
  );
}

const AGREEMENT_URLS = {
  genbiopro: {
    "English":               "https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-716-Patient-Agreement.pdf",
    "Spanish":               "https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-628-Patient-agreement-branded-2023-01_ES-US.pdf",
    "Chinese (Simplified)":  "https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-629-Patient-agreement-branded-2023-01_ZH-CN.pdf",
    "Chinese (Traditional)": "https://genbiopro.com/wp-content/uploads/2023/06/GBP-MIF-710-Patient-agreement-branded-2023-01_ZH-TW.pdf",
    "Vietnamese":            "https://genbiopro.com/wp-content/uploads/2023/07/GBP-MIF-630-Patient-agreement-branded-2023-01_VI-US.pdf",
    "French":                "https://genbiopro.com/wp-content/uploads/2023/06/GBP-MIF-707-Patient-agreement-branded-2023-01_FR-FR.pdf",
    "Haitian Creole":        "https://genbiopro.com/wp-content/uploads/2023/06/GBP-MIF-708-Patient-agreement-branded-2023-01_HT-HT.pdf",
    "Russian":               "https://genbiopro.com/wp-content/uploads/2023/06/GBP-MIF-709-Patient-agreement-branded-2023-01_RU-RU.pdf",
  },
  danco: {
    "English":               "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_ENG_Web.pdf",
    "Spanish":               "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_ESP_Web.pdf",
    "Arabic":                "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_AR_Web.pdf",
    "Chinese (Traditional)": "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_ZHT_Web.pdf",
    "French":                "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_FR_EU_Web.pdf",
    "Haitian Creole":        "https://www.earlyoptionpill.com/wp-content/uploads/2024/03/DAN_PatientAgreement_1.2023_FR-CR.pdf",
    "Hindi":                 "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_HI_Web.pdf",
    "Vietnamese":            "https://www.earlyoptionpill.com/wp-content/uploads/2023/02/DANCO_PatientAgreement_VI_Web.pdf",
  },
};

function PatientAgreementSelector() {
  const [langGenbiopro, setLangGenbiopro] = useState("");
  const [langDanco, setLangDanco] = useState("");

  const selectStyleFor = (color) => ({
    padding: "8px 12px", fontSize: "13px",
    border: `1.5px solid ${color}`, borderRadius: "6px",
    background: color, color: "white", fontWeight: 600, cursor: "pointer",
    width: "100%",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        {/* GenBioPro card */}
        <div style={{
          flex: 1, minWidth: "220px", border: "2px solid #0F766E", borderRadius: "10px",
          padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "white",
        }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--yk-ink-900)" }}>GenBioPro</div>
          <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500)" }}>Mifepristone (generic)</div>
          <select value={langGenbiopro} onChange={e => setLangGenbiopro(e.target.value)} style={selectStyleFor("#0F766E")}>
            <option value="">Select language</option>
            {Object.keys(AGREEMENT_URLS.genbiopro).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {langGenbiopro && (
            <LinkButton href={AGREEMENT_URLS.genbiopro[langGenbiopro]} color="#0F766E">
              Download Form ↗
            </LinkButton>
          )}
        </div>

        {/* Danco card */}
        <div style={{
          flex: 1, minWidth: "220px", border: "2px solid #2563EB", borderRadius: "10px",
          padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "white",
        }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--yk-ink-900)" }}>Danco</div>
          <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500)" }}>Mifeprex (brand)</div>
          <select value={langDanco} onChange={e => setLangDanco(e.target.value)} style={selectStyleFor("#2563EB")}>
            <option value="">Select language</option>
            {Object.keys(AGREEMENT_URLS.danco).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {langDanco && (
            <LinkButton href={AGREEMENT_URLS.danco[langDanco]} color="#2563EB">
              Download Form ↗
            </LinkButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function REMSPathway({ entryState = "", legalStatus = null }) {
  const [stepDone, setStepDone] = useState({});
  const stepRefs = useRef({});

  const toggleStep = (n) => setStepDone(prev => ({ ...prev, [n]: !prev[n] }));
  const allDone = !!(stepDone[2] && stepDone[3] && stepDone[4]);
  const doneCount = [2, 3, 4].filter(n => stepDone[n]).length;
  // Step 5 is passive — it lights up automatically when 2+3+4 are done
  const isDone = (n) => n === 5 ? allDone : !!stepDone[n];

  const scrollTo = (n) => {
    const el = stepRefs.current[n];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stepBadge = (n) => (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "20px", height: "20px", borderRadius: "50%",
      background: "var(--yk-sage-100, #e8f0ec)", border: "1.5px solid var(--yk-sage-300, #bdd0c4)",
      fontSize: "11px", fontWeight: 700, color: "var(--yk-ink-600)",
      marginRight: "8px", flexShrink: 0, verticalAlign: "middle",
    }}>{n}</span>
  );

  return (
    <div style={{ padding: "0 0 100px" }}>

      {/* What is REMS? — shown before the legal status box */}
      <div style={{ margin: "20px 0" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--yk-ink-900)", marginBottom: "8px" }}>What is REMS?</div>
        <p style={{ margin: "0 0 8px", fontSize: "13.5px", color: "var(--yk-ink-700)", lineHeight: "1.65" }}>
          Mifepristone is subject to a <strong>Risk Evaluation and Mitigation Strategy (REMS)</strong> — an FDA safety program that requires prescribers to sign a prescriber agreement form and be REMS-certified before they can prescribe the drug. This is a one-time enrollment, not a license or board certification.
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "13.5px", color: "var(--yk-ink-700)", lineHeight: "1.65" }}>
          The REMS applies to <strong>both uses of mifepristone</strong>: early pregnancy loss (EPL) management and medication abortion. Completing the enrollment once covers both indications.
        </p>
        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--yk-ink-700)", lineHeight: "1.65" }}>
          There are two FDA-approved mifepristone products — <strong>Mifeprex</strong> (brand, Danco Laboratories) and a <strong>generic</strong> (GenBioPro). Each has its own REMS enrollment portal, but the process is identical for both.
        </p>
      </div>

      {/* Legal status + not-yet-certified — combined box */}
      {(() => {
        const s = legalStatus?.status;
        const strictLimit = s === "restricted" && legalStatus.gestational_limit_weeks != null && legalStatus.gestational_limit_weeks < 12;
        const bg    = s === "banned" ? "#EFF6FF" : (s === "legal" || (s === "restricted" && !strictLimit)) ? "#F0FDF4" : "#FFFBEB";
        const border= s === "banned" ? "#BFDBFE" : (s === "legal" || (s === "restricted" && !strictLimit)) ? "#86EFAC" : "#FCD34D";
        const color = s === "banned" ? "#1E40AF" : (s === "legal" || (s === "restricted" && !strictLimit)) ? "#166534" : "#78350F";
        const icon  = s === "banned" ? "ℹ" : (s === "legal" || (s === "restricted" && !strictLimit)) ? "✓" : "⚠";

        const legalText = s === "legal"
          ? <>Mifepristone is legal in <strong>{legalStatus.state_name}</strong> for both <strong>medication abortion</strong> and <strong>early pregnancy loss (EPL) management</strong>.</>
          : s === "restricted"
          ? <>Mifepristone is legal in <strong>{legalStatus.state_name}</strong> for <strong>early pregnancy loss (EPL) management</strong> and for <strong>medication abortion</strong>{legalStatus.gestational_limit_weeks ? ` up to ${legalStatus.gestational_limit_weeks} weeks` : ""}.</>
          : s === "banned"
          ? <>Mifepristone is legal for early pregnancy loss in this state, but not for medication abortion.</>

          : null;

        if (!legalText && allDone) return null;

        return (
          <div style={{
            background: legalText ? bg : "#FFFBEB",
            border: `1px solid ${legalText ? border : "#FCD34D"}`,
            borderRadius: "8px",
            padding: "12px 14px", margin: "16px 0",
          }}>
            {legalText && (
              <p style={{ margin: 0, fontSize: "13px", color, lineHeight: "1.5" }}>
                <span style={{ marginRight: "6px" }}>{icon}</span>{legalText}
              </p>
            )}
            {!allDone && (
              <p style={{ margin: legalText ? "8px 0 0" : "0", fontSize: "13px", color: legalText ? color : "#78350F", lineHeight: "1.5" }}>
                <span style={{ marginRight: "6px" }}>⚠</span><strong>Not yet certified?</strong> Consult OB/GYN on call, or use misoprostol alone (no REMS required).
              </p>
            )}
          </div>
        );
      })()}

      {/* Progress tracker */}
      {allDone ? (
        <div style={{
          background: "#10B981", border: "1px solid #059669", borderRadius: "10px",
          padding: "14px 20px", margin: "16px 0",
          display: "flex", alignItems: "center", gap: "10px",
          transition: "background 0.3s",
        }}>
          <span style={{ fontSize: "18px", color: "white", lineHeight: 1 }}>✓</span>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "white" }}>Ready to prescribe</span>
        </div>
      ) : (
        <div style={{
          display: "flex", gap: "4px", alignItems: "center",
          background: "white", border: "1px solid var(--yk-ink-150)", borderRadius: "10px",
          padding: "16px 20px", margin: "16px 0",
          overflowX: "auto",
        }}>
          {[
            { num: 2, label: "Get REMS Certified" },
            { num: 3, label: "Patient Agreement Form" },
            { num: 4, label: "Find a pharmacy" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => scrollTo(s.num)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                  background: "none", border: "none", cursor: "pointer", padding: "0 4px",
                  minWidth: "72px", flexShrink: 0,
                }}
              >
                <span style={{
                  width: "36px", height: "36px", borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700,
                  background: stepDone[s.num] ? "#10B981" : "white",
                  color: stepDone[s.num] ? "white" : "var(--yk-ink-600)",
                  border: stepDone[s.num] ? "2.5px solid #10B981" : "2.5px solid var(--yk-sage-300, #bdd0c4)",
                  boxShadow: stepDone[s.num] ? "0 0 0 3px #D1FAE5" : "none",
                  transition: "all 0.2s",
                }}>
                  {stepDone[s.num] ? "✓" : i + 1}
                </span>
                <span style={{
                  fontSize: "12px", color: stepDone[s.num] ? "#065F46" : "var(--yk-ink-600)",
                  fontWeight: stepDone[s.num] ? 700 : 500, textAlign: "center", lineHeight: 1.3,
                  maxWidth: "80px",
                }}>
                  {s.label}
                </span>
              </button>
              {i < arr.length - 1 && (
                <div style={{
                  flex: 1, height: "3px", minWidth: "12px",
                  background: stepDone[s.num] ? "#10B981" : "var(--yk-ink-150)",
                  transition: "background 0.2s",
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step 2 — Get Certified (merged) */}
      <div ref={el => stepRefs.current[2] = el}>
        <Section
          num="02"
          title={<>{stepBadge(1)}Get REMS Certified</>}
          sub="Register with your manufacturer's REMS portal."
          headerRight={<StepCheckbox done={!!stepDone[2]} onChange={() => toggleStep(2)} />}
          collapsed={!!stepDone[2]}
        >
          <div style={{ padding: "14px 20px 20px" }}>
            {/* Formulary callout */}
            <div style={{
              background: "var(--yk-info-bg, #EFF6FF)", border: "1px solid var(--yk-info-bd, #BFDBFE)",
              borderRadius: "8px", padding: "12px 14px", marginBottom: "16px",
            }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--yk-info-fg, #1E40AF)", lineHeight: "1.6" }}>
                <strong>Not sure which manufacturer your hospital uses?</strong> Check with your hospital pharmacy first — they can tell you which brand is on formulary. You can certify with both at no cost if needed.
              </p>
            </div>

            {/* Manufacturer cards */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{
                flex: 1, minWidth: "220px", border: "2px solid #0F766E", borderRadius: "10px",
                padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "white",
              }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--yk-ink-900)" }}>GenBioPro</div>
                <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500)" }}>Mifepristone (generic)</div>
                <LinkButton href="https://genbiopro.com/wp-content/uploads/2024/09/GBP-MIF-715-Prescriber-Agreement_2023-01-26.pdf" color="#0F766E">
                  Get Certified — GenBioPro ↗
                </LinkButton>
              </div>
              <div style={{
                flex: 1, minWidth: "220px", border: "2px solid #2563EB", borderRadius: "10px",
                padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "white",
              }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--yk-ink-900)" }}>Danco</div>
                <div style={{ fontSize: "12.5px", color: "var(--yk-ink-500)" }}>Mifeprex (brand)</div>
                <LinkButton href="https://www.earlyoptionpill.com/wp-content/uploads/2026/04/Danco_Prescriber-Agreement-Form_092025.pdf" color="#2563EB">
                  Get Certified — Mifeprex ↗
                </LinkButton>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Step 3 */}
      <div ref={el => stepRefs.current[3] = el}>
        <Section
          num="03"
          title={<>{stepBadge(2)}Patient Agreement Form</>}
          sub="Required for every patient before dispensing mifepristone."
          headerRight={<StepCheckbox done={!!stepDone[3]} onChange={() => toggleStep(3)} />}
          collapsed={!!stepDone[3]}
        >
          <div style={{ padding: "14px 20px 20px" }}>
            <p style={{ margin: "0 0 14px", fontSize: "13.5px", color: "var(--yk-ink-700)", lineHeight: "1.65" }}>
              Document patient consent using the manufacturer-specific Patient Agreement Form, signed by both provider and patient. Keep the original in the chart; give the patient their copy. Not sure which manufacturer? Call the pharmacy or check with your hospital pharmacy department.
            </p>
            <PatientAgreementSelector />
          </div>
        </Section>
      </div>

      {/* Step 4 */}
      <div ref={el => stepRefs.current[4] = el}>
        <Section
          num="04"
          title={<>{stepBadge(3)}Find a pharmacy</>}
          sub="Not all pharmacies carry mifepristone — verify availability before sending."
          headerRight={<StepCheckbox done={!!stepDone[4]} onChange={() => toggleStep(4)} />}
          collapsed={!!stepDone[4]}
        >
          <div style={{ padding: "14px 20px 20px" }}>
            <div style={{
              background: "var(--yk-info-bg, #EFF6FF)",
              border: "1px solid var(--yk-info-bd, #BFDBFE)",
              borderRadius: "8px", padding: "12px 14px", marginBottom: "16px",
            }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--yk-info-fg, #1E40AF)", lineHeight: "1.6" }}>
                Not all pharmacies stock mifepristone - call ahead to confirm before sending a prescription.
              </p>
            </div>
            <StatePharmacyFinder selectedState={entryState} />
          </div>
        </Section>
      </div>

      {/* Step 5 — passive banner, appears automatically when steps 2–4 are done */}
      <div ref={el => stepRefs.current[5] = el}>
        {allDone && (
          <div style={{
            background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: "10px",
            padding: "20px 24px", marginBottom: "16px",
          }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#065F46", marginBottom: "10px" }}>
              ✓ You are ready to prescribe mifepristone
            </div>
            <p style={{ margin: "0 0 14px", fontSize: "13.5px", color: "#065F46", lineHeight: "1.65" }}>
              You are enrolled in the REMS program and authorized to prescribe mifepristone. Keep a copy of your prescriber agreement and have the patient agreement form accessible for each encounter.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12.5px", color: "#065F46", fontWeight: 600,
                         background: "#A7F3D0", padding: "6px 12px", borderRadius: "6px" }}>
                REMS certification
              </span>
              <span style={{ fontSize: "12.5px", color: "#065F46", fontWeight: 600,
                         background: "#A7F3D0", padding: "6px 12px", borderRadius: "6px" }}>
                Patient Agreement Form
              </span>
              <span style={{ fontSize: "12.5px", color: "#065F46", fontWeight: 600,
                         background: "#A7F3D0", padding: "6px 12px", borderRadius: "6px" }}>
                Pharmacy locator
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FAQ */}
      <Section num="FAQ" title="Frequently Asked Questions" collapsible>
        <div style={{ padding: "0 20px 16px" }}>
          {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </Section>

      {/* Sticky footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: allDone ? "#065F46" : "white",
        borderTop: allDone ? "none" : "1px solid var(--yk-ink-150)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        transition: "background 0.3s",
      }}>
        {allDone ? (
          <div style={{
            margin: "0 auto",
            padding: "14px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
          }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "white" }}>
              ✓ You are ready to prescribe mifepristone
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a href="https://www.earlyoptionpill.com/wp-content/uploads/2026/04/Danco_Prescriber-Agreement-Form_092025.pdf"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#6EE7B7", fontWeight: 600, textDecoration: "none" }}>
                REMS certification ↗
              </a>
              <a href="https://www.accessdata.fda.gov/drugsatfda_docs/rems/Mifepristone_2023_01_03_Patient_Agreement_Form.pdf"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#6EE7B7", fontWeight: 600, textDecoration: "none" }}>
                Patient Agreement Form ↗
              </a>
              <a href="https://medicationabortionpharmacies.com/#find-a-pharmacy"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#6EE7B7", fontWeight: 600, textDecoration: "none" }}>
                Pharmacy locator ↗
              </a>
            </div>
          </div>
        ) : (
          <div style={{
            margin: "0 auto",
            padding: "12px 20px", display: "flex", alignItems: "center",
            justifyContent: "flex-start", gap: "12px",
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--yk-ink-800)" }}>
                Your Progress: {doneCount} / 3 steps
              </span>
              <div style={{ marginTop: "4px", height: "4px", width: "200px", background: "var(--yk-ink-150)", borderRadius: "2px" }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  width: `${(doneCount / 3) * 100}%`,
                  background: "#10B981", transition: "width 0.3s",
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
