// Yukti — main app shell
// Ported from design_handoff_yukti/design_files/components/App.jsx
// Adapted from window globals to ES module imports.

import React, { useState, useEffect } from 'react';
import AskYukti from './components/AskYukti';
import EPLPathway from './components/EPLPathway';
import ContraceptionPathway from './components/ContraceptionPathway';
import MedicationAbortionPathway from './components/MedicationAbortionPathway';
import REMSPathway from './components/REMSPathway';
import PULEctopicTab from './components/PULEctopicTab';
import EntryPresentation from './components/EntryPresentation';
import { REFS } from './data/refs';
import logoUrl from './assets/yukti-logo.png';

const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DC", name: "District of Columbia" },
  { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" },
  { abbr: "ID", name: "Idaho" }, { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" },
  { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" },
  { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" },
  { abbr: "MS", name: "Mississippi" }, { abbr: "MO", name: "Missouri" },
  { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" },
  { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" },
  { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" },
  { abbr: "OK", name: "Oklahoma" }, { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" }, { abbr: "PR", name: "Puerto Rico" },
  { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

const TABS = [
  { id: "epl",          label: "Early Pregnancy Loss",               live: true },
  { id: "pul-ectopic",  label: "Pregnancy of Unknown Location & Ectopic", live: true },
  { id: "med-abortion", label: "Medication Abortion",                 live: true },
  { id: "contraception",label: "Contraception & Emergency Contraception", live: true },
  { id: "rems",         label: "REMS Certification",                  live: true },
];

// All tabs search the full knowledge base — no pathway filtering
const PATHWAY_MAP = {
  "epl":          "",
  "pul-ectopic":  "",
  "med-abortion": "",
  "contraception":"",
  "rems":         "",
};

// Refs that belong only to the contraception pathway — excluded from EPL ref list
const CX_REF_IDS = new Set(["acog-206-2019", "cdc-mec-2024", "fda-planb-2009", "fda-ella-2010", "access-bridge-2025"]);

// Count locally-adapted refs — drives the banner badge
const LOCAL_ADAPTATION_COUNT = REFS.filter(r => r.local).length;

const TAB_META = {
  epl: {
    title: "Early Pregnancy Loss",
    sub: null,
  },
  "med-abortion": {
    title: "Medication Abortion",
    sub: "Six-step guided workflow for medication abortion in the emergency department.",
  },
  contraception: {
    title: "Emergency Contraception & Contraception Initiation",
    sub: "EC eligibility, quick start criteria, and method selection.",
  },
  "pul-ectopic": {
    title: "Pregnancy of Unknown Location & Ectopic Pregnancy",
    sub: null,
  },
  rems: {
    title: "Mifepristone REMS Certification",
    sub: "Step-by-step guide to prescribing mifepristone · One-time enrollment",
  },
};

const INSTITUTIONS = {
  other: { name: "Other", loc: "—", initial: "?" },
};

export default function App() {
  const [entryDone,  setEntryDone]  = useState(() => sessionStorage.getItem('yk_entryDone') === 'true');
  const [entryState, setEntryState] = useState(() => sessionStorage.getItem('yk_entryState') || "");

  const [tab, setTab] = useState(sessionStorage.getItem('yukti-tab') || 'epl');
  const [institutionId, setInstitutionId] = useState(() => sessionStorage.getItem('yk_institutionId') || "other");
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  // Patient / pathway state — matches EPLPathway field names exactly
  const [pathway, setPathway] = useState({
    lmp: null,
    usGaWeeks: null,
    usGaDays: null,
    mxChoice: null,
    rhStatus: null,
    hemoStatus: null,
    bleedSeverity: null,
    signsOfInfection: null,
    pocOs: null,
    // TVUS — impression + orthogonal findings
    usImpression: null,
    usYolkSac: null,
    usCardiac: null,
    usCrl: null,
    usNoEmbryo: false,
    usCrlBand: null,
    usMsdBand: null,
    usMsd: null,
    usSinceNoYS: null,
    usSinceWithYS: null,
    freeFluid: null,
    gaOpen: false,
    examOpen: false,
    // hCG — collapsed by default
    hcgOpen: false,
    hcg: null,
    hcg48: null,
    rhOpen: false,
    // Contraception & EC (cx prefix)
    cxPregnancyIntention: null,
    cxUps: null,
    cxTimeUps: null,
    cxWeightGe75: null,
    cxQuickStartMet: null,
    cxWantsSameDayHormonal: null,
    cxEstrogenCi: null,
    // US report AI interpretation
    usReport: "",
    usInterpretation: null,
    remsConfirmed: false,
    remsSkipped: false,
    usImpressionUnverified: false,
  });

  const [legalStatus, setLegalStatus] = useState(null);

  useEffect(() => { sessionStorage.setItem('yk_entryDone', entryDone); }, [entryDone]);
  useEffect(() => { sessionStorage.setItem('yk_entryState', entryState); }, [entryState]);
  useEffect(() => { sessionStorage.setItem('yk_institutionId', institutionId); }, [institutionId]);
  useEffect(() => { sessionStorage.setItem('yukti-tab', tab); }, [tab]);

  // Fetch legal status whenever state changes (used by MedicationAbortionPathway)
  useEffect(() => {
    if (!entryState) { setLegalStatus(null); return; }
    fetch(`/api/abortion-status?state=${encodeURIComponent(entryState)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setLegalStatus(d))
      .catch(() => setLegalStatus(null));
  }, [entryState]);

  // Build enriched clinical context for Ask Yukti — adds derived conclusions
  const buildClinicalContext = () => {
    const s = pathway;
    const notes = [];

    // Gestational age
    const gaW = s.usGaWeeks != null ? s.usGaWeeks : null;
    const gaD = s.usGaDays != null ? s.usGaDays : 0;
    if (gaW != null) notes.push(`Gestational age: ${gaW}w ${gaD}d (by ${gaW != null ? "ultrasound" : "LMP"})`);

    // US impression
    if (s.usImpression) {
      const impLabel = { iup: "Intrauterine pregnancy", pul: "Pregnancy of unknown location / Indeterminate", ectopic: "Ectopic pregnancy", "definitive-epl": "Definitive EPL (selected)" }[s.usImpression] ?? s.usImpression;
      notes.push(`Ultrasound impression selected: ${impLabel}`);
    }

    // SRU 2013 criteria — derive EPL conclusion from measurements
    const crl = s.usCrl; const msd = s.usMsd; const cardiac = s.usCardiac;
    const noEmbryo = !!s.usNoEmbryo; const yolkSac = s.usYolkSac;

    if (crl != null && !noEmbryo) notes.push(`CRL: ${crl}mm`);
    if (msd != null) notes.push(`MSD: ${msd}mm`);
    if (cardiac) notes.push(`Cardiac activity: ${cardiac}`);
    if (yolkSac) notes.push(`Yolk sac: ${yolkSac}`);
    if (noEmbryo) notes.push("No embryo visualized");

    // Derive definitive EPL
    const derivedEPL = [];
    if (crl != null && crl >= 7 && cardiac === "absent" && !noEmbryo) derivedEPL.push(`CRL ${crl}mm without cardiac activity (≥7mm threshold met)`);
    if (msd != null && msd >= 25 && noEmbryo) derivedEPL.push(`MSD ${msd}mm without embryo (≥25mm threshold met)`);
    if (s.usSinceNoYS === "ge11d") derivedEPL.push("Gestational sac without yolk sac ≥11 days after first scan");
    if (s.usSinceWithYS === "ge11d") derivedEPL.push("Gestational sac with yolk sac without embryo ≥11 days after scan");

    if (derivedEPL.length > 0) {
      notes.push(`⚠ DERIVED CLINICAL CONCLUSION: DEFINITIVE EARLY PREGNANCY LOSS (SRU 2013 criteria met): ${derivedEPL.join("; ")}`);
    }

    // β-hCG
    if (s.hcg) notes.push(`β-hCG: ${Number(s.hcg).toLocaleString()} mIU/mL${s.hcg48 ? ` → ${Number(s.hcg48).toLocaleString()} mIU/mL at 48h` : ""}`);

    // Clinical status
    if (s.hemoStatus) notes.push(`Hemodynamic status: ${s.hemoStatus}`);
    if (s.mxChoice) notes.push(`Management selected: ${s.mxChoice}`);

    return notes.length > 0 ? { ...s, _clinicalSummary: notes.join("\n") } : s;
  };

  const activeRefs = (() => {
    if (tab === "epl") return REFS.filter(r => !CX_REF_IDS.has(r.id));
    if (tab === "contraception") {
      const ids = new Set(["fda-planb-2009", "fda-ella-2010", "access-bridge-2025", "cdc-mec-2024"]);
      if (pathway.cxEstrogenCi !== null) {
        ids.add("acog-206-2019");
      }
      return REFS.filter(r => ids.has(r.id));
    }
    if (tab === "med-abortion") {
      const ids = new Set(["acog-225-2020","acog-tubal-2018","smfm-rh-2024","goldberg-2022","schreiber-pregloss-2018","genbiopro-mifepristone-2023","rcog-gtg17","barnhart-2011-pul"]);
      return REFS.filter(r => ids.has(r.id));
    }
    if (tab === "rems") return [];
    return REFS;
  })();

  const askYukti = (q) => { setPendingPrompt(q); setRailOpen(true); };
  const inst = INSTITUTIONS[institutionId] || INSTITUTIONS.other;
  const selectedStateObj = US_STATES.find(s => s.abbr === entryState);
  const locationDisplay = selectedStateObj
    ? institutionId !== "other"
      ? `${selectedStateObj.name} · ${inst.name}`
      : selectedStateObj.name
    : null;

  // PROVISIONAL routing — pending clinical review
  // intention is the primary key; usImpression is the modifier
  function recommendPathway(intention, impression) {
    if (impression === "ectopic") {
      return { tab: "epl", urgent: true,
        reason: "Suspected ectopic — immediate evaluation required" };
    }
    if (impression === "pul") {
      return { tab: "pul-ectopic", urgent: false,
        reason: "Pregnancy of unknown location — ectopic must be excluded before further management" };
    }
    if (intention === "desired" && impression === "iup") {
      return { tab: "epl", urgent: false, type: "outpatient",
        reason: "IUP confirmed with desired pregnancy — outpatient OB follow-up and prenatal vitamins" };
    }
    if (intention === "undesired") {
      if (impression === "iup") {
        return { tab: "med-abortion", urgent: false,
          reason: "Undesired pregnancy — medication abortion pathway" };
      }
      if (impression === "definitive-epl") {
        return { tab: "epl", urgent: false,
          reason: "Pregnancy loss in progress — manage loss before further counseling" };
      }
    }
    return { tab: "epl", urgent: false,
      reason: intention === "undecided"
        ? "Evaluate and stabilize before counseling on options"
        : "Early pregnancy evaluation and management" };
  }

  function handlePresentation(impression, intention, tab) {
    setPathway(prev => ({
      ...prev,
      usImpression:           impression,
      usImpressionUnverified: true,
      cxPregnancyIntention:   intention,
    }));
    setTab(tab);
    setEntryDone(true);
  }

  // ── Entry screen ──────────────────────────────────────────────────────────
  if (!entryDone) {
    const directTabs = [
      { tab: "epl",           label: "Early Pregnancy Loss" },
      { tab: "pul-ectopic",   label: "Pregnancy of Unknown Location & Ectopic" },
      { tab: "med-abortion",  label: "Medication Abortion" },
      { tab: "contraception", label: "Contraception & Emergency Contraception" },
    ];
    return (
      <div className="entry">
        <div className="entry__content">
          <img src={logoUrl} alt="Yukti" className="entry__logo" />
          <div className="entry__wordmark">yukti</div>
          <p className="entry__tagline">Clinical decision support for reproductive health concerns in the ED</p>
          <EntryPresentation
            recommendPathway={recommendPathway}
            onConfirm={handlePresentation}
            onSkip={(tab) => { setTab(tab); setEntryDone(true); }}
            entryState={entryState}
            setEntryState={setEntryState}
            US_STATES={US_STATES}
            institutionId={institutionId}
            setInstitutionId={setInstitutionId}
          />
        </div>
        {/* Bottom pathway bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', borderTop: '1px solid rgba(0,0,0,0.12)',
          background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)',
        }}>
          {directTabs.map((t, i) => (
            <button
              key={t.tab}
              onClick={() => { setTab(t.tab); setEntryDone(true); }}
              style={{
                flex: 1, appearance: 'none', background: 'none',
                border: 'none', borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                padding: '11px 8px', fontFamily: 'inherit',
                fontSize: '12px', fontWeight: 500, color: 'var(--yk-ink-900)',
                cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="app">

      {/* ── HEADER ── */}
      <header className="header">
        <button className="header__brand" onClick={() => setEntryDone(false)} aria-label="Go to home screen">
          <img src={logoUrl} alt="Yukti" className="header__logo" />
          <div className="header__title">yukti</div>
        </button>

        {locationDisplay && (
          <div className="header__loc-wrap">
            <button
              className="header__location"
              onClick={() => setStatePickerOpen(o => !o)}
              aria-expanded={statePickerOpen}
            >
              {locationDisplay}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {statePickerOpen && (
              <>
                <div className="header__loc-backdrop" onClick={() => setStatePickerOpen(false)} />
                <div className="header__loc-dropdown">
                  <div className="header__loc-label">Change state</div>
                  <select
                    className="header__loc-select"
                    value={entryState}
                    autoFocus
                    onChange={e => {
                      setEntryState(e.target.value);
                      if (e.target.value !== "NY") {
                        setInstitutionId("other");
                        setStatePickerOpen(false);
                      }
                    }}
                  >
                    {US_STATES.map(s => (
                      <option key={s.abbr} value={s.abbr}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── TABS ── */}
      {/* Desktop tab bar */}
      <nav className="tabs tabs--desktop" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className="tab"
            onClick={() => t.live && setTab(t.id)}
            disabled={!t.live}
            style={!t.live ? { opacity: 0.55, cursor: "default" } : {}}
          >
            {t.label}
            {!t.live && <span className="tab__badge">Soon</span>}
          </button>
        ))}
      </nav>

      {/* Mobile tab dropdown */}
      <div className="tabs--mobile">
        <button className="tabs__mobile-trigger" onClick={() => setMobileTabOpen(o => !o)} aria-expanded={mobileTabOpen}>
          <span>{TABS.find(t => t.id === tab)?.label}</span>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {mobileTabOpen && (
          <>
            <div className="tabs__mobile-backdrop" onClick={() => setMobileTabOpen(false)} />
            <div className="tabs__mobile-menu">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`tabs__mobile-item${tab === t.id ? ' tabs__mobile-item--active' : ''}`}
                  onClick={() => { if (t.live) { setTab(t.id); setMobileTabOpen(false); } }}
                  disabled={!t.live}
                >
                  {t.label}
                  {!t.live && <span className="tab__badge">Soon</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── BODY ── */}
      <main className={`body${chatOpen ? " chat-open" : ""}${!railOpen ? " rail-collapsed" : ""}`}>

        {/* Left — CDS column */}
        <div className="cds">
          <div className="cds__top">
            <div>
              <h1 className="cds__title">{TAB_META[tab]?.title ?? TAB_META.epl.title}</h1>
              {(TAB_META[tab]?.sub) && <p className="cds__sub">{TAB_META[tab].sub}</p>}
            </div>
            {!railOpen && (
              <button className="chat-reopen" onClick={() => { setRailOpen(true); setHasUnread(false); }} aria-label="Open Ask Yukti">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Ask Yukti
                {hasUnread && <span className="chat-reopen__dot" />}
              </button>
            )}
          </div>


          {tab === "epl" && (
            <EPLPathway state={pathway} setState={setPathway} onAsk={askYukti} onSwitchTab={setTab} />
          )}

          {tab === "pul-ectopic" && (
            <PULEctopicTab onSwitchTab={setTab} entryState={entryState} legalStatus={legalStatus} />
          )}

          {tab === "med-abortion" && (
            <MedicationAbortionPathway
              selectedState={entryState}
              institutionId={institutionId}
              legalStatus={legalStatus}
              onSwitchTab={setTab}
              onAsk={askYukti}
            />
          )}

          {tab === "contraception" && (
            <ContraceptionPathway state={pathway} setState={setPathway} onAsk={askYukti} institutionId={institutionId} onSwitchTab={setTab} />
          )}

          {tab === "rems" && <REMSPathway entryState={entryState} legalStatus={legalStatus} />}

          {/* References — filtered to active tab/selections; hidden when no refs are active */}
          {activeRefs.length > 0 && <section className="refs" id="references" aria-label="References">
            <button className="refs__toggle" onClick={() => setRefsOpen(o => !o)} aria-expanded={refsOpen}>
              <h2 className="refs__hd">References</h2>
              <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ transform: refsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <ol className={`refs__list${refsOpen ? ' refs__list--open' : ''}`}>
              {activeRefs.map((r) => (
                <li className="refs__item" id={`ref-${r.id}`} key={r.id}>
                  <span className="refs__title">{r.title}</span>
                  {r.local && <span className="tag-local refs__local-tag">Local</span>}
                </li>
              ))}
            </ol>
          </section>}

          <div className="disclaimer">
            For clinical decision support only · Not a substitute for clinical judgment ·
            Verify dosing and local protocol before administration.
          </div>
        </div>

        {/* Right — Ask Yukti rail */}
        <AskYukti
          context={buildClinicalContext()}
          pathway={PATHWAY_MAP[tab] ?? tab}
          institution={institutionId}
          pendingPrompt={pendingPrompt}
          onPromptConsumed={() => setPendingPrompt(null)}
          onClose={() => { setChatOpen(false); setHasUnread(false); setRailOpen(false); }}
          onBotMessage={() => { if (!chatOpen) setHasUnread(true); }}
        />
      </main>
      {/* ── Mobile chat FAB (hidden on desktop via CSS) ── */}
      {chatOpen && <div className="chat-backdrop" onClick={() => { setChatOpen(false); setHasUnread(false); }} />}
      <button
        className="chat-fab"
        onClick={() => { setChatOpen(o => !o); setHasUnread(false); }}
        aria-label="Open Ask Yukti"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {hasUnread && <span className="chat-fab__dot" />}
      </button>
    </div>
  );
}
