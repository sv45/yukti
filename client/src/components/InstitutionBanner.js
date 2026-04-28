import React from "react";

export default function InstitutionBanner({ institution }) {
  if (institution !== "nypq") return null;

  return (
    <div className="bg-[#1a5f7a] text-white text-sm text-center py-2 px-4 font-medium tracking-wide">
      NYP Queens institutional protocols active
    </div>
  );
}
