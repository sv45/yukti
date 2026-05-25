import React, { useState, useRef, useEffect } from "react";

// ─── constants ────────────────────────────────────────────────────────────────

const CONTRAINDICATIONS = [
  { id: "allergy", label: "Allergy to mifepristone or misoprostol" },
  { id: "steroids", label: "Chronic systemic corticosteroid use" },
  { id: "anemia", label: "Severe anemia" },
  { id: "adrenal", label: "Adrenal insufficiency" },
  { id: "coag", label: "Coagulopathy or anticoagulant use" },
  { id: "iud", label: "IUD in place (must be removed first)" },
  { id: "porphyria", label: "Known porphyria" },
  { id: "ectopic", label: "Suspected ectopic pregnancy (must be excluded first)" },
];

const MAIL_ORDER_PHARMACIES = [
  {
    name: "Aid Access",
    url: "https://aidaccess.org",
    note: "Telemedicine + mail-order. Ships to all states.",
    rems: true,
  },
  {
    name: "Honeybee Health",
    url: "https://honeybeehealth.com",
    note: "REMS-certified. Fast shipping. Price transparency.",
    rems: true,
  },
  {
    name: "Plan C Directory",
    url: "https://plancpills.org",
    note: "Directory of verified options by state. Not a pharmacy.",
    rems: false,
  },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, highlight }) {
  return (
    <div
      style={{
        background: "var(--yk-ink-100, #f8f8f7)",
        border: highlight
          ? "1.5px solid var(--yk-sage-400, #b0bfaf)"
          : "1px solid var(--yk-ink-200, #e8e8e6)",
        borderRadius: 10,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      {title && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--yk-ink-500, #888)",
            marginBottom: 14,
            marginTop: 0,
          }}
        >
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function Banner({ type, children }) {
  const colors = {
    green: {
      bg: "var(--yk-risk-low-bg, #f0faf0)",
      border: "var(--yk-risk-low, #3a7d44)",
      text: "var(--yk-risk-low, #2d6338)",
    },
    amber: {
      bg: "#fffbf0",
      border: "var(--yk-risk-mod, #b45309)",
      text: "var(--yk-risk-mod, #92400e)",
    },
    red: {
      bg: "#fff5f5",
      border: "var(--yk-risk-high, #b91c1c)",
      text: "var(--yk-risk-high, #991b1b)",
    },
    sage: {
      bg: "var(--yk-sage-50, #f4f6f4)",
      border: "var(--yk-sage-400, #b0bfaf)",
      text: "var(--yk-sage-800, #3a4d3a)",
    },
    blue: {
      bg: "#f0f7ff",
      border: "var(--yk-risk-info, #1d4ed8)",
      text: "var(--yk-risk-info, #1e3a8a)",
    },
  };
  const c = colors[type] || colors.sage;
  return (
    <div
      style={{
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        color: c.text,
        fontSize: 14,
        lineHeight: 1.55,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange, vertical = true }) {
  return (
    <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap: 10 }}>
      {options.map((opt) => {
        const isObj = typeof opt === "object";
        const val = isObj ? opt.value : opt;
        const label = isObj ? opt.label : opt;
        const selected = value === val;
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 7,
              border: selected
                ? "1.5px solid var(--yk-sage-500, #96a695)"
                : "1px solid var(--yk-ink-300, #d4d4d0)",
              background: selected ? "var(--yk-sage-50, #f4f6f4)" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 14,
              color: selected ? "var(--yk-sage-800, #3a4d3a)" : "var(--yk-ink-700, #444)",
              fontWeight: selected ? 600 : 400,
              transition: "all 0.12s",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: selected
                  ? "5px solid var(--yk-sage-500, #96a695)"
                  : "1.5px solid var(--yk-ink-400, #bbb)",
                flexShrink: 0,
                transition: "all 0.12s",
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Collapsible({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--yk-sage-600, #6a8069)",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 0",
        }}
      >
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>▶</span>
        {label}
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

function USReportInterpreter({ onInterpret }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const interpret = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Extract the following structured information from this ultrasound report. Respond ONLY with valid JSON (no markdown, no extra text):
{
  "iup_confirmed": true/false/null,
  "ectopic_excluded": true/false/null,
  "gestational_age_weeks": number or null,
  "gestational_age_days": number or null,
  "cardiac_activity": true/false/null,
  "pul": true/false/null,
  "adnexal_pathology": true/false/null,
  "free_fluid": true/false/null,
  "interpretation_summary": "one sentence plain-English summary for clinician review"
}

Ultrasound report: ${text}`,
          pathway: "mab",
          institution: "memorial",
        }),
      });
      const data = await res.json();
      const raw = data.response || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError("Could not interpret report. Please review and enter fields manually.");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste radiology or point-of-care ultrasound report here…"
        rows={4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 7,
          border: "1px solid var(--yk-ink-300, #d4d4d0)",
          fontSize: 13,
          fontFamily: "'IBM Plex Mono', monospace",
          resize: "vertical",
          color: "var(--yk-ink-800, #333)",
          background: "#fff",
        }}
      />
      <button
        onClick={interpret}
        disabled={loading || !text.trim()}
        style={{
          marginTop: 8,
          padding: "8px 18px",
          borderRadius: 7,
          border: "none",
          background: loading ? "var(--yk-ink-300)" : "var(--yk-sage-500, #96a695)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Interpreting…" : "Interpret report"}
      </button>

      {error && (
        <Banner type="amber" style={{ marginTop: 10 }}>{error}</Banner>
      )}

      {result && (
        <div style={{ marginTop: 12 }}>
          <Banner type="blue">
            <strong>Yukti interpreted:</strong> {result.interpretation_summary}
            <br />
            <span style={{ fontSize: 12, opacity: 0.8 }}>Please confirm below before proceeding.</span>
          </Banner>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={() => onInterpret(result)}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "none",
                background: "var(--yk-sage-500)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Confirm &amp; auto-fill
            </button>
            <button
              onClick={() => setResult(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "1px solid var(--yk-ink-300)",
                background: "#fff",
                color: "var(--yk-ink-700)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PharmacyFinder() {
  const [zip, setZip] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const search = async () => {
    if (zip.length !== 5) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/places/pharmacies?zip=${zip}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setError("Search failed. Check connection.");
    }
    setLoading(false);
  };

  const copyReferral = (p) => {
    const text = `Pharmacy referral:\n${p.name}\n${p.address}${p.phone ? "\n" + p.phone : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(p.name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      {/* Mail-order static cards */}
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--yk-ink-500)", marginBottom: 10, marginTop: 0 }}>
        REMS-certified mail-order
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {MAIL_ORDER_PHARMACIES.map((p) => (
          <div
            key={p.name}
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid var(--yk-ink-200)",
              background: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--yk-ink-800)" }}>{p.name}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--yk-ink-500)" }}>{p.note}</p>
            </div>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--yk-sage-600)",
                textDecoration: "none",
                padding: "5px 10px",
                border: "1px solid var(--yk-sage-300)",
                borderRadius: 6,
                whiteSpace: "nowrap",
                marginLeft: 12,
              }}
            >
              Visit →
            </a>
          </div>
        ))}
      </div>

      {/* Local pharmacy search */}
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--yk-ink-500)", marginBottom: 10, marginTop: 0 }}>
        Local pharmacy search
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            padding: "9px 12px",
            borderRadius: 7,
            border: "1px solid var(--yk-ink-300)",
            fontSize: 14,
            width: 120,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
        <button
          onClick={search}
          disabled={loading || zip.length !== 5}
          style={{
            padding: "9px 16px",
            borderRadius: 7,
            border: "none",
            background: "var(--yk-sage-500)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: zip.length === 5 ? "pointer" : "default",
            opacity: zip.length === 5 ? 1 : 0.5,
          }}
        >
          {loading ? "Searching…" : "Search nearby"}
        </button>
      </div>

      {error && <Banner type="amber">{error}</Banner>}

      {results && results.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--yk-ink-500)", marginTop: 10 }}>No pharmacies found. Try a nearby ZIP code.</p>
      )}

      {results && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {results.map((p) => (
            <div
              key={p.place_id}
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--yk-ink-200)",
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--yk-ink-500)" }}>{p.address}</p>
                  {p.phone && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--yk-ink-500)" }}>{p.phone}</p>}
                </div>
                <button
                  onClick={() => copyReferral(p)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--yk-sage-600)",
                    background: "none",
                    border: "1px solid var(--yk-sage-300)",
                    borderRadius: 6,
                    padding: "5px 10px",
                    cursor: "pointer",
                    marginLeft: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied === p.name ? "Copied ✓" : "Copy referral"}
                </button>
              </div>
              {p.hours && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--yk-ink-400)" }}>
                  {p.hours[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function MedicationAbortionPathway({
  institutionId = "memorial",
  selectedState = "NY",
  legalStatus = null, // { status: "legal"|"restricted"|"banned", gestational_limit_weeks, waiting_period_hours, summary }
}) {
  // Section 1 — pregnancy test
  const [pregTest, setPregTest] = useState(null); // "positive" | "negative"

  // Section 2 — desired?
  const [desiredStatus, setDesiredStatus] = useState(null); // "yes" | "undecided" | "no"

  // Section 2b — what option?
  const [managementChoice, setManagementChoice] = useState(null); // "decide_later" | "surgical" | "medication"

  // Section 4 — IUP status
  const [iupStatus, setIupStatus] = useState(null); // "confirmed" | "pul" | "ectopic" | "no_us"
  const [usInterpreted, setUsInterpreted] = useState(false);

  // Section 5 — GA
  const [gaWeeks, setGaWeeks] = useState("");
  const [gaDays, setGaDays] = useState("");

  // Section 6 — contraindications
  const [contraindications, setContraindications] = useState({});

  // Section 7 — REMS
  const [remsStatus, setRemsStatus] = useState(null); // "yes" | "no"

  // Derived
  const totalDays = gaWeeks !== "" && gaDays !== "" ? parseInt(gaWeeks) * 7 + parseInt(gaDays) : null;
  const gaOk = totalDays !== null && totalDays <= 84;
  const gaOver = totalDays !== null && totalDays > 84;
  const anyContra = Object.values(contraindications).some(Boolean);
  const isMemorial = institutionId === "memorial";

  const toggleContra = (id) =>
    setContraindications((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleUSInterpret = (parsed) => {
    if (parsed.iup_confirmed === true) setIupStatus("confirmed");
    else if (parsed.pul === true) setIupStatus("pul");
    else if (parsed.ectopic_excluded === false) setIupStatus("ectopic");
    if (parsed.gestational_age_weeks !== null) setGaWeeks(String(parsed.gestational_age_weeks ?? ""));
    if (parsed.gestational_age_days !== null) setGaDays(String(parsed.gestational_age_days ?? ""));
    setUsInterpreted(true);
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 60px" }}>

      {/* ── SECTION 1: Pregnancy test ── */}
      <SectionCard title="Pregnancy test" highlight>
        <RadioGroup
          options={[
            { value: "positive", label: "Positive" },
            { value: "negative", label: "Negative" },
          ]}
          value={pregTest}
          onChange={setPregTest}
          vertical={false}
        />
        {pregTest === "negative" && (
          <Banner type="amber" style={{ marginTop: 12 }}>
            MAB pathway requires a confirmed pregnancy. If clinical suspicion remains, consider serum quantitative β-hCG or repeat testing.
          </Banner>
        )}
      </SectionCard>

      {/* ── SECTION 2: Pregnancy desired? ── */}
      {pregTest === "positive" && (
        <SectionCard title="Is this pregnancy desired?">
          <RadioGroup
            options={[
              { value: "yes", label: "Yes" },
              { value: "undecided", label: "Undecided" },
              { value: "no", label: "No" },
            ]}
            value={desiredStatus}
            onChange={(v) => {
              setDesiredStatus(v);
              setManagementChoice(null);
            }}
          />

          {(desiredStatus === "yes" || desiredStatus === "undecided") && (
            <Banner type="sage" style={{ marginTop: 14 }}>
              <strong>Prenatal referral</strong>
              <br />
              Prescribe folic acid (400–800 mcg daily). Discharge with outpatient OB/GYN follow-up for prenatal care.
              {desiredStatus === "undecided" && (
                <>
                  <br /><br />
                  <strong>If undecided:</strong> Provide information on all options. Patient may return to this pathway when ready. Document shared decision-making discussion.
                </>
              )}
            </Banner>
          )}
        </SectionCard>
      )}

      {/* ── SECTION 2b: Management choice ── */}
      {pregTest === "positive" && desiredStatus === "no" && (
        <SectionCard title="Management">
          <RadioGroup
            options={[
              { value: "decide_later", label: "Patient wants to decide later" },
              { value: "surgical", label: "Surgical abortion" },
              { value: "medication", label: "Medication abortion" },
            ]}
            value={managementChoice}
            onChange={setManagementChoice}
          />

          {managementChoice === "decide_later" && (
            <Banner type="sage" style={{ marginTop: 14 }}>
              <strong>Discharge instructions</strong>
              <br />
              Document that options were discussed. Provide contact for follow-up and local referral resources.
              <br /><br />
              <strong>Return precautions:</strong> Soaking more than 2 pads per hour for 2+ hours, fever above 101°F, severe abdominal pain, or feeling faint.
            </Banner>
          )}

          {managementChoice === "surgical" && (
            <Banner type="sage" style={{ marginTop: 14 }}>
              <strong>Surgical abortion referral</strong>
              <br />
              Surgical abortion is not performed in the ED. Refer to an outpatient OB/GYN or reproductive health clinic.
              <br />
              <a
                href="https://www.plannedparenthood.org/learn/abortion/in-clinic-abortion-procedures"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--yk-sage-600)", fontWeight: 600, fontSize: 13 }}
              >
                Plan C: find a clinic →
              </a>
            </Banner>
          )}
        </SectionCard>
      )}

      {/* ── rest of pathway — only if medication abortion chosen ── */}
      {pregTest === "positive" && desiredStatus === "no" && managementChoice === "medication" && (
        <>

          {/* ── SECTION 3: Legal status banner ── */}
          {legalStatus ? (
            <SectionCard>
              {legalStatus.status === "legal" && (
                <Banner type="green">
                  <strong>Legal in {selectedState}.</strong> {legalStatus.summary}
                  <br /><span style={{ fontSize: 11, opacity: 0.75 }}>This tool does not provide legal advice. Verify current law before prescribing.</span>
                </Banner>
              )}
              {legalStatus.status === "restricted" && (
                <Banner type="amber">
                  <strong>Restricted in {selectedState}.</strong> {legalStatus.summary}
                  {legalStatus.gestational_limit_weeks && (
                    <> Gestational limit: <strong>{legalStatus.gestational_limit_weeks} weeks.</strong></>
                  )}
                  {legalStatus.waiting_period_hours && (
                    <> Waiting period: <strong>{legalStatus.waiting_period_hours} hours.</strong></>
                  )}
                  <br /><span style={{ fontSize: 11, opacity: 0.8 }}>This tool does not provide legal advice. Verify current law before prescribing.</span>
                </Banner>
              )}
              {legalStatus.status === "banned" && (
                <Banner type="red">
                  <strong>Medication abortion is banned in {selectedState}.</strong> {legalStatus.summary}
                  <br /><br />
                  This pathway cannot be used to prescribe in this jurisdiction. Provide counseling and refer patient to resources for out-of-state care.
                  <br /><br />
                  <a href="https://plancpills.org" target="_blank" rel="noreferrer" style={{ color: "var(--yk-risk-high)", fontWeight: 600, fontSize: 13 }}>
                    Plan C: options by state →
                  </a>
                  <br /><span style={{ fontSize: 11, marginTop: 6, display: "block", opacity: 0.8 }}>This tool does not provide legal advice. Verify current law before prescribing.</span>
                </Banner>
              )}
            </SectionCard>
          ) : (
            <SectionCard>
              <Banner type="amber">
                Legal status for <strong>{selectedState}</strong> could not be loaded. Verify current abortion law before prescribing.{" "}
                <a href="https://kff.org/womens-health-policy/dashboard/abortion-in-the-u-s-dashboard/" target="_blank" rel="noreferrer" style={{ color: "var(--yk-risk-mod)", fontWeight: 600 }}>
                  KFF dashboard →
                </a>
              </Banner>
            </SectionCard>
          )}

          {/* ── stop if banned ── */}
          {legalStatus?.status !== "banned" && (
            <>

              {/* ── SECTION 4: IUP status ── */}
              <SectionCard title="Ultrasound findings">
                <RadioGroup
                  options={[
                    { value: "confirmed", label: "IUP confirmed" },
                    { value: "pul", label: "Pregnancy of unknown location (PUL)" },
                    { value: "ectopic", label: "Ectopic pregnancy suspected or confirmed" },
                    { value: "no_us", label: "No ultrasound performed" },
                  ]}
                  value={iupStatus}
                  onChange={(v) => { setIupStatus(v); setUsInterpreted(false); }}
                />

                {usInterpreted && (
                  <Banner type="blue" style={{ marginTop: 10 }}>
                    Fields auto-filled from ultrasound report. Please confirm above.
                  </Banner>
                )}

                {iupStatus === "pul" && (
                  <Banner type="amber" style={{ marginTop: 12 }}>
                    <strong>Ectopic must be excluded before initiating MAB.</strong> Obtain serum β-hCG and repeat ultrasound or OB/GYN consult as clinically indicated. Do not administer mifepristone until IUP is confirmed.
                  </Banner>
                )}

                {iupStatus === "ectopic" && (
                  <Banner type="red" style={{ marginTop: 12 }}>
                    <strong>Emergent OB/GYN consult indicated.</strong> MAB is contraindicated. Initiate ectopic protocol: IV access × 2, T&amp;S, NPO. Do not administer uterotonics.
                  </Banner>
                )}

                {iupStatus === "no_us" && (
                  <Banner type="amber" style={{ marginTop: 12 }}>
                    Ectopic pregnancy must be excluded before initiating MAB. Consider point-of-care ultrasound or OB/GYN consult.
                  </Banner>
                )}

                {/* Paste US report — shown for all statuses */}
                <div style={{ marginTop: 14 }}>
                  <Collapsible label="Paste ultrasound report for Yukti to interpret">
                    <USReportInterpreter onInterpret={handleUSInterpret} />
                  </Collapsible>
                </div>
              </SectionCard>

              {/* Only continue if IUP confirmed */}
              {iupStatus === "confirmed" && (
                <>

                  {/* ── SECTION 5: Gestational age ── */}
                  <SectionCard title="Gestational age">
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--yk-ink-500)", display: "block", marginBottom: 4 }}>Weeks</label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={gaWeeks}
                          onChange={(e) => setGaWeeks(e.target.value)}
                          style={{
                            width: 72,
                            padding: "9px 10px",
                            borderRadius: 7,
                            border: "1px solid var(--yk-ink-300)",
                            fontSize: 16,
                            fontFamily: "'IBM Plex Mono', monospace",
                            textAlign: "center",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--yk-ink-500)", display: "block", marginBottom: 4 }}>Days</label>
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={gaDays}
                          onChange={(e) => setGaDays(e.target.value)}
                          style={{
                            width: 72,
                            padding: "9px 10px",
                            borderRadius: 7,
                            border: "1px solid var(--yk-ink-300)",
                            fontSize: 16,
                            fontFamily: "'IBM Plex Mono', monospace",
                            textAlign: "center",
                          }}
                        />
                      </div>
                      {totalDays !== null && (
                        <div style={{ marginTop: 18 }}>
                          {gaOk ? (
                            <span style={{ fontSize: 13, color: "var(--yk-risk-low)", fontWeight: 600 }}>
                              {totalDays}d — within MAB range (≤84d)
                            </span>
                          ) : gaOver ? (
                            <span style={{ fontSize: 13, color: "var(--yk-risk-high)", fontWeight: 600 }}>
                              {totalDays}d — exceeds 84-day limit
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {gaOver && (
                      <Banner type="red" style={{ marginTop: 12 }}>
                        MAB (mifepristone + misoprostol) is indicated up to 84 days (12 weeks) gestation. Refer for surgical evaluation.
                      </Banner>
                    )}
                  </SectionCard>

                  {/* ── SECTION 6: Contraindications ── */}
                  {gaOk && (
                    <SectionCard title="Contraindications to medication abortion">
                      <p style={{ fontSize: 13, color: "var(--yk-ink-500)", marginTop: 0, marginBottom: 12 }}>
                        Check all that apply:
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {CONTRAINDICATIONS.map((c) => {
                          const checked = !!contraindications[c.id];
                          return (
                            <button
                              key={c.id}
                              onClick={() => toggleContra(c.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                borderRadius: 7,
                                border: checked
                                  ? "1.5px solid var(--yk-risk-high, #b91c1c)"
                                  : "1px solid var(--yk-ink-300)",
                                background: checked ? "#fff5f5" : "#fff",
                                cursor: "pointer",
                                textAlign: "left",
                                fontSize: 14,
                                color: checked ? "var(--yk-risk-high)" : "var(--yk-ink-700)",
                                fontWeight: checked ? 600 : 400,
                                transition: "all 0.12s",
                              }}
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: checked
                                    ? "none"
                                    : "1.5px solid var(--yk-ink-400)",
                                  background: checked ? "var(--yk-risk-high)" : "transparent",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {checked ? "✓" : ""}
                              </span>
                              {c.label}
                            </button>
                          );
                        })}
                      </div>

                      {anyContra && (
                        <Banner type="red" style={{ marginTop: 14 }}>
                          <strong>One or more contraindications identified.</strong> MAB should not be initiated. Review with OB/GYN and consider alternative management.
                        </Banner>
                      )}
                    </SectionCard>
                  )}

                  {/* ── SECTION 7: REMS ── */}
                  {gaOk && !anyContra && (
                    <SectionCard title="REMS certification">
                      <p style={{ fontSize: 13, color: "var(--yk-ink-600)", marginTop: 0, marginBottom: 12, lineHeight: 1.55 }}>
                        Mifepristone requires REMS (Risk Evaluation and Mitigation Strategy) prescriber certification.
                        {isMemorial && " At Memorial Hospital, OB/GYN places the mifepristone order — EM physician initiates the handoff."}
                      </p>

                      {!isMemorial && (
                        <>
                          <p style={{ fontSize: 13, color: "var(--yk-ink-600)", marginBottom: 12 }}>
                            Are you REMS-certified to prescribe mifepristone?
                          </p>
                          <RadioGroup
                            options={[
                              { value: "yes", label: "Yes — I am REMS certified" },
                              { value: "no", label: "No — not yet certified" },
                            ]}
                            value={remsStatus}
                            onChange={setRemsStatus}
                            vertical={false}
                          />
                          {remsStatus === "no" && (
                            <Banner type="amber" style={{ marginTop: 12 }}>
                              REMS certification is required to prescribe mifepristone. Registration takes days to weeks.
                              <br /><br />
                              Register at:{" "}
                              <a href="https://www.dancorems.com" target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "var(--yk-risk-mod)" }}>dancorems.com</a>
                              {" "}or{" "}
                              <a href="https://www.genbioproREMS.com" target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "var(--yk-risk-mod)" }}>genbioproREMS.com</a>
                              <br /><br />
                              In the meantime: provide options counseling and refer to a REMS-certified provider.
                            </Banner>
                          )}
                        </>
                      )}

                      {isMemorial && (
                        <Banner type="sage">
                          <strong>Memorial Hospital protocol:</strong> Initiate OB/GYN handoff for mifepristone order. EM physician role: assessment, counseling, and handoff documentation.
                        </Banner>
                      )}
                    </SectionCard>
                  )}

                  {/* ── SECTION 8: Options counseling ── */}
                  {gaOk && !anyContra && (isMemorial || remsStatus === "yes") && (
                    <SectionCard title="Options counseling">
                      <Collapsible label="Medication abortion — what to expect" defaultOpen>
                        <div style={{ fontSize: 13, color: "var(--yk-ink-700)", lineHeight: 1.65, paddingLeft: 4 }}>
                          <p style={{ margin: "0 0 8px" }}>
                            <strong>Regimen:</strong> Mifepristone 200mg PO, followed by misoprostol 800mcg buccal or vaginally 24–48 hours later.
                          </p>
                          <p style={{ margin: "0 0 8px" }}>
                            <strong>Efficacy:</strong> ~95–98% effective up to 10 weeks. Decreases slightly with advancing gestational age.
                          </p>
                          <p style={{ margin: "0 0 8px" }}>
                            <strong>Timeline:</strong> Cramping and bleeding typically begin within hours of misoprostol. Most complete within 24–48 hours.
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Follow-up:</strong> Repeat pregnancy test or serum hCG in 4 weeks, or sooner if symptoms warrant.
                          </p>
                        </div>
                      </Collapsible>
                      <div style={{ height: 10 }} />
                      <Collapsible label="Surgical abortion — referral">
                        <div style={{ fontSize: 13, color: "var(--yk-ink-700)", lineHeight: 1.65, paddingLeft: 4 }}>
                          <p style={{ margin: "0 0 8px" }}>Surgical abortion (aspiration or D&amp;E) is not performed in the ED. Refer to an outpatient OB/GYN or reproductive health clinic.</p>
                          <a href="https://plancpills.org" target="_blank" rel="noreferrer" style={{ color: "var(--yk-sage-600)", fontWeight: 600, fontSize: 13 }}>
                            Plan C: find a provider →
                          </a>
                        </div>
                      </Collapsible>
                    </SectionCard>
                  )}

                  {/* ── SECTION 9: Discharge instructions ── */}
                  {gaOk && !anyContra && (isMemorial || remsStatus === "yes") && (
                    <SectionCard title="Discharge instructions">
                      {isMemorial ? (
                        <div style={{ fontSize: 14, color: "var(--yk-ink-700)", lineHeight: 1.7 }}>
                          <p style={{ margin: "0 0 6px" }}><strong>Mifepristone 200mg PO</strong> — OB/GYN order (REMS)</p>
                          <p style={{ margin: "0 0 6px" }}><strong>Misoprostol 800mcg</strong> buccal or vaginal — 24–48 hours after mifepristone</p>
                          <p style={{ margin: "0 0 6px" }}><strong>Ibuprofen 600–800mg</strong> q6–8h PRN pain (take with food)</p>
                          <p style={{ margin: "0 0 16px" }}><strong>Ondansetron 4mg</strong> PRN nausea</p>
                          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "var(--yk-ink-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Return precautions</p>
                          <ul style={{ margin: "0 0 16px", paddingLeft: 20, fontSize: 13, color: "var(--yk-ink-600)" }}>
                            <li>Soaking more than 2 pads per hour for 2+ consecutive hours</li>
                            <li>Fever above 101°F</li>
                            <li>Severe pain not relieved by ibuprofen</li>
                            <li>Feeling faint or signs of hemodynamic instability</li>
                          </ul>
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, color: "var(--yk-ink-700)", lineHeight: 1.7 }}>
                          <p style={{ margin: "0 0 6px" }}><strong>Mifepristone 200mg PO</strong> — prescriber must be REMS certified; pharmacy must be REMS certified</p>
                          <p style={{ margin: "0 0 6px" }}><strong>Misoprostol 800mcg</strong> buccal or vaginal — 24–48 hours after mifepristone</p>
                          <p style={{ margin: "0 0 6px" }}><strong>Ibuprofen 600–800mg</strong> q6–8h PRN pain</p>
                          <p style={{ margin: "0 0 16px" }}><strong>Ondansetron 4mg</strong> PRN nausea</p>
                          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "var(--yk-ink-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Return precautions</p>
                          <ul style={{ margin: "0 0 16px", paddingLeft: 20, fontSize: 13, color: "var(--yk-ink-600)" }}>
                            <li>Soaking more than 2 pads per hour for 2+ consecutive hours</li>
                            <li>Fever above 101°F</li>
                            <li>Severe pain not relieved by ibuprofen</li>
                            <li>Feeling faint or signs of hemodynamic instability</li>
                          </ul>
                        </div>
                      )}
                    </SectionCard>
                  )}

                  {/* ── SECTION 10: Efficacy confirmation ── */}
                  {gaOk && !anyContra && (isMemorial || remsStatus === "yes") && (
                    <SectionCard title="Confirming efficacy">
                      <div style={{ fontSize: 14, color: "var(--yk-ink-700)", lineHeight: 1.7 }}>
                        <p style={{ margin: "0 0 8px" }}>
                          <strong>Repeat pregnancy test</strong> at 4 weeks post-treatment. A negative result confirms complete abortion.
                        </p>
                        <p style={{ margin: "0 0 8px" }}>
                          <strong>Serum β-hCG</strong> at 1–2 weeks if quantitative level was drawn at baseline. Expect ≥50% decline.
                        </p>
                        <p style={{ margin: "0 0 8px" }}>
                          <strong>Ultrasound</strong> if symptoms persist, hCG is not declining appropriately, or there is concern for retained products of conception.
                        </p>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--yk-ink-500)" }}>
                          Instruct patient to follow up with OB/GYN or primary care within 2 weeks. Provide direct referral contact if available.
                        </p>
                      </div>
                    </SectionCard>
                  )}

                  {/* ── SECTION 11: Pharmacy finder ── */}
                  {gaOk && !anyContra && (isMemorial || remsStatus === "yes") && (
                    <SectionCard title="Pharmacy options">
                      <PharmacyFinder />
                    </SectionCard>
                  )}

                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
