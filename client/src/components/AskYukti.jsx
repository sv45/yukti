// Right rail — Ask Yukti chat panel.
// Ported from design_handoff_yukti/design_files/components/AskYukti.jsx
// Adapted from window globals to ES module. Mock answers used until RAG is wired.

import React, { useState, useRef, useEffect } from 'react';
import { REFS } from '../data/refs';

export default function AskYukti({ context, pendingPrompt, onPromptConsumed }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (pendingPrompt) {
      sendMessage(pendingPrompt);
      onPromptConsumed && onPromptConsumed();
    }
    // eslint-disable-next-line
  }, [pendingPrompt]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  const sendMessage = (text) => {
    if (!text || !text.trim()) return;
    const userMsg = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setBusy(true);
    setInput("");
    // Mock RAG response — replace with real API call when backend is wired.
    setTimeout(() => {
      const ans = mockAnswer(text, context);
      setMessages(prev => [...prev, { role: "bot", text: ans.text, sources: ans.sources }]);
      setBusy(false);
    }, 700);
  };

  const suggestions = [
    "Compare expectant vs medical management for this patient",
    "What's the local RhoGAM protocol?",
    "When is repeat hCG actually useful here?",
    "Red flags before discharge?",
  ];

  const gaDisplay = (context.gaWeeks != null || context.gaDays != null)
    ? `GA ${context.gaWeeks ?? 0}w${context.gaDays ?? 0}d`
    : "GA —";
  const rhDisplay = context.rhStatus
    ? `Rh ${context.rhStatus[0].toUpperCase()}`
    : "Rh —";
  const hemoDisplay = context.hemoStatus || "stable";

  return (
    <aside className="rail">
      <header className="rail__hd">
        <div className="rail__title">
          <span className="rail__title-dot" />
          Ask Yukti
        </div>
        <div className="rail__sub">Responses drawn only from approved guidelines</div>
      </header>

      {/* Active context bar */}
      <div className="rail__ctx">
        <span className="rail__ctx-key">Context</span>
        <span className="rail__ctx-val">
          {gaDisplay} · {rhDisplay} · {hemoDisplay}
        </span>
      </div>

      <div className="rail__body" ref={bodyRef}>
        {messages.length === 0 && !busy && (
          <div className="rail__empty">
            <div className="rail__empty-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            Ask a clinical question about the active pathway.
          </div>
        )}

        {messages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} className="msg msg--user">{m.text}</div>
          ) : (
            <div key={i} className="msg msg--bot">
              <div className="msg__hd">
                <span className="rail__title-dot" /> Yukti
              </div>
              <div>{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="msg__sources">
                  {m.sources.map(srcId => {
                    const idx = REFS.findIndex(r => r.id === srcId);
                    if (idx < 0) return null;
                    const ref = REFS[idx];
                    return (
                      <a
                        key={srcId}
                        href={`#ref-${srcId}`}
                        className="msg__chip"
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(`ref-${srcId}`);
                          if (el) {
                            const top = el.getBoundingClientRect().top + window.scrollY - 120;
                            window.scrollTo({ top, behavior: "smooth" });
                            el.classList.add("refs__item--target");
                            setTimeout(() => el.classList.remove("refs__item--target"), 1800);
                          }
                        }}
                      >
                        [{idx + 1}] {ref.src.split(",")[0]}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )
        ))}

        {busy && (
          <div className="msg msg--bot">
            <div className="msg__hd"><span className="rail__title-dot" /> Yukti</div>
            <div style={{ color: "var(--yk-ink-500)" }}>Searching approved guidelines…</div>
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="rail__suggestions">
          <div className="rail__suggest-label">Suggested</div>
          {suggestions.map(q => (
            <button key={q} className="suggest" onClick={() => sendMessage(q)}>{q}</button>
          ))}
        </div>
      )}

      <form className="rail__form" onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
        <div className="rail__inputwrap">
          <input
            className="rail__input"
            placeholder="Ask a clinical question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="rail__send" disabled={!input.trim()} aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>

      <div className="rail__foot">
        For clinical decision support only — not a substitute for clinical judgment.
      </div>
    </aside>
  );
}

// Mock answer generator — wires citations to ref ids.
// Replace with real RAG API call when backend is ready.
function mockAnswer(prompt, ctx) {
  const p = prompt.toLowerCase();
  if (p.includes("rhogam") || p.includes("rh ")) {
    return {
      text: `For an Rh(D)-negative patient with first-trimester bleeding or confirmed EPL, NYP Queens stocks 300mcg IM RhoGAM (the 50mcg mini-dose was discontinued 2024). Administer within 72 hours of bleeding onset. SMFM 2024 supports this dosing for any EPL ≥7 weeks GA.`,
      sources: ["smfm-rh-2024", "yukti-local-rh"],
    };
  }
  if (p.includes("expectant") || p.includes("medical") || p.includes("surgical")) {
    return {
      text: `All three management options are first-line for hemodynamically stable patients in the first trimester. Mifepristone 200mg PO followed 24–48h later by misoprostol 800mcg PV achieves complete expulsion in ~84% by day 8, vs ~67% with misoprostol alone (Schreiber NEJM 2018). Surgical aspiration is preferred for instability, infection, heavy bleeding, or patient preference for definitive management.`,
      sources: ["acog-200-2018", "schreiber-pregloss-2018", "rcog-gtg17"],
    };
  }
  if (p.includes("hcg") || p.includes("repeat")) {
    return {
      text: `A single β-hCG rarely diagnoses ectopic or EPL on its own. The 48h trend is more useful: a rise of ≥49% suggests a viable IUP, plateau or suboptimal rise raises concern for ectopic or failure, and a falling value is consistent with resolving EPL but does not exclude ectopic.`,
      sources: ["acog-200-2018", "acog-tubal-2018"],
    };
  }
  if (p.includes("sru") || p.includes("criteria") || p.includes("nonviab")) {
    return {
      text: `SRU 2013 (Doubilet et al.) criteria for definitive nonviability: CRL ≥7mm with no cardiac activity; mean sac diameter ≥25mm with no embryo; absence of embryo with heartbeat ≥2 weeks after a scan showed sac without yolk sac; or ≥11 days after a scan showed sac with yolk sac. Anything less is suggestive — repeat TVUS in 7–14 days.`,
      sources: ["doubilet-2013"],
    };
  }
  if (p.includes("red flag") || p.includes("discharge") || p.includes("return")) {
    return {
      text: `Discharge instructions should include: heavy bleeding (>2 pads/hr for 2h), fever >38°C, severe or worsening pelvic pain, syncope, or signs of infection. Confirm reliable phone access and OB/Gyn follow-up within 7 days. RhoGAM if Rh-negative; written misoprostol instructions if medical management.`,
      sources: ["acog-200-2018", "yukti-local-referral"],
    };
  }
  const gaStr = (ctx.gaWeeks != null || ctx.gaDays != null)
    ? `${ctx.gaWeeks ?? 0}w${ctx.gaDays ?? 0}d GA`
    : "GA pending";
  return {
    text: `Based on the active pathway: ${gaStr}, ${ctx.rhStatus || "Rh status unknown"}, ${ctx.hemoStatus || "stable"}. I can compare management options, walk through SRU criteria, surface the local RhoGAM protocol, or pull discharge red flags. Try one of the suggested questions.`,
    sources: ["acog-200-2018"],
  };
}
