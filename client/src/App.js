// Yukti — main app shell
// Ported from design_handoff_yukti/design_files/components/App.jsx
// Adapted from window globals to ES module imports.

import React, { useState, useEffect } from 'react';
import AskYukti from './components/AskYukti';
import EPLPathway from './components/EPLPathway';
import ContraceptionPathway from './components/ContraceptionPathway';
import MedicationAbortionPathway from './components/MedicationAbortionPathway';
import REMSPathway from './components/REMSPathway';
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
  { id: "epl",          label: "Early Pregnancy Loss",  live: true  },
  { id: "med-abortion", label: "Medication Abortion",   live: true  },
  { id: "contraception",label: "Contraception & Emergency Contraception",    live: true  },
  { id: "rems",         label: "REMS Certification",    live: true  },
];

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
    sub: null,
  },
  contraception: {
    title: "Emergency Contraception & Contraception Initiation",
    sub: "EC eligibility, quick start criteria, and method selection.",
  },
  rems: {
    title: "Mifepristone REMS Certification",
    sub: "Step-by-step guide to prescribing mifepristone · One-time enrollment",
  },
};

// Institution config — expand when more sites are onboarded
const INSTITUTIONS = {
  memorial: { name: "Memorial Hospital", loc: "",          initial: "M" },
  other: { name: "Other",           loc: "—",            initial: "?" },
};

export default function App() {
  const [entryDone, setEntryDone] = useState(() => sessionStorage.getItem('yk_entryDone') === 'true');
  const [entryState, setEntryState] = useState(() => sessionStorage.getItem('yk_entryState') || "");

  const [tab, setTab] = useState(sessionStorage.getItem('yukti-tab') || 'epl');
  const [institutionId, setInstitutionId] = useState(() => sessionStorage.getItem('yk_institutionId') || "other");
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  // Patient / pathway state — matches EPLPathway field names exactly
  const [pathway, setPathway] = useState({
    gaWeeks: null,
    gaDays: null,
    rhStatus: null,
    hemoStatus: null,
    bleedSeverity: null,
    signsOfInfection: null,
    pocOs: null,
    // TVUS — impression + orthogonal findings
    usImpression: null,
    usIUPSeen: null,
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

  const activeRefs = (() => {
    if (tab === "epl") return REFS.filter(r => !CX_REF_IDS.has(r.id));
    if (tab === "contraception") {
      const ids = new Set(["fda-planb-2009", "fda-ella-2010", "access-bridge-2025"]);
      if (pathway.cxEstrogenCi !== null) {
        ids.add("acog-206-2019");
        ids.add("cdc-mec-2024");
      }
      return REFS.filter(r => ids.has(r.id));
    }
    if (tab === "med-abortion") return [];
    if (tab === "rems") return [];
    return REFS;
  })();

  const askYukti = (q) => setPendingPrompt(q);
  const inst = INSTITUTIONS[institutionId] || INSTITUTIONS.memorial;
  const selectedStateObj = US_STATES.find(s => s.abbr === entryState);
  const locationDisplay = selectedStateObj
    ? institutionId !== "other"
      ? `${selectedStateObj.name} · ${inst.name}`
      : selectedStateObj.name
    : null;

  function handleEntry(instId) {
    setInstitutionId(instId);
    setEntryDone(true);
  }

  // ── Entry screen ──────────────────────────────────────────────────────────
  if (!entryDone) {
    return (
      <div className="entry">
        <div className="entry__content">
          <img src={logoUrl} alt="Yukti" className="entry__logo" />
          <div className="entry__wordmark">yukti</div>
          <p className="entry__tagline">Clinical decision support for reproductive health concerns in the ED</p>

          <div className="entry__form">
            <label className="entry__label" htmlFor="entry-state">Select your state</label>
            <select
              id="entry-state"
              className="entry__select"
              value={entryState}
              onChange={e => setEntryState(e.target.value)}
            >
              <option value="">— choose state —</option>
              {US_STATES.map(s => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </select>

            {entryState === "NY" && (
              <div className="entry__confirm">
                <p className="entry__confirm-q">Are you at Memorial Hospital?</p>
                <div className="entry__confirm-btns">
                  <button className="entry__btn entry__btn--primary" onClick={() => handleEntry("memorial")}>
                    Yes — Memorial Hospital
                  </button>
                  <button className="entry__btn entry__btn--ghost" onClick={() => handleEntry("other")}>
                    No, continue
                  </button>
                </div>
              </div>
            )}

            {entryState && entryState !== "NY" && (
              <button className="entry__btn entry__btn--primary" onClick={() => handleEntry("other")}>
                Continue
              </button>
            )}
          </div>
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
                  {entryState === "NY" && (
                    <div className="header__loc-inst">
                      <button
                        className={`header__loc-inst-btn${institutionId === "memorial" ? " header__loc-inst-btn--active" : ""}`}
                        onClick={() => { setInstitutionId("memorial"); setStatePickerOpen(false); }}
                      >Memorial Hospital</button>
                      <button
                        className={`header__loc-inst-btn${institutionId === "other" ? " header__loc-inst-btn--active" : ""}`}
                        onClick={() => { setInstitutionId("other"); setStatePickerOpen(false); }}
                      >Other</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── TABS ── */}
      <nav className="tabs" role="tablist">
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
              <button className="chat-reopen" onClick={() => setRailOpen(true)} aria-label="Open Ask Yukti">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Chat
              </button>
            )}
          </div>

          {/* Local protocol banner — only shown when a specific institution is confirmed */}
          {institutionId !== "other" && <div className="local-banner">
            <span className="local-banner__left">
              <span className="local-banner__icon">{inst.initial}</span>
              <span>
                <span className="local-banner__name">{inst.name}</span>
                {" protocol · "}
                {LOCAL_ADAPTATION_COUNT} local adaptation{LOCAL_ADAPTATION_COUNT !== 1 ? "s" : ""}
              </span>
            </span>
            <button className="local-banner__link" onClick={() => {}}>View differences</button>
          </div>}

          {tab === "epl" && (
            <EPLPathway state={pathway} setState={setPathway} onAsk={askYukti} onSwitchTab={setTab} />
          )}

          {tab === "med-abortion" && (
            <MedicationAbortionPathway
              selectedState={entryState}
              institutionId={institutionId}
              legalStatus={legalStatus}
            />
          )}

          {tab === "contraception" && (
            <ContraceptionPathway state={pathway} setState={setPathway} onAsk={askYukti} institutionId={institutionId} />
          )}

          {tab === "rems" && <REMSPathway entryState={entryState} legalStatus={legalStatus} />}

          {/* References — filtered to active tab/selections; hidden when no refs are active */}
          {activeRefs.length > 0 && <section className="refs" id="references" aria-label="References">
            <h2 className="refs__hd">References</h2>
            <ol className="refs__list">
              {activeRefs.map((r) => {
                const n = REFS.indexOf(r) + 1;
                return (
                  <li className="refs__item" id={`ref-${r.id}`} key={r.id}>
                    <span style={{ fontVariantNumeric: "tabular-nums", marginRight: "6px", color: "var(--yk-ink-400)", fontSize: "11px" }}>{n}.</span>
                    <span className="refs__title">{r.title}</span>
                    {" — "}
                    <span className="refs__src">{r.src}</span>
                    {" "}
                    <span className="refs__year">({r.year})</span>
                    {r.local && <span className="tag-local refs__local-tag">Local</span>}
                  </li>
                );
              })}
            </ol>
          </section>}

          <div className="disclaimer">
            For clinical decision support only · Not a substitute for clinical judgment ·
            Verify dosing and local protocol before administration.
          </div>
        </div>

        {/* Right — Ask Yukti rail */}
        <AskYukti
          context={pathway}
          pathway={tab}
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
