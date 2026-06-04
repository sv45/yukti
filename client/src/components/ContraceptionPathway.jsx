// Contraception & Emergency Contraception pathway — full CDS tool.
// Follows the same Section/Row/Segmented/RiskBand/ResultBlock/Recommendation/Cite
// primitives used by EPLPathway.

import React, { useState, useEffect } from 'react';
import { Section, Row, Segmented, RiskBand, ResultBlock, Cite } from './primitives';
import logoUrl from '../assets/yukti-logo.png';

const METHODS = [
  {
    id: "pills-combined",
    name: "Daily oral pill (combined estrogen and progestin)",
    type: "combined",
    avail: "Rx",
    route: "PO (oral)",
    drugName: "Norgestimate/ethinyl estradiol 0.25mg/35mcg",
    dose: "1 tab daily",
    qty: "1 pack",
    refills: "11",
    memorialExtra: "Loestrin 1.5/30 also available",
    description: "Combined oral contraceptive pill",
    goodrx: "https://www.goodrx.com/norgestimate-ethinyl-estradiol",
    patientInstructions: "Take one pill at the same time every day. Missing pills or taking them at inconsistent times reduces efficacy. Efficacy: >99% with perfect use, ~93% with typical use.",
    sideEffects: ["Irregular bleeding", "Nausea", "Breast tenderness", "Headache", "Mood changes"],
  },
  {
    id: "patch",
    name: "Transdermal patch (Xulane)",
    type: "combined",
    avail: "Rx",
    route: "Transdermal",
    drugName: "Norelgestromin/EE 150mcg/35mcg",
    dose: "1 patch/week ×3wk, off 1wk",
    qty: "3 patches",
    refills: "11",
    memorialExtra: null,
    description: "Weekly transdermal patch",
    goodrx: "https://www.goodrx.com/norelgestromin-ethinyl-estradiol",
    patientInstructions: "Apply a new patch once a week for 3 weeks, then go patch-free for 1 week. Apply to clean dry skin on abdomen, back, upper arm, or buttock — avoid breasts. Efficacy: >99% with perfect use, ~93% with typical use.",
    sideEffects: ["Skin irritation at application site", "Irregular bleeding", "Nausea", "Breast tenderness", "Headache", "Mood changes"],
  },
  {
    id: "ring",
    name: "Vaginal ring (NuvaRing / EluRyng)",
    type: "combined",
    avail: "Rx",
    route: "Vaginal",
    drugName: "Etonogestrel/EE 0.12mg/0.015mg",
    dose: "Insert 3wk, remove 1wk",
    qty: "1 ring",
    refills: "11",
    memorialExtra: null,
    description: "Monthly vaginal ring",
    goodrx: "https://www.goodrx.com/etonogestrel-ethinyl-estradiol",
    providerNote: "Counsel patient: compress ring between thumb and forefinger and insert into the vagina — exact position is not critical, push as far back as comfortable. Ring stays in place for 3 weeks; remove for 1 week then insert new ring. If ring falls out, rinse with cool water and reinsert within 3 hours. Dispose of used ring in the foil pouch provided — do not flush.",
    patientInstructions: "Compress the ring between your fingers and insert it into your vagina, pushing it as far back as is comfortable — the exact position doesn't matter. Leave it in place for 3 weeks. After 3 weeks, remove it for 1 week (you may get a period during this week), then insert a new ring. To remove: hook a finger under the rim and pull out. If it feels uncomfortable at any point, use your finger to push it further back into the vagina. If the ring falls out, rinse with cool water and reinsert within 3 hours. Dispose of the used ring in the foil pouch provided — do not flush down the toilet. Efficacy: >99% with perfect use, ~93% with typical use.",
    sideEffects: ["Vaginal discharge", "Vaginal irritation", "Irregular bleeding", "Nausea", "Breast tenderness", "Headache", "Mood changes"],
  },
  {
    id: "pills-pop-rx",
    name: "Daily oral pill (progestin-only, Rx)",
    type: "progestin",
    avail: "Rx",
    route: "PO (oral)",
    drugName: "Norethindrone 0.35mg",
    dose: "1 tab daily same time",
    qty: "1 pack",
    refills: "11",
    memorialExtra: null,
    description: "Progestin-only pill (prescription)",
    goodrx: "https://www.goodrx.com/norethindrone",
    patientInstructions: "Take one pill at the same time every day. Missing pills or taking them at inconsistent times reduces efficacy. Efficacy: >99% with perfect use, ~93% with typical use.",
    sideEffects: ["Irregular bleeding", "Nausea", "Breast tenderness", "Headache", "Mood changes"],
  },
  {
    id: "pills-pop-otc",
    name: "Daily oral pill (progestin-only, over-the-counter)",
    type: "progestin",
    avail: "OTC",
    route: "PO (oral)",
    drugName: "Opill (norgestrel 0.075mg)",
    dose: "1 tab daily same time",
    qty: "13 packs",
    refills: "OTC",
    memorialExtra: null,
    description: "Progestin-only pill (over the counter)",
    goodrx: "https://www.goodrx.com/norgestrel",
    patientInstructions: "Take one pill at the same time every day. Missing pills or taking them at inconsistent times reduces efficacy. Efficacy: >99% with perfect use, ~93% with typical use.",
    sideEffects: ["Irregular bleeding", "Nausea", "Breast tenderness", "Headache", "Mood changes"],
  },
  {
    id: "injectable",
    name: "Depo Shot: intramuscular injection",
    type: "progestin",
    avail: "in-ED",
    route: "IM (intramuscular)",
    drugName: "Medroxyprogesterone acetate 150mg",
    dose: "150mg IM",
    qty: "1 injection",
    refills: "3",
    memorialExtra: null,
    description: "DMPA injectable",
    memorialDetail: "150mg IM administered in ED now. Note: return to fertility up to 9 months; may cause weight gain.",
    generalDetail: "Prescribe 4 shots subQ for clinic administration. Note: return to fertility up to 9 months; may cause weight gain.",
    goodrx: "https://www.goodrx.com/medroxyprogesterone",
    patientInstructions: "Administered as an intramuscular injection every 3 months. Must return for repeat injection on time to maintain efficacy. Efficacy: >99% with perfect use, ~96% with typical use.",
    sideEffects: ["Irregular bleeding", "Amenorrhea", "Weight gain", "Return to fertility may take up to 9 months", "Bone density changes with long-term use"],
  },
  {
    id: "larc",
    name: "Long-acting reversible contraception (IUD or implant)",
    type: "larc",
    avail: "refer",
    route: "—",
    drugName: "—",
    dose: "—",
    qty: "—",
    refills: "—",
    memorialExtra: null,
    description: "Most effective. Not placed in this ED. Refer to patient navigator for OB/GYN. Offer bridge prescription today.",
    goodrx: null,
    patientInstructions: "Implant: inserted under skin of upper arm, effective for up to 3 years. Hormonal IUD: placed in uterus, effective 3–8 years depending on brand. Copper IUD: placed in uterus, effective up to 10–12 years and also functions as emergency contraception. Efficacy: >99% for all LARC methods.",
    sideEffects: null,
  },
];

const METHOD_GROUPS = [
  { id: "pill",       label: "Daily oral pill",   disabledIfEstrogenCi: false },
  { id: "patch",      label: "Transdermal patch", disabledIfEstrogenCi: true  },
  { id: "ring",       label: "Vaginal ring",       disabledIfEstrogenCi: true  },
  { id: "injectable", label: "Depo shot (intramuscular injection)", disabledIfEstrogenCi: false },
  { id: "larc",       label: "IUD or implant",     disabledIfEstrogenCi: false },
];

const MEC_METHOD_LABELS = {
  coc:     "Combined pill",
  pop:     "Progestin-only pill",
  patch:   "Patch",
  ring:    "Vaginal ring",
  dmpa:    "DMPA (shot)",
  cu_iud:  "Copper IUD",
  lng_iud: "LNG-IUD",
  implant: "Implant",
};

const MEC_CONDITIONS = [
  {
    category: "Cardiovascular",
    conditions: [
      { id:"htn_controlled",       label:"Controlled hypertension",                                          mec:{coc:3,pop:1,patch:1,ring:1,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"htn_severe",           label:"Uncontrolled hypertension (BP \u2265160/100)",                      mec:{coc:4,pop:2,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:2,implant:2} },
      { id:"dvt_pe_hx",            label:"History of DVT or PE",                                             mec:{coc:4,pop:2,patch:4,ring:4,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"dvt_pe_current",       label:"Current DVT or PE (on anticoagulation)",                           mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:3,implant:3} },
      { id:"ihd",                  label:"Ischemic heart disease (current or history)",                      mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:2,implant:2} },
      { id:"stroke",               label:"Stroke or TIA (history)",                                          mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:2,implant:2} },
      { id:"valvular_complicated", label:"Valvular heart disease (complicated)",                              mec:{coc:4,pop:1,patch:4,ring:4,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"thrombogenic_mut",     label:"Thrombogenic mutations (Factor V Leiden, prothrombin, etc.)",      mec:{coc:4,pop:2,patch:4,ring:4,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"smoking_35",           label:"Smoking and age \u226535",                                         mec:{coc:4,pop:1,patch:4,ring:4,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"hyperlipidemia",       label:"Hyperlipidemia (known)",                                           mec:{coc:2,pop:2,patch:2,ring:2,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"obesity",              label:"Obesity (BMI ≥30 kg/m²)",                                          mec:{coc:2,pop:1,patch:2,ring:2,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
    ],
  },
  {
    category: "Neurological",
    conditions: [
      { id:"migraine_aura",         label:"Migraine with aura (any age)",                                    mec:{coc:4,pop:2,patch:4,ring:4,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"epilepsy_aeds",         label:"Epilepsy on enzyme-inducing AEDs (phenytoin, carbamazepine, etc.)",mec:{coc:3,pop:3,patch:3,ring:3,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
    ],
  },
  {
    category: "Reproductive",
    conditions: [
      { id:"postpartum_lt21d",      label:"Postpartum <21 days (not breastfeeding)",                         mec:{coc:4,pop:1,patch:4,ring:4,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"postpartum_21_42_vte",  label:"Postpartum 21–42 days with VTE risk factors (not breastfeeding)", mec:{coc:3,pop:1,patch:3,ring:3,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"bf_lt6wk",              label:"Breastfeeding, <6 weeks postpartum",                              mec:{coc:4,pop:2,patch:4,ring:4,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"bf_6wk_6mo",            label:"Breastfeeding, 6 weeks–<6 months postpartum",                    mec:{coc:2,pop:1,patch:2,ring:2,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"breast_cancer_current", label:"Breast cancer (current)",                                         mec:{coc:4,pop:4,patch:4,ring:4,dmpa:4,cu_iud:1,lng_iud:4,implant:4} },
      { id:"breast_cancer_past",    label:"Breast cancer (past, ≥5 years, no evidence of disease)",          mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:3,implant:3} },
      { id:"pid_current",           label:"Pelvic inflammatory disease (current)",                           mec:{coc:1,pop:1,patch:1,ring:1,dmpa:1,cu_iud:4,lng_iud:4,implant:1} },
      { id:"sti_current",           label:"Current chlamydia or gonorrhea",                                  mec:{coc:1,pop:1,patch:1,ring:1,dmpa:1,cu_iud:4,lng_iud:4,implant:1} },
      { id:"fibroids_cavity",       label:"Uterine fibroids with cavity distortion",                         mec:{coc:1,pop:1,patch:1,ring:1,dmpa:1,cu_iud:3,lng_iud:3,implant:1} },
      { id:"unexplained_bleeding",  label:"Unexplained vaginal bleeding (before evaluation)",                 mec:{coc:2,pop:2,patch:2,ring:2,dmpa:3,cu_iud:3,lng_iud:3,implant:3} },
      { id:"endometrial_cancer",    label:"Endometrial (uterine) cancer",                                    mec:{coc:1,pop:1,patch:1,ring:1,dmpa:1,cu_iud:4,lng_iud:4,implant:1} },
      { id:"cervical_cancer",       label:"Cervical cancer (awaiting treatment)",                             mec:{coc:2,pop:1,patch:2,ring:2,dmpa:2,cu_iud:2,lng_iud:2,implant:1} },
    ],
  },
  {
    category: "Hepatic",
    conditions: [
      { id:"hepatitis_acute",    label:"Viral hepatitis (acute or flare)",                                   mec:{coc:3,pop:3,patch:3,ring:3,dmpa:1,cu_iud:1,lng_iud:2,implant:2} },
      { id:"cirrhosis",          label:"Cirrhosis",                                                          mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:3,implant:3} },
      { id:"liver_tumor",        label:"Liver tumor",                                                        mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:1,lng_iud:3,implant:3} },
      { id:"gallbladder",        label:"Gallbladder disease (current, symptomatic)",                         mec:{coc:3,pop:2,patch:3,ring:3,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"cholestasis_ocp",    label:"History of OCP-related cholestasis",                                 mec:{coc:3,pop:2,patch:3,ring:3,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
    ],
  },
  {
    category: "Hematologic",
    conditions: [
      { id:"sickle_cell",    label:"Sickle cell disease",                          mec:{coc:2,pop:1,patch:2,ring:2,dmpa:1,cu_iud:2,lng_iud:1,implant:1} },
      { id:"thalassemia",    label:"Thalassemia",                                  mec:{coc:1,pop:1,patch:1,ring:1,dmpa:1,cu_iud:2,lng_iud:1,implant:1} },
      { id:"iron_deficiency",label:"Iron deficiency anemia",                       mec:{coc:1,pop:1,patch:1,ring:1,dmpa:1,cu_iud:2,lng_iud:1,implant:1} },
      { id:"itp",            label:"Idiopathic thrombocytopenic purpura (ITP)",    mec:{coc:1,pop:1,patch:1,ring:1,dmpa:2,cu_iud:2,lng_iud:2,implant:1} },
    ],
  },
  {
    category: "Endocrine",
    conditions: [
      { id:"diabetes_uncomplicated", label:"Diabetes without complications",                                mec:{coc:2,pop:2,patch:2,ring:2,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"diabetes_complicated",   label:"Diabetes with complications (nephropathy, retinopathy, neuropathy, or cardiovascular disease)", mec:{coc:3,pop:2,patch:3,ring:3,dmpa:3,cu_iud:1,lng_iud:2,implant:2} },
    ],
  },
  {
    category: "Other",
    conditions: [
      { id:"sle_apls",         label:"SLE with positive antiphospholipid antibodies",             mec:{coc:4,pop:3,patch:4,ring:4,dmpa:3,cu_iud:2,lng_iud:2,implant:2} },
      { id:"sle_no_apls",      label:"SLE without antiphospholipid antibodies",                   mec:{coc:2,pop:2,patch:2,ring:2,dmpa:2,cu_iud:2,lng_iud:2,implant:2} },
      { id:"hiv_art",          label:"HIV (on ART, well-controlled)",                             mec:{coc:1,pop:1,patch:1,ring:1,dmpa:2,cu_iud:1,lng_iud:1,implant:1} },
      { id:"ra_immunosup",     label:"Rheumatoid arthritis (on immunosuppressives)",              mec:{coc:2,pop:2,patch:2,ring:2,dmpa:2,cu_iud:1,lng_iud:2,implant:2} },
      { id:"crohns",           label:"Crohn's disease or malabsorptive bowel condition",          mec:{coc:3,pop:1,patch:1,ring:1,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"bariatric",        label:"Bariatric surgery (malabsorptive procedure)",               mec:{coc:3,pop:2,patch:1,ring:1,dmpa:1,cu_iud:1,lng_iud:1,implant:1} },
      { id:"rifampin",         label:"Rifampin or rifabutin therapy",                             mec:{coc:3,pop:3,patch:3,ring:3,dmpa:1,cu_iud:1,lng_iud:1,implant:2} },
      { id:"depression",       label:"Depression",                                                mec:{coc:1,pop:1,patch:1,ring:1,dmpa:2,cu_iud:1,lng_iud:1,implant:1} },
    ],
  },
];

const QS_CRITERIA = [
  "≤7 days from start of menses, miscarriage, or abortion",
  "No intercourse since last normal menses",
  "Correctly and consistently using reliable contraception",
  "<4 weeks postpartum",
  "Exclusively or nearly exclusively breastfeeding, <6 months postpartum, and amenorrheic",
];

function getMethodsForGroup(groupId, estrogenCi) {
  if (groupId === "pill") {
    const out = [];
    if (estrogenCi !== "yes") out.push(METHODS.find(m => m.id === "pills-combined"));
    out.push(METHODS.find(m => m.id === "pills-pop-rx"));
    out.push(METHODS.find(m => m.id === "pills-pop-otc"));
    return out;
  }
  const idMap = { patch: "patch", ring: "ring", injectable: "injectable" };
  return [METHODS.find(m => m.id === idMap[groupId])];
}

function AvailBadge({ avail }) {
  if (avail === "in-ED")  return <RiskBand level="low">Available in ED</RiskBand>;
  if (avail === "OTC")    return <RiskBand level="info">Over the counter</RiskBand>;
  if (avail === "refer")  return <RiskBand level="mod">Refer to OB/GYN</RiskBand>;
  return <span className="avail-rx">Prescription required</span>;
}

function MethodSubCard({ m, institutionId, onSelect, isSelected }) {
  const [copied, setCopied] = useState(false);

  const copyText = [
    `Drug: ${m.drugName}`,
    `Route: ${m.route}`,
    `Dose: ${m.dose}`,
    m.qty    !== "—" ? `Quantity: ${m.qty}`   : null,
    m.refills !== "—" ? `Refills: ${m.refills}` : null,
  ].filter(Boolean).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="method-sub-card">
      <div className="method-sub-card__hd">
        <span className="method-sub-card__name">{m.name}</span>
        <AvailBadge avail={m.avail} />
      </div>

      <div>
        <div className="method-sub-card__field"><strong>Drug:</strong> {m.drugName}</div>
        <div className="method-sub-card__field"><strong>Route:</strong> {m.route}</div>
        <div className="method-sub-card__field"><strong>Dose:</strong> {m.dose}</div>
        {m.qty    !== "—" && <div className="method-sub-card__field"><strong>Quantity to dispense:</strong> {m.qty} <span style={{ fontSize: "11px", color: "var(--yk-ink-500)" }}>(total units written on the Rx)</span></div>}
        {m.refills !== "—" && <div className="method-sub-card__field"><strong>Number of refills:</strong> {m.refills} <span style={{ fontSize: "11px", color: "var(--yk-ink-500)" }}>(times patient can refill without a new Rx)</span></div>}
        {m.refills !== "—" && m.refills !== "OTC" && (
          <div style={{ fontSize: "11px", color: "var(--yk-ink-500)", marginTop: "2px", paddingLeft: "2px" }}>
            Defaults set for 12-month coverage within standard insurance limits.
          </div>
        )}
        {m.id === "injectable" && m.generalDetail && (
          <div className="method-sub-card__field" style={{ marginTop: "6px", color: "var(--yk-ink-600)" }}>
            {m.generalDetail}
          </div>
        )}
        {m.providerNote && (
          <div className="method-sub-card__field" style={{ marginTop: "6px", color: "var(--yk-ink-600)" }}>
            <strong>Provider note:</strong> {m.providerNote}
          </div>
        )}
      </div>

      <div className="method-sub-card__actions">
        {m.goodrx && (
          <a href={m.goodrx} target="_blank" rel="noreferrer" className="method-sub-card__goodrx">
            GoodRx pricing ↗
          </a>
        )}
        {m.avail !== "refer" && (
          <button
            className={`method-sub-card__copy${copied ? " method-sub-card__copy--done" : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "Copy Rx details"}
          </button>
        )}
      </div>

      {m.patientInstructions && (
        <details style={{ marginTop: "10px" }}>
          <summary style={{ fontSize: "12px", color: "var(--yk-ink-500)", cursor: "pointer" }}>
            Patient instructions &amp; efficacy (expand)
          </summary>
          <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--yk-ink-600)", lineHeight: "1.6" }}>
            {m.patientInstructions}
          </div>
        </details>
      )}

      {m.sideEffects && m.sideEffects.length > 0 && (
        <details style={{ marginTop: "8px" }}>
          <summary style={{ fontSize: "12px", color: "var(--yk-ink-500)", cursor: "pointer" }}>
            Side effects (expand)
          </summary>
          <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "12px", color: "var(--yk-ink-600)", lineHeight: "1.7" }}>
            {m.sideEffects.map((se, i) => <li key={i}>{se}</li>)}
          </ul>
        </details>
      )}

      {onSelect && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--yk-ink-100, #f0f0f0)" }}>
          <button
            onClick={onSelect}
            style={{
              appearance: "none", cursor: "pointer", fontFamily: "inherit", width: "100%",
              padding: "9px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700,
              background: isSelected ? "#10B981" : "var(--yk-sage-500)",
              color: "white", border: "none",
              transition: "background 0.15s",
            }}
          >
            {isSelected ? "✓ Method selected" : "Select this method"}
          </button>
        </div>
      )}
    </div>
  );
}

function ClinicCard({ clinic: c }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const parts = [`Referral: ${c.name}`];
    if (c.address) parts.push(c.address);
    if (c.phone) parts.push(c.phone);
    const text = parts.join(", ") + ". Recommended follow-up: OB/GYN or family planning clinic within 1-2 weeks.";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="clinic-card">
      <div className="clinic-card__name">{c.name}</div>
      {c.address && <div className="clinic-card__addr">{c.address}</div>}
      {c.phone && <div className="clinic-card__tel">{c.phone}</div>}
      <div className="clinic-card__hours">
        {c.hours && c.hours.length > 0
          ? c.hours.map((line, i) => <div key={i}>{line}</div>)
          : "Hours not available."}
      </div>
      <button
        className={`method-sub-card__copy${copied ? " method-sub-card__copy--done" : ""}`}
        onClick={handleCopy}
      >
        {copied ? "✓ Copied" : "Copy clinic info"}
      </button>
    </div>
  );
}

function ClinicFinder() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    if (!zip.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/places/clinics?zip=${encodeURIComponent(zip.trim())}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setResults(data.clinics ?? []);
    } catch {
      setError("Could not load clinic results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clinic-finder">
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "6px" }}>
        Nearby Clinics
      </div>
      <div className="clinic-finder__form">
        <input
          className="clinic-finder__input"
          placeholder="Enter patient zip code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          maxLength={10}
        />
        <button
          className="clinic-finder__btn"
          onClick={handleSearch}
          disabled={loading || !zip.trim()}
        >
          {loading ? "Searching…" : "Search nearby clinics"}
        </button>
      </div>
      {error && (
        <div className="clinic-finder__status clinic-finder__status--error">{error}</div>
      )}
      {results !== null && results.length === 0 && (
        <div className="clinic-finder__status">No clinics found for this zip code.</div>
      )}
      {results && results.map((c, i) => (
        <ClinicCard key={i} clinic={c} />
      ))}
    </div>
  );
}

function MecBadge({ value }) {
  if (value === 4) return <span className="mec-badge mec-badge--4">Unacceptable health risk</span>;
  return <span className="mec-badge mec-badge--3">Risks usually outweigh advantages</span>;
}

function NonLarcMecSummary({ conditions, methodKey, label }) {
  if (!methodKey) return null;
  const flagged = conditions.filter(c => c.mec[methodKey] >= 3);
  const prefix = label ? `${label}: ` : "";
  if (flagged.length === 0) return (
    <div className="mec-summary mec-summary--ok">{prefix}No contraindications</div>
  );
  const hasCI = flagged.some(c => c.mec[methodKey] >= 4);
  return (
    <div className={`mec-summary mec-summary--${hasCI ? "ci" : "caution"}`}>
      {prefix}{hasCI ? "Unacceptable health risk (method not to be used)" : "Theoretical or proven risks usually outweigh the advantages"} — {flagged.map(c => c.label).join("; ")}
    </div>
  );
}

function LarcMecSummary({ conditions }) {
  const larcKeys = ["cu_iud", "lng_iud", "implant"];
  return (
    <div style={{ marginTop: "8px", fontSize: "12px" }}>
      {larcKeys.map(k => {
        const flagged = conditions.filter(c => c.mec[k] >= 3);
        const hasCI = flagged.some(c => c.mec[k] >= 4);
        return (
          <div key={k} style={{ marginBottom: "4px" }}>
            <strong>{MEC_METHOD_LABELS[k]}</strong>:{" "}
            {flagged.length === 0
              ? <span style={{ color: "var(--yk-ok-700)" }}>No contraindications</span>
              : <span style={{ color: hasCI ? "var(--yk-ci-700)" : "var(--yk-warn-700)" }}>
                  {hasCI ? "Contraindicated" : "Caution"} — {flagged.map(c => c.label).join("; ")}
                </span>
            }
          </div>
        );
      })}
    </div>
  );
}

function CollapsedBar({ num, headline, detail, onEdit }) {
  return (
    <div
      onClick={onEdit}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        background: "var(--yk-sage-50, #F0FDF4)", border: "1px solid var(--yk-sage-300, #86EFAC)",
        borderRadius: "10px", padding: "14px 18px", margin: "12px 0", cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{
          width: 26, height: 26, borderRadius: "50%", background: "#10B981",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: "white", fontSize: "14px", lineHeight: 1 }}>✓</span>
        </span>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--yk-sage-700, #166534)" }}>
          {num}: {headline}
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

export default function ContraceptionPathway({ state, setState, onAsk, institutionId, onSwitchTab }) {
  const s = state;
  const set = (k, v) => setState(prev => ({ ...prev, [k]: v }));
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [ecOpen, setEcOpen] = useState(true);
  const [ciOpen, setCiOpen] = useState(true);
  const [sec1Done, setSec1Done] = useState(false);
  const [sec3Done, setSec3Done] = useState(false);
  const [secPregDone, setSecPregDone] = useState(false);
  const [sec4Done, setSec4Done] = useState(false);
  const [selectedSpecificMethod, setSelectedSpecificMethod] = useState(null);
  const [selectedECMethod, setSelectedECMethod] = useState(null);
  const [dcCopied, setDcCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [pregTest, setPregTest] = useState(null);
  const [qsCriteria, setQsCriteria] = useState([false, false, false, false, false]);
  const anyQsMet = qsCriteria.some(Boolean);
  const toggleQs = (i) => setQsCriteria(prev => prev.map((v, idx) => idx === i ? !v : v));
  const pregnantConfirmed = pregTest === "positive";
  const [mecChecked, setMecChecked] = useState(new Set());
  const toggleMec = (id) => setMecChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allConditions = MEC_CONDITIONS.flatMap(g => g.conditions);
  const checkedConditionList = allConditions.filter(c => mecChecked.has(c.id));
  const estrogenCi = checkedConditionList.some(
    c => c.mec.coc >= 4 || c.mec.patch >= 4 || c.mec.ring >= 4
  ) ? "yes" : "no";

  function isMethodSafe(groupId) {
    if (checkedConditionList.length === 0) return true;
    const ok = (key) => checkedConditionList.every(c => c.mec[key] < 4);
    if (groupId === "pill")       return ok("pop");
    if (groupId === "patch")      return ok("patch");
    if (groupId === "ring")       return ok("ring");
    if (groupId === "injectable") return ok("dmpa");
    if (groupId === "larc")       return ["cu_iud", "lng_iud", "implant"].some(k => ok(k));
    return true;
  }

  /* ---- EC recommendation logic ---- */
  let ecPrimary = "Awaiting input";
  let ecDetail = null;
  let ecBand = null;
  let ecUsedElla = false;

  if (s.cxUps !== "yes") {
    ecPrimary = "No Emergency Contraception indicated";
  } else if (s.cxTimeUps === "gt120") {
    ecPrimary = "Emergency Contraception pills less effective beyond 120 hours";
    ecBand = <RiskBand level="mod">Refer for copper IUD</RiskBand>;
    ecDetail = "Copper IUD is most effective EC option — not placed in this ED, refer to OB/GYN.";
  } else if (s.cxTimeUps === "b73to120") {
    ecPrimary = "Ella (ulipristal 30mg PO ×1)";
    ecBand = <RiskBand level="info">Rx required</RiskBand>;
    ecDetail = "Recommend waiting 5 days after Ella before starting hormonal contraception.";
    ecUsedElla = true;
  } else if (s.cxTimeUps === "le72" && s.cxWantsSameDayHormonal === "yes") {
    ecPrimary = "Plan B (levonorgestrel 1.5mg PO ×1)";
    ecBand = <RiskBand level="low">Start today</RiskBand>;
    ecDetail = "Patient may initiate hormonal contraception immediately.";
  } else if (s.cxTimeUps === "le72" && s.cxWantsSameDayHormonal === "no") {
    ecPrimary = "Ella preferred (ulipristal 30mg PO ×1)";
    ecBand = <RiskBand level="info">Rx required</RiskBand>;
    ecDetail = "Recommend waiting 5 days after Ella before starting hormonal contraception.";
    ecUsedElla = true;
  }

  const sec1EligibilityOk = s.cxPregnancyIntention != null;
  const sec3EligibilityOk = s.cxUps != null;
  const secPregEligibilityOk = pregTest != null;
  const sec4EligibilityOk = selectedSpecificMethod != null || selectedMethod === "larc";

  const cxDoneCount = (secPregDone ? 1 : 0) + (sec1Done ? 1 : 0) + (sec3Done ? 1 : 0) + (sec4Done ? 1 : 0);
  const cxCurrentStep = !secPregDone ? 1 : !sec1Done ? 2 : !sec3Done ? 3 : !sec4Done ? 4 : 5;
  const cxStepLabels = ["Pregnancy Test", "Pregnancy Intention", "Emergency Contraception", "Same-day Contraception", "Final Medications"];
  const cxCurrentLabel = cxStepLabels[cxCurrentStep - 1];

  const MarkDoneBar = ({ eligibilityOk, done, onDone }) => {
    if (done || !eligibilityOk) return null;
    return (
      <div style={{
        borderTop: "1px solid var(--yk-ink-100, #f3f4f6)", padding: "8px 16px",
        background: "var(--yk-sage-50, #F0FDF4)", display: "flex", justifyContent: "flex-end",
      }}>
        <button onClick={onDone} style={{
          appearance: "none", cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "9px 20px", borderRadius: "6px",
          background: "var(--yk-sage-500)", border: "none",
          fontSize: "13px", fontWeight: 700, color: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
            <path d="M4 7l2.2 2.2L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mark section done
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Mobile step indicator */}
      {isMobile && (
        <div className="cx-mobile-progress">
          <div className="cx-mobile-progress__bar">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`cx-mobile-progress__dot${n === cxCurrentStep ? ' cx-mobile-progress__dot--active' : ''}${n < cxCurrentStep ? ' cx-mobile-progress__dot--done' : ''}`} />
            ))}
          </div>
          <div className="cx-mobile-progress__label">{cxCurrentStep < 5 ? `Step ${cxCurrentStep} of 4 — ${cxCurrentLabel}` : 'Final Medications'}</div>
        </div>
      )}

      {/* Step 1 — Pregnancy Test */}
      {(!isMobile && secPregDone) ? (
        <CollapsedBar
          num="Step 1"
          headline="Pregnancy Test"
          detail={pregTest === "positive" ? "Positive" : pregTest === "negative" ? "Negative" : pregTest === "notdone" ? "Not done" : null}
          onEdit={() => setSecPregDone(false)}
        />
      ) : (isMobile && cxCurrentStep !== 1) ? null : (
      <Section
        num=""
        title="Step 1: Pregnancy Test"
        sub="Required before initiating hormonal contraception."
        footer={<MarkDoneBar eligibilityOk={secPregEligibilityOk} done={secPregDone} onDone={() => setSecPregDone(true)} />}
      >
        <div style={{ padding: "16px 20px 4px" }}>
          <div style={{ padding: "4px 0 8px" }}>
            <Segmented
              value={pregTest}
              onChange={setPregTest}
              options={[
                { value: "positive", label: "Positive" },
                { value: "negative", label: "Negative" },
                { value: "notdone",  label: "Not done"  },
              ]}
            />
          </div>
          {pregTest === "positive" && (
            <div style={{ margin: "0 0 0.75rem", padding: "14px 16px", borderRadius: "8px", background: "var(--yk-ink-50, #f9fafb)", border: "1px solid var(--yk-ink-150, #e5e5e5)" }}>
              <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--yk-ink-800)", marginBottom: "10px" }}>Pregnancy confirmed — options counseling required</div>
              <div style={{ fontSize: "12.5px", color: "var(--yk-ink-600)", marginBottom: "10px" }}>What is the patient's pregnancy intention?</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Desired","Undecided","Undesired"].map(label => {
                  const val = label.toLowerCase();
                  return <button key={val} onClick={() => set("cxPregnancyIntention", val)} style={{ appearance: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, background: s.cxPregnancyIntention === val ? "#10B981" : "white", color: s.cxPregnancyIntention === val ? "white" : "#374151", border: "1.5px solid #D1D5DB" }}>{label}</button>;
                })}
              </div>
              {s.cxPregnancyIntention === "undesired" && onSwitchTab && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--yk-ink-150)" }}>
                  <button onClick={() => onSwitchTab("med-abortion")} style={{ appearance: "none", padding: "9px 18px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 700, background: "var(--yk-sage-500)", color: "white", border: "none" }}>Go to Medication Abortion pathway →</button>
                </div>
              )}
              {(s.cxPregnancyIntention === "desired" || s.cxPregnancyIntention === "undecided") && (
                <div style={{ marginTop: "10px", fontSize: "12.5px", color: "var(--yk-ink-600)" }}>Refer to OB/GYN. Offer prenatal vitamins. Contraception initiation not indicated at this time.</div>
              )}
            </div>
          )}
        </div>
      </Section>
      )}

      {/* Step 2 — Pregnancy Intention */}
      {(!isMobile && sec1Done) ? (
        <CollapsedBar
          num="Step 2"
          headline="Pregnancy Intention"
          detail={s.cxPregnancyIntention === "undecided" ? "Yes / Undecided" : s.cxPregnancyIntention === "no" ? "No" : null}
          onEdit={() => setSec1Done(false)}
        />
      ) : (isMobile && cxCurrentStep !== 2) ? null : (
      <Section
        num=""
        title="Step 2: Pregnancy Intention"
        sub="Guides whether to focus on EC, contraception initiation, or both."
        footer={<MarkDoneBar eligibilityOk={sec1EligibilityOk} done={sec1Done} onDone={() => setSec1Done(true)} />}
      >
        <Row
          label="Interested in pregnancy in the next year?"
          control={
            <Segmented
              value={s.cxPregnancyIntention}
              onChange={(v) => set("cxPregnancyIntention", v)}
              options={[
                { value: "undecided", label: "Yes / Undecided" },
                { value: "no",        label: "No" },
              ]}
            />
          }
        />
        {s.cxPregnancyIntention === "undecided" && (
          <div className="alert alert--sage" style={{ margin: "0 0 0.75rem" }}>
            <div className="alert__body">
              <div className="alert__title">Offer prenatal vitamins. Refer to OB/GYN via patient navigation.</div>
            </div>
          </div>
        )}
      </Section>
      )}

      <div>


      {/* Section 3 — Emergency Contraception */}
      {(!isMobile && sec3Done) ? (
        <CollapsedBar
          num="Step 3"
          headline="Emergency Contraception"
          detail={s.cxUps === "no" ? "No EC indicated" : ecPrimary !== "Awaiting input" ? ecPrimary : null}
          onEdit={() => setSec3Done(false)}
        />
      ) : (isMobile && cxCurrentStep !== 3) ? null : (
      <Section
        num=""
        title="Step 3: Emergency Contraception"
        sub="Complete all rows when unprotected sex occurred in the last 5 days."
        citeIds={["fda-planb-2009", "fda-ella-2010"]}
        headerRight={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {sec3Done && <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>✓ Done</span>}
            <button className="hcg-toggle" onClick={() => setEcOpen(o => !o)} aria-expanded={ecOpen}>
              {ecOpen ? "− Hide" : "+ Show"}
            </button>
          </div>
        }
        footer={<MarkDoneBar eligibilityOk={sec3EligibilityOk} done={sec3Done} onDone={() => setSec3Done(true)} />}
      >
        {ecOpen && (
          <>
            <Row
              label="Unprotected sex in the last 5 days?"
              citeIds={["fda-planb-2009"]}
              control={
                <Segmented
                  value={s.cxUps}
                  onChange={(v) => set("cxUps", v)}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no",  label: "No" },
                  ]}
                />
              }
            />

            {s.cxUps === "no" && (
              <div className="alert alert--sage" style={{ margin: "0 0 0.75rem" }}>
                <div className="alert__body">
                  <div className="alert__title">No indication for emergency contraception.</div>
                </div>
              </div>
            )}

            <div style={s.cxUps !== "yes" ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
              <Row
                label="Time since unprotected sex"
                citeIds={["fda-planb-2009", "fda-ella-2010"]}
                control={
                  <Segmented
                    value={s.cxTimeUps}
                    onChange={(v) => set("cxTimeUps", v)}
                    options={[
                      { value: "le72",     label: "≤72 hrs" },
                      { value: "b73to120", label: "73–120 hrs" },
                      { value: "gt120",    label: ">120 hrs" },
                    ]}
                  />
                }
              />
              <Row
                label="Weight ≥75 kg?"
                hint="Reduces Plan B efficacy"
                citeIds={["fda-planb-2009"]}
                control={
                  <Segmented
                    value={s.cxWeightGe75}
                    onChange={(v) => set("cxWeightGe75", v)}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no",  label: "No" },
                    ]}
                  />
                }
              />
              <Row
                label="Wants to start hormonal contraception today?"
                control={
                  <Segmented
                    value={s.cxWantsSameDayHormonal}
                    onChange={(v) => set("cxWantsSameDayHormonal", v)}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no",  label: "No" },
                    ]}
                  />
                }
              />
            </div>

            {s.cxUps === "yes" && (
              <>
                <ResultBlock
                  label="Emergency Contraception recommendation"
                  primary={ecPrimary}
                  detail={ecDetail}
                  band={ecBand}
                />
                <div style={{ padding: "4px 16px 10px", fontSize: "12px", color: "var(--yk-ink-600)" }}>
                  Emergency Contraception pills have no medical contraindications and do not cause abortion or birth defects.{" "}
                  <Cite ids={["fda-planb-2009", "fda-ella-2010"]} />
                </div>
                {ecPrimary !== "Awaiting input" && ecPrimary !== "No Emergency Contraception indicated" && (
                  <div style={{ padding: "0 16px 12px" }}>
                    <button
                      onClick={() => setSelectedECMethod(selectedECMethod === ecPrimary ? null : ecPrimary)}
                      style={{
                        appearance: "none", cursor: "pointer", fontFamily: "inherit", width: "100%",
                        padding: "9px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700,
                        background: selectedECMethod === ecPrimary ? "#10B981" : "var(--yk-sage-500)",
                        color: "white", border: "none", transition: "background 0.15s",
                      }}
                    >
                      {selectedECMethod === ecPrimary ? "✓ EC method selected" : "Select this method"}
                    </button>
                  </div>
                )}
                {s.cxTimeUps === "gt120" && (
                  <ClinicFinder />
                )}
              </>
            )}
          </>
        )}
      </Section>
      )}

      {/* ─── Section 4: Same-day Contraception Initiation & Method Selection ─── */}
      {(!isMobile && sec4Done) ? (
        <CollapsedBar
          num="Step 4"
          headline="Same-day Contraception Initiation & Method Selection"
          detail={selectedSpecificMethod ? METHODS.find(m => m.id === selectedSpecificMethod)?.name : selectedMethod === "larc" ? "LARC (referral)" : null}
          onEdit={() => setSec4Done(false)}
        />
      ) : (isMobile && cxCurrentStep !== 4) ? null : (
      <Section
        num=""
        title="Step 4: Same-day Contraception Initiation & Method Selection"
        sub="ACCESS-Bridge criteria guide same-day initiation eligibility."
        citeIds={["acog-206-2019", "cdc-mec-2024"]}
        headerRight={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {sec4Done && <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>✓ Done</span>}
            <button className="hcg-toggle" onClick={() => setCiOpen(o => !o)} aria-expanded={ciOpen}>
              {ciOpen ? "− Hide" : "+ Show"}
            </button>
          </div>
        }
        footer={<MarkDoneBar eligibilityOk={sec4EligibilityOk} done={sec4Done} onDone={() => setSec4Done(true)} />}
      >
        {ciOpen && (
          <>
            {pregTest !== null && pregTest !== "positive" && (
              <>
                {/* ─── STEP 1 box ─── */}
                <div style={{ border: "1px solid var(--yk-border, #dde5e0)", borderRadius: "8px", margin: "0 0 10px" }}>
                  <div className="ci-step-label">Part A — Quick start eligibility</div>
                  {QS_CRITERIA.map((text, i) => (
                    <label key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start",
                      marginBottom: "8px", cursor: "pointer", fontSize: "12.5px",
                      color: "var(--yk-ink-700)", lineHeight: "1.5", padding: "0 16px" }}>
                      <input type="checkbox" checked={qsCriteria[i]} onChange={() => toggleQs(i)}
                        style={{ marginTop: "2px", flexShrink: 0, accentColor: "var(--yk-sage-500)" }} />
                      {text}
                    </label>
                  ))}
                  {anyQsMet && (
                    <div style={{ margin: "4px 16px 10px", fontSize: "12.5px", color: "#166534", fontWeight: 500 }}>
                      ✓ Meets quick start criteria — may initiate today.
                    </div>
                  )}
                  {ecUsedElla && (
                    <div style={{ margin: "4px 16px 10px", fontSize: "12.5px", color: "#78350F" }}>
                      ⚠ Wait 5 days after Ella before starting hormonal contraception.
                    </div>
                  )}
                </div>

                {/* ─── STEP 2 box ─── */}
                <div style={{ border: "1px solid var(--yk-border, #dde5e0)", borderRadius: "8px", margin: "0 0 10px" }}>
                  <div className="ci-step-label">Part B — Medical history</div>
                  <div style={{ padding: "0 16px 8px", fontSize: "12px", color: "var(--yk-ink-600)" }}>
                    Check any conditions that apply. Only conditions that affect contraceptive safety are shown.{" "}
                    <a href="https://www.cdc.gov/contraception/media/pdfs/2024/07/us-mec-summary-chart-color-508.pdf" target="_blank" rel="noreferrer" style={{ color: "var(--yk-sage-700)" }}>
                      CDC US MEC 2024 ↗
                    </a>
                  </div>

                  {MEC_CONDITIONS.map(group => {
                    const relevant = group.conditions.filter(c => Object.values(c.mec).some(v => v >= 3));
                    if (relevant.length === 0) return null;
                    return (
                      <details key={group.category} className="mec-category">
                        <summary className="mec-category__hd">{group.category}</summary>
                        <div className="mec-category__body">
                          {relevant.map(cond => (
                            <label key={cond.id} className="mec-condition">
                              <input
                                type="checkbox"
                                checked={mecChecked.has(cond.id)}
                                onChange={() => toggleMec(cond.id)}
                                style={{ flexShrink: 0, accentColor: "var(--yk-sage-500)" }}
                              />
                              <span className="mec-condition__label">{cond.label}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    );
                  })}

                  {checkedConditionList.length > 0 && estrogenCi === "yes" && (
                    <div style={{ padding: "8px 16px", fontSize: "12px", color: "var(--yk-warn-700)" }}>
                      ⚠ Estrogen-containing methods (patch, ring, combined pill) are contraindicated by selected conditions.
                    </div>
                  )}
                </div>

                {/* ─── STEP 3 box ─── */}
                <div style={{ border: "1px solid var(--yk-border, #dde5e0)", borderRadius: "8px", margin: "0 0 10px" }}>
                  <div className="ci-step-label">Part C — Method selection &amp; prescribing</div>
                  <div style={{ padding: "0 16px 8px" }}>
                    {METHOD_GROUPS.filter(g => isMethodSafe(g.id)).map(g => {
                      const active = selectedMethod === g.id;
                      return (
                        <button
                          key={g.id}
                          className={`method-btn${active ? " method-btn--active" : selectedMethod !== null ? " method-btn--dim" : ""}`}
                          onClick={() => { setSelectedMethod(active ? null : g.id); setSelectedSpecificMethod(null); }}
                        >
                          <span>{g.label}</span>
                        </button>
                      );
                    })}
                    {METHOD_GROUPS.filter(g => !isMethodSafe(g.id)).length > 0 && (
                      <div style={{ fontSize: "11.5px", color: "var(--yk-ink-500)", marginTop: "6px" }}>
                        Some methods are not shown due to contraindications identified in Step 2.
                      </div>
                    )}
                  </div>

                  {selectedMethod !== null && (
                    <>
                      <div className="ci-step-label">Dosing &amp; prescription</div>
                      {selectedMethod === "larc" ? (
                        <div className="method-detail">
                          <div className="alert alert--sage" style={{ margin: 0 }}>
                            <div className="alert__body">
                              <div className="alert__title">Most effective method. Not placed in this ED.</div>
                              <div className="alert__detail">Refer to patient navigator for OB/GYN follow-up. Offer bridge prescription today.</div>
                            </div>
                          </div>
                          {checkedConditionList.length > 0 && <LarcMecSummary conditions={checkedConditionList} />}
                          {(() => { const larc = METHODS.find(m => m.id === "larc"); return larc?.patientInstructions ? (
                            <details style={{ marginTop: "10px" }}>
                              <summary style={{ fontSize: "12px", color: "var(--yk-ink-500)", cursor: "pointer" }}>
                                Patient instructions &amp; efficacy (expand)
                              </summary>
                              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--yk-ink-600)", lineHeight: "1.6" }}>
                                {larc.patientInstructions}
                              </div>
                            </details>
                          ) : null; })()}
                          <ClinicFinder />
                        </div>
                      ) : (
                        <div className="method-detail">
                          {getMethodsForGroup(selectedMethod, estrogenCi).map(m => (
                            <MethodSubCard
                              key={m.id} m={m} institutionId={institutionId}
                              isSelected={selectedSpecificMethod === m.id}
                              onSelect={() => setSelectedSpecificMethod(selectedSpecificMethod === m.id ? null : m.id)}
                            />
                          ))}
                          {checkedConditionList.length > 0 && (
                            selectedMethod === "pill" ? (
                              <>
                                {estrogenCi !== "yes" && (
                                  <NonLarcMecSummary conditions={checkedConditionList} methodKey="coc" label="Combined pill" />
                                )}
                                <NonLarcMecSummary conditions={checkedConditionList} methodKey="pop" label="Progestin-only pill" />
                              </>
                            ) : (
                              <NonLarcMecSummary
                                conditions={checkedConditionList}
                                methodKey={
                                  selectedMethod === "patch"      ? "patch" :
                                  selectedMethod === "ring"       ? "ring"  :
                                  selectedMethod === "injectable" ? "dmpa"  : null
                                }
                              />
                            )
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Progestin contraindications footnote */}
                <div className="disclaimer" style={{ margin: "8px 16px 4px", fontSize: "11.5px" }}>
                  &#9888; Progestin-only methods are also contraindicated in: breast cancer, liver disease or tumors, gastric bypass, and patients on antiepileptic drugs (AEDs). <Cite ids={["cdc-mec-2024", "acog-206-2019"]} />
                </div>

                {/* Footer protocol link */}
                <div className="disclaimer" style={{ marginTop: "12px" }}>
                  <a
                    href="https://bridgetotreatment.org/wp-content/uploads/ACCESS_BRIDGE_PROTOCOL_Quick_Start_Contraception-_Care_in_Any_Setting_June_2025.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ACCESS-Bridge Quick Start Protocol (June 2025)
                  </a>
                  {" "}<Cite ids={["access-bridge-2025"]} />
                </div>
              </>
            )}
          </>
        )}
      </Section>
      )}

      </div>{/* end pregnantConfirmed disable wrapper */}

      {/* ── Final medications summary ── */}
      {(selectedECMethod || selectedSpecificMethod || selectedMethod === "larc") && (!isMobile || cxCurrentStep === 5) && (
        <div style={{
          margin: "20px 0 80px", padding: "18px 20px",
          border: "1.5px solid var(--yk-sage-300)",
          borderTop: "3px solid var(--yk-sage-500)",
          borderRadius: "10px", background: "var(--yk-sage-100, #E6EBE5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <img src={logoUrl} alt="" style={{ width: "18px", height: "18px", objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--yk-ink-900)" }}>Final Medications</span>
          </div>
          {selectedECMethod && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--yk-ink-500)", marginBottom: "3px" }}>
                Emergency Contraception
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--yk-ink-900)" }}>{selectedECMethod}</div>
            </div>
          )}
          {(selectedSpecificMethod || selectedMethod === "larc") && (() => {
            const m = selectedSpecificMethod ? METHODS.find(x => x.id === selectedSpecificMethod) : null;
            return (
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--yk-ink-500)", marginBottom: "3px" }}>
                  Contraception
                </div>
                {m ? (
                  <>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--yk-ink-900)", marginBottom: "6px" }}>{m.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><strong>Drug:</strong> {m.drugName}</div>
                      <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><strong>Route:</strong> {m.route}</div>
                      <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><strong>Dose:</strong> {m.dose}</div>
                      {m.qty !== "—" && <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><strong>Quantity:</strong> {m.qty}</div>}
                      {m.refills !== "—" && <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)" }}><strong>Refills:</strong> {m.refills}</div>}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--yk-ink-900)" }}>LARC — refer to OB/GYN for placement</div>
                )}
              </div>
            );
          })()}

          {/* Discharge instructions */}
          {(() => {
            const m = selectedSpecificMethod ? METHODS.find(x => x.id === selectedSpecificMethod) : null;
            const ecInstructions = selectedECMethod?.includes("ulipristal") || selectedECMethod?.includes("Ella")
              ? "Take 1 tablet (30mg) as soon as possible. Do not use if you are already pregnant. If breastfeeding, pump and discard milk for 36 hours after taking. Your next period may be early or late — take a pregnancy test if your period is more than 1 week late. Common side effects: nausea, headache, dizziness, abdominal pain, fatigue."
              : selectedECMethod?.includes("levonorgestrel") || selectedECMethod?.includes("Plan B")
              ? "Take 1 tablet (1.5mg) as soon as possible. Your next period may be early or late — take a pregnancy test if your period is more than 1 week late. Common side effects: nausea, abdominal pain, fatigue, headache, dizziness, breast tenderness."
              : null;
            const contraInstructions = selectedMethod === "larc"
              ? "You have been referred to OB/GYN for LARC (IUD or implant) placement. Use condoms until your device is placed. Contact your OB/GYN office within the next few days to schedule your appointment."
              : m?.patientInstructions ?? null;
            const lines = [ecInstructions, contraInstructions].filter(Boolean);
            if (lines.length === 0) return null;
            const text = lines.join("\n\n");
            return (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--yk-sage-200)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-800)" }}>Discharge instructions</div>
                  <button onClick={() => { navigator.clipboard.writeText(text); setDcCopied(true); setTimeout(() => setDcCopied(false), 2000); }} style={{
                    appearance: "none", padding: "4px 12px", borderRadius: "6px", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "12px", fontWeight: 600,
                    background: dcCopied ? "#F0FDF4" : "white",
                    color: dcCopied ? "#166534" : "var(--yk-ink-600)",
                    border: `1px solid ${dcCopied ? "#86EFAC" : "var(--yk-ink-200)"}`,
                  }}>
                    {dcCopied ? "✓ Copied" : "⎘ Copy"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {ecInstructions && (
                    <div>
                      <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--yk-ink-500)", marginBottom: "4px" }}>Emergency contraception</div>
                      <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)", lineHeight: 1.6 }}>{ecInstructions}</div>
                    </div>
                  )}
                  {contraInstructions && (
                    <div>
                      {ecInstructions && <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--yk-ink-500)", marginBottom: "4px" }}>Same-day contraception</div>}
                      <div style={{ fontSize: "12.5px", color: "var(--yk-ink-700)", lineHeight: 1.6 }}>{contraInstructions}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "16px",
        }}>
          {isMobile && cxCurrentStep > 1 && (
            <button onClick={() => {
              if (cxCurrentStep === 5) setSec4Done(false);
              else if (cxCurrentStep === 4) setSec3Done(false);
              else if (cxCurrentStep === 3) setSec1Done(false);
              else if (cxCurrentStep === 2) setSecPregDone(false);
            }} style={{
              appearance: "none", background: "none", border: "1px solid var(--yk-ink-200)",
              borderRadius: "999px", padding: "7px 12px", fontSize: "12px", fontWeight: 600,
              color: "var(--yk-ink-600)", cursor: "pointer", flexShrink: 0,
            }}>← Back</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--yk-ink-800)" }}>
              {cxCurrentStep <= 4 ? `Step ${cxCurrentStep} of 4 — ${cxCurrentLabel}` : "Final Medications"}
            </div>
            <div style={{
              marginTop: "6px", height: "4px", width: "100%", maxWidth: "240px",
              background: "var(--yk-ink-150)", borderRadius: "2px", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${(cxDoneCount / 4) * 100}%`,
                background: "#10B981", transition: "width 0.35s ease",
              }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {onAsk && (
              <button onClick={() => onAsk()} style={{
                appearance: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 12px", borderRadius: "999px",
                background: "var(--yk-sage-500)", border: "none",
                fontSize: "12px", fontWeight: 600, color: "white", cursor: "pointer",
                flexShrink: 0,
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

    </>
  );
}
