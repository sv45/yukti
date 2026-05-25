// Right rail — Ask Yukti chat panel.

import React, { useState, useRef, useEffect } from 'react';

export default function AskYukti({ context, pathway, institution, pendingPrompt, onPromptConsumed, onClose, onBotMessage }) {
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

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;
    const userMsg = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setBusy(true);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          context: JSON.stringify(context),
          pathway: pathway || "",
          institution: institution || "",
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: data.response, sources: data.sources || [] }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Unable to reach the Yukti server. Ensure the backend is running on port 8000.",
        sources: [],
      }]);
    } finally {
      setBusy(false);
      onBotMessage && onBotMessage();
    }
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
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div className="rail__title">
            <span className="rail__title-dot" />
            Ask Yukti
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" style={{background:"none", border:"none", cursor:"pointer", padding:"4px 6px", color:"var(--yk-ink-500)", fontSize:"18px", lineHeight:1}}>✕</button>
          )}
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
                  {m.sources.map((src, i) => (
                    <span key={i} className="msg__chip" title={`Score: ${src.score != null ? (src.score * 100).toFixed(0) + "%" : "—"}`}>
                      {src.filename || src}
                    </span>
                  ))}
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

