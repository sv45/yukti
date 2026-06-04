import React, { useState } from "react";

const CVS_STATES = new Set([
  "CA","CO","CT","DC","DE","HI","IL","MA","MD","ME","MI","MN",
  "NH","NJ","NV","NM","NY","OR","PA","RI","VA","VT","WA",
]);

const LOCAL_PHARMACIES = {
  AZ: [
    { name: "Fairmont Pharmacy", address: "5068 N Central Ave", city: "Phoenix" },
  ],
  CA: [
    { name: "ABM Pharmacy", address: "1385 S Colorado St", city: "Glendale" },
    { name: "AllCare Pharmacy", address: "331 Main St", city: "Salinas" },
    { name: "Apex Pharmacy", address: "1800 Sullivan Ave", city: "Daly City" },
    { name: "Beverly Hills Compounding Pharmacy", address: "9033 Wilshire Blvd", city: "Beverly Hills" },
    { name: "Blossom Pharmacy", address: "5900 Sepulveda Blvd", city: "Van Nuys" },
    { name: "Botica Roma Pharmacy", address: "2917 Cesar Chavez Ave", city: "Los Angeles" },
    { name: "Bridge Pharmacy", address: "101 Castro St", city: "San Francisco" },
    { name: "Castro Pharmacy", address: "498 Castro St", city: "San Francisco" },
    { name: "Communilife Pharmacy", address: "2130 W Olympic Blvd", city: "Los Angeles" },
    { name: "Desert AIDS Project Pharmacy", address: "750 S Vella Rd", city: "Palm Springs" },
    { name: "Economy Drug", address: "3027 Telegraph Ave", city: "Oakland" },
    { name: "Einstein Pharmacy", address: "5825 Sunset Blvd", city: "Hollywood" },
    { name: "Encino Pharmacy", address: "17230 Ventura Blvd", city: "Encino" },
    { name: "Garfield Beach CVS (Rx)", address: "405 14th St", city: "Oakland" },
    { name: "Good Neighbor Pharmacy", address: "1801 Bush St", city: "San Francisco" },
    { name: "Healthy Planet Pharmacy", address: "2120 University Ave", city: "Berkeley" },
    { name: "HomeCare Pharmacy", address: "1215 K St", city: "Sacramento" },
    { name: "Larchmont Pharmacy", address: "140 N Larchmont Blvd", city: "Los Angeles" },
    { name: "Long Drug Stores / Rite Aid", address: "Various locations statewide", city: "Statewide" },
    { name: "Medi-Cal Pharmacy", address: "1400 S Grand Ave", city: "Los Angeles" },
    { name: "Medicine Shoppe", address: "3250 Wilshire Blvd", city: "Los Angeles" },
    { name: "Noe Valley Pharmacy", address: "4098 24th St", city: "San Francisco" },
    { name: "Pacific Coast Pharmacy", address: "801 Welch Rd", city: "Palo Alto" },
    { name: "Portola Pharmacy", address: "400 Portola Dr", city: "San Francisco" },
    { name: "San Francisco Free Clinic Pharmacy", address: "4900 California St", city: "San Francisco" },
    { name: "SF Community Pharmacy", address: "1199 Howard St", city: "San Francisco" },
    { name: "Straus Pharmacy", address: "3621 Geary Blvd", city: "San Francisco" },
    { name: "The Medicine Shoppe", address: "1100 Gough St", city: "San Francisco" },
  ],
  CO: [
    { name: "Boulder Valley Women's Health Center Pharmacy", address: "2855 Valmont Rd", city: "Boulder" },
    { name: "Cherry Creek Pharmacy", address: "200 Fillmore St", city: "Denver" },
    { name: "Rose Medical Center Pharmacy", address: "4567 E 9th Ave", city: "Denver" },
  ],
  CT: [
    { name: "Hartford Hospital Pharmacy", address: "80 Seymour St", city: "Hartford" },
    { name: "Yale Health Pharmacy", address: "55 Lock St", city: "New Haven" },
  ],
  IL: [
    { name: "Chicago Pharmacy", address: "3131 N Lincoln Ave", city: "Chicago" },
    { name: "Evanston Hospital Pharmacy", address: "2650 Ridge Ave", city: "Evanston" },
    { name: "Loretto Hospital Pharmacy", address: "645 S Central Ave", city: "Chicago" },
    { name: "Rush University Medical Center Pharmacy", address: "1620 W Harrison St", city: "Chicago" },
  ],
  KS: [
    { name: "Lawrence Memorial Hospital Pharmacy", address: "325 Maine St", city: "Lawrence" },
  ],
  MD: [
    { name: "Planned Parenthood Pharmacy", address: "1400 Spring St", city: "Silver Spring" },
    { name: "University of Maryland Medical Center Pharmacy", address: "22 S Greene St", city: "Baltimore" },
  ],
  MI: [
    { name: "Arbor Drugs", address: "Various statewide", city: "Statewide" },
    { name: "DMC Pharmacy", address: "3990 John R St", city: "Detroit" },
    { name: "University of Michigan Health Pharmacy", address: "1500 E Medical Center Dr", city: "Ann Arbor" },
  ],
  NJ: [
    { name: "Cooper University Hospital Pharmacy", address: "1 Cooper Plaza", city: "Camden" },
    { name: "Robert Wood Johnson University Hospital Pharmacy", address: "1 Robert Wood Johnson Pl", city: "New Brunswick" },
  ],
  NV: [
    { name: "Desert Springs Hospital Pharmacy", address: "2075 E Flamingo Rd", city: "Las Vegas" },
    { name: "UMC Pharmacy", address: "1800 W Charleston Blvd", city: "Las Vegas" },
  ],
  NY: [
    { name: "Bellevue Hospital Pharmacy", address: "462 1st Ave", city: "New York" },
    { name: "Choices Women's Medical Center Pharmacy", address: "147-32 Jamaica Ave", city: "Jamaica" },
    { name: "Columbia University Irving Medical Center Pharmacy", address: "622 W 168th St", city: "New York" },
    { name: "Montefiore Medical Center Pharmacy", address: "111 E 210th St", city: "Bronx" },
    { name: "NYC Health + Hospitals Pharmacy", address: "125 Worth St", city: "New York" },
    { name: "Weill Cornell Medicine Pharmacy", address: "525 E 68th St", city: "New York" },
  ],
  RI: [
    { name: "Women & Infants Hospital Pharmacy", address: "101 Dudley St", city: "Providence" },
  ],
  SC: [
    { name: "MUSC Pharmacy", address: "169 Ashley Ave", city: "Charleston" },
  ],
  WA: [
    { name: "UW Medical Center Pharmacy", address: "1959 NE Pacific St", city: "Seattle" },
    { name: "Neighborcare Health Pharmacy", address: "4400 Sand Point Way NE", city: "Seattle" },
    { name: "Swedish Medical Center Pharmacy", address: "747 Broadway", city: "Seattle" },
  ],
  WI: [
    { name: "Meriter Hospital Pharmacy", address: "202 S Park St", city: "Madison" },
    { name: "UW Health Pharmacy", address: "1 S Park St", city: "Madison" },
  ],
};

export default function StatePharmacyFinder({ selectedState = "" }) {
  const [zip, setZip] = useState("");
  const [resolvedState, setResolvedState] = useState(null);
  const [pharmacies, setPharmacies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const activeState = selectedState || resolvedState?.state;
  const cvsAvailable = activeState ? CVS_STATES.has(activeState) : null;

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = zip.trim();
    if (!trimmed) return;
    setLoading(true); setError(null); setPharmacies(null); setExpanded({});
    try {
      // Step 1: geocode ZIP → state
      const geoRes = await fetch(`/api/geocode/zip?zip=${trimmed}`);
      if (!geoRes.ok) throw new Error((await geoRes.json().catch(() => ({}))).detail || "ZIP not found");
      const geoData = await geoRes.json();
      setResolvedState(geoData);

      // Step 2: filter hardcoded certified pharmacy list
      const list = LOCAL_PHARMACIES[geoData.state] || [];

      if (list.length === 0) { setPharmacies([]); setLoading(false); return; }

      // Step 3: enrich each pharmacy with phone/hours via Places API
      const enriched = await Promise.all(
        list.map(p =>
          fetch(`/api/places/pharmacy-details?name=${encodeURIComponent(p.name)}&city=${encodeURIComponent(p.city)}&state=${geoData.state}`)
            .then(r => r.ok ? r.json() : {})
            .catch(() => ({}))
            .then(d => ({ ...p, phone: d.phone || null, hours: d.hours || null }))
        )
      );
      setPharmacies(enriched);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* ── Section 1: Local Pharmacies by ZIP ── */}
      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-800)", marginBottom: "10px" }}>
        Local Pharmacies
      </div>

      {/* ZIP form + directory link */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
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
        <a href="https://medicationabortionpharmacies.com/" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none" }}>
          Full pharmacy directory ↗
        </a>
      </form>

      {error && (
        <p style={{ fontSize: "13px", color: "#DC2626", margin: "0 0 8px" }}>{error}</p>
      )}

      {pharmacies !== null && pharmacies.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--yk-ink-500)", margin: "0 0 8px" }}>
          No pharmacies on file for this state. See the national options below or visit{" "}
          <a href="https://medicationabortionpharmacies.com/" target="_blank" rel="noopener noreferrer"
            style={{ color: "#2563EB" }}>
            medicationabortionpharmacies.com
          </a>.
        </p>
      )}

      {pharmacies && pharmacies.length > 0 && (
        <>
          <p style={{ fontSize: "12px", color: "var(--yk-ink-500)", margin: "0 0 8px" }}>
            REMS-certified pharmacies in {resolvedState?.state_name || activeState}. Call ahead to confirm mifepristone availability.
          </p>
          {pharmacies.map((p, i) => {
            const key = p.name;
            const isOpen = expanded[key];
            return (
              <div key={i} style={{
                border: "1px solid var(--yk-ink-150)", borderRadius: "8px",
                padding: "10px 14px", marginBottom: "8px", background: "white",
              }}>
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-900)", marginBottom: "3px" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--yk-ink-600)" }}>
                  {p.address}, {p.city}, {resolvedState?.state || activeState}
                </div>
                {p.phone && (
                  <div style={{ fontSize: "12.5px", marginTop: "3px" }}>
                    <a href={`tel:${p.phone.replace(/\D/g, "")}`} style={{ color: "var(--yk-sage-700)", fontWeight: 600, textDecoration: "none" }}>
                      📞 {p.phone}
                    </a>
                  </div>
                )}
                {p.hours && p.hours.length > 0 && (
                  <div style={{ marginTop: "6px" }}>
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        fontSize: "12px", color: "#2563EB", textDecoration: "underline",
                      }}
                    >
                      {isOpen ? "Hide hours" : "Show hours"}
                    </button>
                    {isOpen && (
                      <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "12px", color: "var(--yk-ink-600)", lineHeight: "1.7" }}>
                        {p.hours.map((line, j) => <li key={j}>{line}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── Section 2: National / Mail-Order ── */}
      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-800)", marginBottom: "10px" }}>
        National &amp; Mail-Order Pharmacies
      </div>

      {/* CVS */}
      <div style={{ border: "1px solid var(--yk-ink-150)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-900)" }}>CVS Pharmacy</span>
          {cvsAvailable === true && (
            <span style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7", borderRadius: "999px", padding: "2px 10px", fontSize: "11.5px", fontWeight: 600 }}>
              ✓ Available in {selectedState}
            </span>
          )}
          {cvsAvailable === false && (
            <span style={{ background: "var(--yk-ink-100)", color: "var(--yk-ink-500)", border: "1px solid var(--yk-ink-200)", borderRadius: "999px", padding: "2px 10px", fontSize: "11.5px", fontWeight: 600 }}>
              Not available in {selectedState}
            </span>
          )}
        </div>
        <a href="https://www.cvshealth.com/news/pharmacy/mifepristone-dispensing-at-cvs-pharmacy-faq.html"
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
          CVS mifepristone FAQ ↗
        </a>
      </div>

      {/* Walgreens */}
      <div style={{ border: "1px solid var(--yk-ink-150)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", background: "white" }}>
        <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-900)", marginBottom: "4px" }}>Walgreens</div>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--yk-ink-600)" }}>
          Call <a href="tel:18774327596" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>1-877-432-7596</a> to confirm mifepristone availability.
        </p>
      </div>

      {/* Honeybee Health */}
      <div style={{ border: "1px solid var(--yk-ink-150)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-900)" }}>Honeybee Health</span>
          <span style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>Mail-order · REMS certified</span>
        </div>
        <a href="https://honeybeehealth.com" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none" }}>honeybeehealth.com ↗</a>
      </div>

      {/* Aid Access */}
      <div style={{ border: "1px solid var(--yk-ink-150)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-900)" }}>Aid Access</span>
          <span style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>Mail-order · all 50 states</span>
        </div>
        <a href="https://aidaccess.org" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none" }}>aidaccess.org ↗</a>
      </div>

      {/* Plan C */}
      <div style={{ border: "1px solid var(--yk-ink-150)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--yk-ink-900)" }}>Plan C Directory</span>
          <span style={{ fontSize: "11.5px", color: "var(--yk-ink-500)" }}>State-by-state guide</span>
        </div>
        <a href="https://www.plancpills.org" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none" }}>plancpills.org ↗</a>
      </div>

    </div>
  );
}
