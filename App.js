import React, { useState, useEffect, useRef } from "react";
import "./styles/tokens.css";
import logo from "./assets/yukti-logo.png";
import EPLPathway from "./components/EPLPathway";
import MedicationAbortionPathway from "./components/MedicationAbortionPathway";
import ContraceptionPathway from "./components/ContraceptionPathway";
import AskYukti from "./components/AskYukti";

// ─── institution config ───────────────────────────────────────────────────────

const INSTITUTIONS = {
  memorial: { name: "Memorial Hospital", loc: "New York, NY", initial: "M" },
  other:    { name: "Other", loc: "—", initial: "?" },
};

const STATE_TO_INSTITUTION = { NY: "memorial" };

// ─── US states + territories ──────────────────────────────────────────────────

const STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["DC","District of Columbia"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],
  ["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["PR","Puerto Rico"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],
  ["UT","Utah"],["VT","Vermont"],["VA","Virginia"],["WA","Washington"],
  ["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];

const TABS = [
  { id: "epl",           label: "EPL",                       pathway: "epl" },
  { id: "mab",           label: "Medication Abortion",        pathway: "mab" },
  { id: "contraception", label: "Contraception & EC",         pathway: "contraception" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

// ─── entry screen ─────────────────────────────────────────────────────────────

function EntryScreen({ onDone }) {
  const [selectedState, setSelectedState] = useState("");
  const [institutionConfirm, setInstitutionConfirm] = useState(null); // null | "yes" | "no"

  const matchedInstitutionId = selectedState ? STATE_TO_INSTITUTION[selectedState] : null;
  const matchedInstitution   = matchedInstitutionId ? INSTITUTIONS[matchedInstitutionId] : null;

  const canProceed = selectedState && (
    !matchedInstitution ||
    institutionConfirm !== null
  );

  const handleContinue = () => {
    if (!canProceed) return;
    const instId = matchedInstitution && institutionConfirm === "yes"
      ? matchedInstitutionId
      : "other";
    onDone({ selectedState, institutionId: instId });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--yk-sage-500, #96a695)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
      }}>
        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logo} alt="Yukti" style={{ height: 72, marginBottom: 14 }} />
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: "var(--yk-ink-900, #111)",
            letterSpacing: "-0.02em",
          }}>yukti</h1>
          <p style={{
            margin: "8px 0 0",
            fontSize: 14,
            fontStyle: "italic",
            color: "var(--yk-ink-500, #888)",
            lineHeight: 1.5,
          }}>
            Clinical decision support for reproductive health emergencies in the ED
          </p>
        </div>

        {/* State select */}
        <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--yk-ink-500)", display: "block", marginBottom: 6 }}>
          Select your state
        </label>
        <select
          value={selectedState}
          onChange={(e) => { setSelectedState(e.target.value); setInstitutionConfirm(null); }}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid var(--yk-ink-300, #d4d4d0)",
            fontSize: 15,
            color: selectedState ? "var(--yk-ink-900)" : "var(--yk-ink-400)",
            background: "#fff",
            appearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
          }}
        >
          <option value="">— Select state —</option>
          {STATES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        {/* Institution confirmation — only for registered states */}
        {matchedInstitution && (
          <div style={{
            marginTop: 20,
            padding: "16px 18px",
            background: "var(--yk-sage-50, #f4f6f4)",
            border: "1px solid var(--yk-sage-300, #c4d0c3)",
            borderRadius: 9,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--yk-ink-700, #444)", lineHeight: 1.5 }}>
              We have a registered protocol for <strong>{matchedInstitution.name}</strong> — is this your institution?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {["yes", "no"].map((v) => (
                <button
                  key={v}
                  onClick={() => setInstitutionConfirm(v)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 7,
                    border: institutionConfirm === v
                      ? "1.5px solid var(--yk-sage-500)"
                      : "1px solid var(--yk-ink-300)",
                    background: institutionConfirm === v ? "var(--yk-sage-500)" : "#fff",
                    color: institutionConfirm === v ? "#fff" : "var(--yk-ink-700)",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {v === "yes" ? "Yes" : "No, use general guidelines"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!canProceed}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "13px 0",
            borderRadius: 9,
            border: "none",
            background: canProceed ? "var(--yk-sage-500)" : "var(--yk-ink-200, #e8e8e6)",
            color: canProceed ? "#fff" : "var(--yk-ink-400)",
            fontWeight: 700,
            fontSize: 16,
            cursor: canProceed ? "pointer" : "default",
            transition: "all 0.15s",
          }}
        >
          Continue
        </button>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--yk-ink-400)", marginTop: 16, marginBottom: 0, lineHeight: 1.5 }}>
          For use by licensed clinicians only. Not a substitute for clinical judgment.
        </p>
      </div>
    </div>
  );
}

// ─── header ───────────────────────────────────────────────────────────────────

function Header({ selectedState, institutionId, activeTab, onTabChange }) {
  const institution = INSTITUTIONS[institutionId];
  const stateName = STATES.find(([code]) => code === selectedState)?.[1] || selectedState;

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "var(--yk-sage-500, #96a695)",
    }}>
      {/* Top bar */}
      <div style={{
        height: "var(--yk-header-h, 60px)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 14,
      }}>
        <img src={logo} alt="Yukti" style={{ height: 32 }} />
        <span style={{
          fontWeight: 700,
          fontSize: 18,
          color: "#fff",
          letterSpacing: "-0.01em",
        }}>yukti</span>
        <div style={{
          marginLeft: "auto",
          fontSize: 13,
          color: "rgba(255,255,255,0.85)",
          fontWeight: 500,
        }}>
          {stateName}
          {institutionId !== "other" && (
            <span style={{ opacity: 0.7 }}> · {institution.name}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        height: "var(--yk-tabs-h, 44px)",
        display: "flex",
        alignItems: "stretch",
        borderTop: "1px solid rgba(255,255,255,0.18)",
        padding: "0 8px",
        gap: 2,
      }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: "0 16px",
                border: "none",
                background: active ? "rgba(255,255,255,0.18)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.65)",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── mobile chat bubble ───────────────────────────────────────────────────────

function MobileChatBubble({ hasUnread, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 24,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "var(--yk-sage-500)",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      {/* Chat icon */}
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 2C6.03 2 2 5.58 2 10c0 2.1.88 4.01 2.32 5.45L3 20l4.68-1.27C9 19.54 9.97 19.75 11 19.75 15.97 19.75 20 16.17 20 11.75 20 7.33 15.97 2 11 2z" fill="rgba(255,255,255,0.9)"/>
      </svg>
      {hasUnread && (
        <span style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#ff3d88",
          border: "2px solid #fff",
        }} />
      )}
    </button>
  );
}

// ─── mobile chat drawer ───────────────────────────────────────────────────────

function MobileChatDrawer({ open, onClose, children }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 210,
          }}
        />
      )}
      {/* Drawer */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "75vh",
        background: "#fff",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: 220,
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--yk-ink-200)" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── main app ─────────────────────────────────────────────────────────────────

export default function App() {
  const [entryDone, setEntryDone]       = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [institutionId, setInstitutionId] = useState("other");
  const [activeTab, setActiveTab]        = useState("epl");

  // MAB legal status — fetched once per state
  const [legalStatus, setLegalStatus]   = useState(null);
  const [legalLoading, setLegalLoading] = useState(false);

  // Chat state
  const [chatUnread, setChatUnread]     = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);

  const isMobile = useIsMobile();

  // Fetch abortion legal status whenever state changes
  useEffect(() => {
    if (!selectedState) return;
    setLegalStatus(null);
    setLegalLoading(true);
    fetch(`/api/abortion-status?state=${selectedState}`)
      .then((r) => r.json())
      .then((data) => setLegalStatus(data))
      .catch(() => setLegalStatus(null))
      .finally(() => setLegalLoading(false));
  }, [selectedState]);

  // ── EPL app-level state (passed into EPLPathway) ──
  const [gaWeeks, setGaWeeks]               = useState("");
  const [gaDays, setGaDays]                 = useState("");
  const [rhStatus, setRhStatus]             = useState(null);
  const [hemoStatus, setHemoStatus]         = useState(null);
  const [bleedSeverity, setBleedSeverity]   = useState(null);
  const [signsOfInfection, setSignsOfInfection] = useState(null);
  const [tissuePassed, setTissuePassed]     = useState(null);
  const [tissueAtOs, setTissueAtOs]         = useState(null);
  const [usImpression, setUsImpression]     = useState(null);
  const [usGestSac, setUsGestSac]           = useState(null);
  const [usYolkSac, setUsYolkSac]           = useState(null);
  const [usNoEmbryo, setUsNoEmbryo]         = useState(false);
  const [usCrl, setUsCrl]                   = useState("");
  const [usCardiac, setUsCardiac]           = useState(null);
  const [usMsd, setUsMsd]                   = useState("");
  const [usSinceNoYS, setUsSinceNoYS]       = useState(null);
  const [usSinceWithYS, setUsSinceWithYS]   = useState(null);
  const [freeFluid, setFreeFluid]           = useState(null);
  const [hcgOpen, setHcgOpen]               = useState(false);
  const [hcg, setHcg]                       = useState("");
  const [hcg48, setHcg48]                   = useState("");

  // ── entry done handler ──
  const handleEntryDone = ({ selectedState: s, institutionId: i }) => {
    setSelectedState(s);
    setInstitutionId(i);
    setEntryDone(true);
  };

  // ── chat unread handler ──
  const handleChatResponse = () => {
    if (isMobile && !chatOpen) setChatUnread(true);
  };

  const handleChatOpen = () => {
    setChatOpen(true);
    setChatUnread(false);
  };

  // ── active pathway for AskYukti context ──
  const activePathway = TABS.find((t) => t.id === activeTab)?.pathway || "epl";

  if (!entryDone) return <EntryScreen onDone={handleEntryDone} />;

  const epl_state = {
    gaWeeks, setGaWeeks, gaDays, setGaDays,
    rhStatus, setRhStatus, hemoStatus, setHemoStatus,
    bleedSeverity, setBleedSeverity, signsOfInfection, setSignsOfInfection,
    tissuePassed, setTissuePassed, tissueAtOs, setTissueAtOs,
    usImpression, setUsImpression, usGestSac, setUsGestSac,
    usYolkSac, setUsYolkSac, usNoEmbryo, setUsNoEmbryo,
    usCrl, setUsCrl, usCardiac, setUsCardiac,
    usMsd, setUsMsd, usSinceNoYS, setUsSinceNoYS,
    usSinceWithYS, setUsSinceWithYS, freeFluid, setFreeFluid,
    hcgOpen, setHcgOpen, hcg, setHcg, hcg48, setHcg48,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--yk-ink-50, #fafaf9)" }}>
      <Header
        selectedState={selectedState}
        institutionId={institutionId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: "flex",
        maxWidth: isMobile ? "100%" : 1200,
        width: "100%",
        margin: "0 auto",
        padding: isMobile ? 0 : "0 16px",
      }}>
        {/* Pathway content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: isMobile ? 0 : (activeTab ? 16 : 0),
        }}>
          {activeTab === "epl" && (
            <EPLPathway
              institutionId={institutionId}
              {...epl_state}
            />
          )}

          {activeTab === "mab" && (
            <MedicationAbortionPathway
              institutionId={institutionId}
              selectedState={selectedState}
              legalStatus={legalLoading ? null : legalStatus}
            />
          )}

          {activeTab === "contraception" && (
            <ContraceptionPathway
              institutionId={institutionId}
              selectedState={selectedState}
            />
          )}
        </div>

        {/* AskYukti rail — desktop only */}
        {!isMobile && (
          <div style={{
            width: "var(--yk-rail-w, 360px)",
            flexShrink: 0,
            borderLeft: "1px solid var(--yk-ink-200, #e8e8e6)",
            height: "calc(100vh - var(--yk-header-h) - var(--yk-tabs-h))",
            position: "sticky",
            top: "calc(var(--yk-header-h) + var(--yk-tabs-h))",
            overflow: "hidden",
          }}>
            <AskYukti
              pathway={activePathway}
              institutionId={institutionId}
              onResponse={handleChatResponse}
            />
          </div>
        )}
      </div>

      {/* Mobile chat bubble + drawer */}
      {isMobile && (
        <>
          <MobileChatBubble hasUnread={chatUnread} onClick={handleChatOpen} />
          <MobileChatDrawer open={chatOpen} onClose={() => setChatOpen(false)}>
            <AskYukti
              pathway={activePathway}
              institutionId={institutionId}
              onResponse={handleChatResponse}
            />
          </MobileChatDrawer>
        </>
      )}
    </div>
  );
}
