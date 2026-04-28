// Yukti — main app shell
// Ported from design_handoff_yukti/design_files/components/App.jsx
// Adapted from window globals to ES module imports.

import React, { useState } from 'react';
import AskYukti from './components/AskYukti';
import EPLPathway from './components/EPLPathway';
import { REFS } from './data/refs';
import logoUrl from './assets/yukti-logo.png';

const TABS = [
  { id: "epl",          label: "Early Pregnancy Loss",  live: true  },
  { id: "pul",          label: "PUL / Ectopic",         live: false },
  { id: "med-abortion", label: "Medication Abortion",   live: false },
  { id: "contraception",label: "Contraception & EC",    live: false },
];

// Count locally-adapted refs — drives the banner badge
const LOCAL_ADAPTATION_COUNT = REFS.filter(r => r.local).length;

// Institution config — expand when more sites are onboarded
const INSTITUTIONS = {
  nypq:  { name: "NYP Queens",      loc: "Queens, NY",   initial: "N" },
  other: { name: "Other",           loc: "—",            initial: "?" },
};

export default function App() {
  const [tab, setTab] = useState("epl");
  const [institutionId, setInstitutionId] = useState("nypq");
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [showInstitutionPicker, setShowInstitutionPicker] = useState(false);

  // Patient / pathway state — matches EPLPathway field names exactly
  const [pathway, setPathway] = useState({
    gaWeeks: null,
    gaDays: null,
    rhStatus: null,
    hemoStatus: null,
    bleedSeverity: null,
    signsOfInfection: null,
    pocOs: null,
    // TVUS — orthogonal findings
    usIUPSeen: null,
    usCardiac: null,
    usCrlBand: null,
    usMsdBand: null,
    usSinceNoYS: null,
    usSinceWithYS: null,
    freeFluid: null,
    // hCG — collapsed by default
    hcgOpen: false,
    hcg: null,
    hcg48: null,
  });

  const askYukti = (q) => setPendingPrompt(q);
  const inst = INSTITUTIONS[institutionId] || INSTITUTIONS.nypq;

  return (
    <div className="app">

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo-badge">
            <img src={logoUrl} alt="Yukti" className="header__logo" />
          </div>
          <div className="header__title">yukti</div>
        </div>

        {/* Institution chip */}
        <div style={{ position: "relative" }}>
          <button
            className="institution"
            title="Change institution"
            onClick={() => setShowInstitutionPicker(v => !v)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="institution__name">{inst.name}</span>
            <span className="institution__loc">{inst.loc}</span>
            <svg className="institution__caret" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 4.5l3 3 3-3" />
            </svg>
          </button>

          {showInstitutionPicker && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "white", border: "1px solid var(--yk-sage-200)",
              borderRadius: "var(--yk-radius-lg)", boxShadow: "var(--yk-shadow-md)",
              minWidth: "180px", zIndex: 100, overflow: "hidden",
            }}>
              {Object.entries(INSTITUTIONS).map(([id, cfg]) => (
                <button
                  key={id}
                  onClick={() => { setInstitutionId(id); setShowInstitutionPicker(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "9px 14px", border: "none", background: "none",
                    fontSize: "13px", cursor: "pointer",
                    color: id === institutionId ? "var(--yk-sage-700)" : "var(--yk-ink-800)",
                    fontWeight: id === institutionId ? 600 : 400,
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--yk-sage-50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  {cfg.name}
                  <span style={{ marginLeft: 8, fontSize: 11, color: "var(--yk-ink-400)" }}>{cfg.loc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
      <main className="body">

        {/* Left — CDS column */}
        <div className="cds">
          <div className="cds__top">
            <div>
              <h1 className="cds__title">Early Pregnancy Loss</h1>
              <p className="cds__sub">First-trimester miscarriage — diagnosis, management, disposition.</p>
            </div>
          </div>

          {/* Local protocol banner */}
          <div className="local-banner">
            <span className="local-banner__left">
              <span className="local-banner__icon">{inst.initial}</span>
              <span>
                <span className="local-banner__name">{inst.name}</span>
                {" protocol · "}
                {LOCAL_ADAPTATION_COUNT} local adaptation{LOCAL_ADAPTATION_COUNT !== 1 ? "s" : ""}
              </span>
            </span>
            <button className="local-banner__link" onClick={() => {}}>View differences</button>
          </div>

          {tab === "epl" && (
            <EPLPathway state={pathway} setState={setPathway} onAsk={askYukti} />
          )}

          {/* References */}
          <section className="refs" id="references" aria-label="References">
            <h2 className="refs__hd">References</h2>
            <ol className="refs__list">
              {REFS.map((r) => (
                <li className="refs__item" id={`ref-${r.id}`} key={r.id}>
                  <span className="refs__title">{r.title}</span>
                  {" — "}
                  <span className="refs__src">{r.src}</span>
                  {" "}
                  <span className="refs__year">({r.year})</span>
                  {r.local && <span className="tag-local refs__local-tag">Local</span>}
                </li>
              ))}
            </ol>
          </section>

          <div className="disclaimer">
            For clinical decision support only · Not a substitute for clinical judgment ·
            Verify dosing and local protocol before administration.
          </div>
        </div>

        {/* Right — Ask Yukti rail */}
        <AskYukti
          context={pathway}
          pendingPrompt={pendingPrompt}
          onPromptConsumed={() => setPendingPrompt(null)}
        />
      </main>
    </div>
  );
}
