import React, { useState } from "react";

const MIFE_STATES = new Set([
  "CA","CO","CT","DC","DE","HI","IL","MA","MD","ME",
  "MI","MN","NH","NJ","NV","NM","NY","OR","PA","RI",
  "VA","VT","WA",
]);

function extractState(address) {
  if (!address) return null;
  const m = address.match(/,\s+([A-Z]{2})\s+\d{5}/);
  return m ? m[1] : null;
}

export default function PharmacyZipFinder() {
  const [zip, setZip] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = zip.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/places/pharmacies?zip=${trimmed}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--yk-ink-700)", marginBottom: "8px" }}>
        Find nearby CVS &amp; Walgreens
      </div>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="ZIP code"
          value={zip}
          onChange={e => setZip(e.target.value)}
          style={{
            flex: "0 0 110px",
            padding: "7px 10px",
            fontSize: "13px",
            border: "1px solid var(--yk-ink-200)",
            borderRadius: "6px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "7px 16px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            background: "#4D7C5F",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p style={{ fontSize: "13px", color: "#DC2626", margin: "0 0 8px" }}>{error}</p>
      )}

      {results !== null && results.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--yk-ink-500)", margin: "0 0 8px" }}>
          No CVS or Walgreens found within 10 miles of this ZIP code.
        </p>
      )}

      {results && results.length > 0 && (
        <div>
          {results.map((r) => {
            const state = extractState(r.address);
            const available = state ? MIFE_STATES.has(state) : false;
            return (
              <div
                key={r.place_id}
                style={{
                  border: "1px solid var(--yk-ink-150, #E5E7EB)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--yk-ink-900, #111827)" }}>
                    {r.name}
                  </span>
                  {r.distance_miles != null && (
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--yk-ink-600, #4B5563)",
                      background: "var(--yk-ink-100, #F3F4F6)",
                      borderRadius: "12px",
                      padding: "2px 8px",
                      whiteSpace: "nowrap",
                    }}>
                      {r.distance_miles} mi
                    </span>
                  )}
                </div>

                {r.address && (
                  <div style={{ fontSize: "13px", color: "var(--yk-ink-600, #4B5563)", marginTop: "3px" }}>
                    {r.address}
                  </div>
                )}

                {r.phone && (
                  <a
                    href={`tel:${r.phone.replace(/\D/g, "")}`}
                    style={{ fontSize: "13px", color: "#2563EB", textDecoration: "none", display: "inline-block", marginTop: "4px" }}
                  >
                    {r.phone}
                  </a>
                )}

                <div style={{ marginTop: "6px" }}>
                  {available ? (
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      background: "#FFFBEB",
                      border: "1px solid #FCD34D",
                      color: "#78350F",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}>
                      May carry mifepristone — call to confirm
                    </span>
                  ) : (
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      background: "var(--yk-ink-100, #F3F4F6)",
                      border: "1px solid var(--yk-ink-200, #E5E7EB)",
                      color: "var(--yk-ink-500, #6B7280)",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}>
                      Not available in this state
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <p style={{ fontSize: "12px", color: "var(--yk-ink-500, #6B7280)", margin: "6px 0 2px", lineHeight: "1.5" }}>
            Call ahead to confirm — not all certified locations stock mifepristone at all times
          </p>
          <a
            href="https://medicationabortionpharmacies.com/#find-a-pharmacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none" }}
          >
            Additional options →
          </a>
        </div>
      )}
    </div>
  );
}
