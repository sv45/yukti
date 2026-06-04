import React, { useState } from "react";

const IMPRESSIONS = [
  { value: "iup",            label: "Intrauterine pregnancy" },
  { value: "pul",            label: "Pregnancy of Unknown Location" },
  { value: "ectopic",        label: "Ectopic pregnancy" },
  { value: "definitive-epl", label: "Early pregnancy loss" },
];

const INTENTIONS = [
  { value: "desired",   label: "Desired" },
  { value: "undecided", label: "Undecided" },
  { value: "undesired", label: "Undesired" },
];

const TAB_LABELS = {
  "epl":          "Early Pregnancy Loss",
  "med-abortion": "Medication Abortion",
  "pul-ectopic":  "Pregnancy of Unknown Location & Ectopic Pregnancy",
};

export default function EntryPresentation({
  onConfirm, onSkip, recommendPathway,
  entryState, setEntryState, US_STATES,
  institutionId, setInstitutionId,
}) {
  const [intention,  setIntention]  = useState(null);
  const [impression, setImpression] = useState(null);

  const rec = intention && impression
    ? recommendPathway(intention, impression)
    : null;

  return (
    <div className="entry__pres">
      {/* State */}
      <div className="entry__section">
        <div className="entry__section-label">State</div>
        <select
          className={`entry__select${entryState ? ' entry__select--selected' : ''}`}
          value={entryState}
          onChange={e => { setEntryState(e.target.value); setInstitutionId("other"); }}
        >
          <option value="">— choose state —</option>
          {US_STATES.map(s => (
            <option key={s.abbr} value={s.abbr}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Pregnancy intention */}
      <div className="entry__section">
        <div className="entry__section-label">Pregnancy intention</div>
        <div className="entry__btn-group">
          {INTENTIONS.map(opt => (
            <button
              key={opt.value}
              className={`entry__opt${intention === opt.value ? " entry__opt--active" : ""}`}
              onClick={() => setIntention(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ultrasound impression */}
      <div className="entry__section">
        <div className="entry__section-label">Ultrasound impression</div>
        <div className="entry__btn-group entry__btn-group--grid">
          {IMPRESSIONS.map(opt => (
            <button
              key={opt.value}
              className={`entry__opt${impression === opt.value ? " entry__opt--active" : ""}`}
              onClick={() => setImpression(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation card */}
      {rec && (
        rec.type === "outpatient" ? (
          <div className="entry__rec">
            <div className="entry__rec-label">Recommendation</div>
            <div className="entry__rec-pathway">Outpatient OB follow-up</div>
            <div className="entry__rec-reason">
              IUP confirmed with desired pregnancy. Prescribe prenatal vitamins and refer for obstetric care.
            </div>
            <div style={{ fontSize: '12px', color: 'var(--yk-ink-500)', marginBottom: '10px' }}>
              If the patient has bleeding or cramping, the Early Pregnancy Loss pathway may also be relevant.
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="entry__btn entry__btn--primary" onClick={() => onSkip("epl")}>
                Go to Early Pregnancy Loss →
              </button>
            </div>
          </div>
        ) : (
        <div className={`entry__rec${rec.urgent ? " entry__rec--urgent" : ""}`}>
          {rec.urgent && (
            <div className="entry__rec-urgent-banner">⚠ Urgent evaluation recommended</div>
          )}
          <div className="entry__rec-label">Recommended pathway</div>
          <div className="entry__rec-pathway">{TAB_LABELS[rec.tab]}</div>
          <button
            className="entry__btn entry__btn--primary"
            onClick={() => onConfirm(impression, intention, rec.tab)}
          >
            Go →
          </button>
        </div>
        )
      )}

    </div>
  );
}
