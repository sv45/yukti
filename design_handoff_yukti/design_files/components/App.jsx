// Yukti — main app shell

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TABS = [
  { id: "epl", label: "Early Pregnancy Loss", live: true },
  { id: "pul", label: "PUL / Ectopic", live: false },
  { id: "med-abortion", label: "Medication Abortion", live: false },
  { id: "contraception", label: "Contraception & EC", live: false },
];

function App() {
  const [tab, setTab] = useStateApp("epl");
  const [institution, setInstitution] = useStateApp("Memorial Regional ED");
  const [pendingPrompt, setPendingPrompt] = useStateApp(null);

  // Patient/pathway state
  const [pathway, setPathway] = useStateApp({
    gaWeeks: 8,
    gaDays: 1,
    rhStatus: "negative",
    hemoStatus: "stable",
    bleedSeverity: "moderate",
    signsOfInfection: "no",
    pocOs: "no",
    // TVUS — split into orthogonal findings
    usIUPSeen: "yes",
    usCardiac: "absent",
    usCrlBand: "ge7",
    usMsdBand: "none",
    usSinceNoYS: "none",
    usSinceWithYS: "none",
    freeFluid: "trace",
    // hCG — collapsed by default; provider opts in
    hcgOpen: false,
    hcg: null,
    hcg48: null,
  });

  const askYukti = (q) => setPendingPrompt(q);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo-badge">
            <img src="assets/yukti-logo.png" alt="Yukti" className="header__logo" />
          </div>
          <div className="header__title">yukti</div>
        </div>
        <button className="institution" title="Change institution / location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.7}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span className="institution__name">{institution}</span>
          <span className="institution__loc">Oakland, CA</span>
          <svg className="institution__caret" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4.5l3 3 3-3"/></svg>
        </button>
      </header>

      {/* TABS */}
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

      {/* BODY */}
      <main className="body">
        <div className="cds" data-screen-label="EPL Pathway">
          <div className="cds__top">
            <div>
              <h1 className="cds__title">Early Pregnancy Loss</h1>
              <p className="cds__sub">First-trimester miscarriage — diagnosis, management, disposition.</p>
            </div>
          </div>

          {/* Localization banner */}
          <div className="local-banner">
            <span className="local-banner__left">
              <span className="local-banner__icon">M</span>
              <span><span className="local-banner__name">Memorial Regional</span> protocol · 3 local adaptations</span>
            </span>
            <button className="local-banner__link">View differences</button>
          </div>

          {/* The pathway itself */}
          <EPLPathway state={pathway} setState={setPathway} onAsk={askYukti} />

          {/* References */}
          <section className="refs" id="references" aria-label="References">
            <h2 className="refs__hd">References</h2>
            <ol className="refs__list">
              {window.YK_REFS.map((r) => (
                <li className="refs__item" id={`ref-${r.id}`} key={r.id}>
                  <span className="refs__title">{r.title}</span>{" — "}
                  <span className="refs__src">{r.src}</span>{" "}
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

        {/* Right rail */}
        <AskYukti
          context={pathway}
          pendingPrompt={pendingPrompt}
          onPromptConsumed={() => setPendingPrompt(null)}
        />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
