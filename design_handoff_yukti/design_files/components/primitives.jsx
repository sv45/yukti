// Shared UI primitives for Yukti.
// Loaded as a Babel script — exposes components on window for sibling scripts.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ===== Citation marker ===== */
function Cite({ ids }) {
  const list = Array.isArray(ids) ? ids : [ids];
  return (
    <span className="cite-group">
      {list.map((id, i) => {
        const idx = window.YK_REFS.findIndex(r => r.id === id);
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
            title={`${window.YK_REFS[idx].src} (${window.YK_REFS[idx].year})`}
          >
            {i > 0 ? "," : ""}{idx + 1}
          </a>
        );
      })}
    </span>
  );
}

/* ===== Segmented control ===== */
function Segmented({ value, onChange, options }) {
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
function NumInput({ value, onChange, unit, placeholder, min, max, step }) {
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
function Row({ label, hint, citeIds, control, points, localTag }) {
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
function Section({ num, title, sub, headerRight, children, footer }) {
  return (
    <section className="section">
      <header className="section__hd">
        <div className="section__hd-l">
          <span className="section__num">{num}</span>
          <div>
            <div className="section__title">{title}</div>
            {sub && <div className="section__sub">{sub}</div>}
          </div>
        </div>
        {headerRight && <div className="section__hd-r">{headerRight}</div>}
      </header>
      {children}
      {footer}
    </section>
  );
}

/* ===== Risk band pill ===== */
function RiskBand({ level, children }) {
  const cls = {
    low:  "risk-band risk-band--low",
    mod:  "risk-band risk-band--mod",
    high: "risk-band risk-band--high",
    info: "risk-band risk-band--info",
  }[level] || "risk-band risk-band--info";
  return (
    <span className={cls}>
      <span className="risk-band__dot" />
      {children}
    </span>
  );
}

/* ===== Result block ===== */
function ResultBlock({ label, primary, detail, band }) {
  return (
    <div className="result">
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
function Recommendation({ index, title, body, quote, citeIds, tags, onAsk }) {
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

Object.assign(window, {
  Cite, Segmented, NumInput, Row, Section, RiskBand, ResultBlock, Recommendation,
});
