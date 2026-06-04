// Right rail — Ask Yukti chat panel.

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import logoUrl from '../assets/yukti-logo.png';

const YuktiIcon = () => (
  <img src={logoUrl} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }} />
);

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


  return (
    <aside className="rail">
      <header className="rail__hd">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="rail__title">
            <YuktiIcon />
            Ask Yukti
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "var(--yk-ink-500)", fontSize: "18px", lineHeight: 1 }}>✕</button>
          )}
        </div>
      </header>


      <div className="rail__body" ref={bodyRef}>
        {messages.length === 0 && !busy && (
          <div className="rail__empty">
            <div className="rail__empty-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div className="rail__empty-title">Ask Yukti</div>
            <div className="rail__empty-hint">Type a clinical question below — answers are drawn only from approved guidelines.</div>
          </div>
        )}

        {messages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} className="msg msg--user">{m.text}</div>
          ) : (
            <div key={i} className="msg msg--bot">
              <div className="msg__hd">
                <YuktiIcon /> Yukti
              </div>
              <div className="msg__body">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ marginBottom: '0.5em', lineHeight: 1.6 }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                    ul: ({ children }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em', marginBottom: '0.5em' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em', marginBottom: '0.5em' }}>{children}</ol>,
                    li: ({ children }) => <li style={{ lineHeight: 1.6, marginBottom: '0.15em' }}>{children}</li>,
                    h2: ({ children }) => <h2 style={{ fontWeight: 600, fontSize: '0.95em', marginTop: '0.75em', marginBottom: '0.25em' }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontWeight: 600, fontSize: '0.9em', marginTop: '0.5em', marginBottom: '0.2em' }}>{children}</h3>,
                    table: ({ children }) => <table style={{ fontSize: '0.8em', borderCollapse: 'collapse', width: '100%', marginBottom: '0.5em' }}>{children}</table>,
                    th: ({ children }) => <th style={{ border: '1px solid #ccc', padding: '4px 6px', background: '#f0f0f0', textAlign: 'left' }}>{children}</th>,
                    td: ({ children }) => <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{children}</td>,
                    blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #1a5f7a', paddingLeft: '0.75em', color: '#555', fontStyle: 'italic', margin: '0.5em 0' }}>{children}</blockquote>,
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="msg__citations">
                  {m.sources.map((s, i) => (
                    <span key={i} className="msg__citation">{s.citation}</span>
                  ))}
                </div>
              )}
            </div>
          )
        ))}

        {busy && (
          <div className="msg msg--bot">
            <div className="msg__hd"><YuktiIcon /> Yukti</div>
            <div style={{ color: "var(--yk-ink-500)" }}>Searching approved guidelines…</div>
          </div>
        )}
      </div>


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

