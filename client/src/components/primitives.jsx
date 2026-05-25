// Shared UI primitives for Yukti.
// Ported from design_handoff_yukti/design_files/components/primitives.jsx
// Adapted from Babel/window globals to ES module exports.

import React, { useState } from 'react';
import { REFS } from '../data/refs';

/* ===== Citation marker ===== */
export function Cite({ ids }) {
  const list = Array.isArray(ids) ? ids : [ids];
  return (
    <span className="cite-group">
      {list.map((id, i) => {
        const idx = REFS.findIndex(r => r.id === id);
        if (idx < 0) return null;
        return (
          <a
            key={id}
            className="row__cite"
            href={`#ref-${id}`}
            onClick={(e) => {
              // Smooth scroll without scrollIntoView
              e.preventDefault();
              const el = document.getElementById(`ref-${id}`);
              if (el) {
                const rect = el.getBoundingClientRect();
                const top = rect.top + window.scrollY - 120;
                window.scrollTo({ top, behavior: "smooth" });
                el.classList.add("refs__item--target");
                setTimeout(() => el.classList.remove("refs__item--target"), 1800);
              }
            }}
            title={`${REFS[idx].src} (${REFS[idx].year})`}
          >
            {i > 0 ? "," : ""}{idx + 1}
          </a>
        );
      })}
    </span>
  );
}

/* ===== Segmented control ===== */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className="seg__opt"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ===== Numeric input with unit ===== */
export function NumInput({ value, onChange, unit, placeholder, min, max, step }) {
  return (
    <label className="num-input">
      <input
        type="number"
        value={value === null || value === undefined ? "" : value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        placeholder={placeholder}
        min={min} max={max} step={step}
      />
      {unit && <span className="num-input__unit">{unit}</span>}
    </label>
  );
}

/* ===== Calculator row ===== */
export function Row({ label, hint, citeIds, control, points, localTag }) {
  // Show the points pill only for clinically meaningful flags, not numeric/raw values
  const showPts = points && (
    String(points).includes("consult OB") ||
    points === "incomplete" ||
    points === "+RhIG" ||
    points === "type & screen"
  );
  const flag = String(points || "").includes("consult OB");
  return (
    <div className="row">
      <div className="row__label">
        <span className="row__label-text">
          {label}
          {citeIds && <Cite ids={citeIds} />}
        </span>
        {hint && <span className="row__hint">{hint}</span>}
        {localTag && <span className="tag-local">Locally adapted</span>}
      </div>
      <div className="row__right">
        {control}
        {showPts && <span className={`pts pts--show ${flag ? "pts--flag" : ""}`}>{points}</span>}
      </div>
    </div>
  );
}

/* ===== Section wrapper ===== */
export function Section({ num, title, sub, headerRight, children, footer, collapsible, collapsed }) {
  const [open, setOpen] = useState(true);
  const isVisible = collapsed !== undefined ? !collapsed : (!collapsible || open);
  return (
    <section className="section">
      <header className="section__hd">
        <div className="section__hd-l">
          <span className="section__num">{num}</span>
          <div>
            <div className="section__title">{title}</div>
            {sub && !collapsed && <div className="section__sub">{sub}</div>}
          </div>
        </div>
        <div className="section__hd-r">
          {headerRight}
          {collapsible && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--yk-ink-500)", padding: "2px 6px" }}
              aria-expanded={open}
            >
              {open ? "Hide" : "Show"}
            </button>
          )}
        </div>
      </header>
      {isVisible && children}
      {isVisible && footer}
    </section>
  );
}

/* ===== Risk band pill ===== */
export function RiskBand({ level, style, children }) {
  const cls = {
    low:  "risk-band risk-band--low",
    mod:  "risk-band risk-band--mod",
    high: "risk-band risk-band--high",
    info: "risk-band risk-band--info",
  }[level] || "risk-band risk-band--info";
  return (
    <span className={cls} style={style}>
      <span className="risk-band__dot" />
      {children}
    </span>
  );
}

/* ===== Result block ===== */
export function ResultBlock({ label, primary, detail, band, level }) {
  return (
    <div className={`result${level ? ` result--${level}` : ""}`}>
      <div>
        <div className="result__label">{label}</div>
        <div className="result__primary">{primary}</div>
        {detail && <div className="result__detail">{detail}</div>}
      </div>
      {band && <div>{band}</div>}
    </div>
  );
}

/* ===== Recommendation ===== */
export function Recommendation({ index, title, body, quote, citeIds, tags, onAsk }) {
  return (
    <div className="rec">
      <span className="rec__bullet">{index}</span>
      <div>
        <div className="rec__title">
          {title}
          {citeIds && <Cite ids={citeIds} />}
        </div>
        <div className="rec__body">{body}</div>
        {quote && <div className="quote">{quote}</div>}
        {(tags && tags.length > 0) && (
          <div className="rec__meta">
            {tags.map((t, i) => (
              <span key={i} className={`tag ${t.kind === "local" ? "tag-local" : t.kind === "info" ? "tag--info" : ""}`}>{t.label}</span>
            ))}
          </div>
        )}
      </div>
      {onAsk && (
        <button className="rec__ask" onClick={onAsk} title="Ask Yukti about this recommendation">
          <span style={{display:"inline-block", width:10, height:10}}>
            <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4h8M2 7h5M2 10l1.5-2H10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v6.5L2 10z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </span>
          Ask Yukti
        </button>
      )}
    </div>
  );
}
