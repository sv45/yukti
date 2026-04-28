import React from "react";

const PATHWAYS = {
  epl: {
    label: "Early Pregnancy Loss",
    description: "Diagnosis and management of miscarriage in the ED",
  },
  ectopic: {
    label: "PUL / Ectopic",
    description: "Workup for pregnancy of unknown location and ectopic pregnancy",
  },
  mab: {
    label: "Medication Abortion",
    description: "Eligibility assessment and initiation of medication abortion",
  },
  ec: {
    label: "Contraception & EC",
    description: "Emergency contraception and contraception initiation",
  },
};

export default function PathwayPanel({ pathway }) {
  const info = PATHWAYS[pathway] || { label: pathway, description: "" };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-8 py-16">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-[#e8f4f8] flex items-center justify-center mb-5">
        <svg
          className="w-8 h-8 text-[#1a5f7a]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* Pathway name */}
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{info.label}</h2>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-5 max-w-xs leading-relaxed">
        {info.description}
      </p>

      {/* Coming soon badge */}
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1a5f7a] text-white tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-[#7ec8e3] animate-pulse" aria-hidden="true" />
        Coming soon
      </span>
    </div>
  );
}
