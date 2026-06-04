/**
 * Clinical logic tests for Yukti frontend.
 * Run with: cd client && npm test -- --watchAll=false
 */

// ── SRU 2013 EPL criteria derivation ─────────────────────────────────────────
// Mirrors the logic in App.js buildClinicalContext()

function deriveSRUConclusion({ crl, msd, usNoEmbryo, cardiac, usSinceNoYS, usSinceWithYS }) {
  const criteria = [];
  if (crl != null && crl >= 7 && cardiac === "absent" && !usNoEmbryo)
    criteria.push(`CRL ${crl}mm without cardiac activity (≥7mm threshold met)`);
  if (msd != null && msd >= 25 && usNoEmbryo)
    criteria.push(`MSD ${msd}mm without embryo (≥25mm threshold met)`);
  if (usSinceNoYS === "ge11d")
    criteria.push("Gestational sac without yolk sac ≥11 days after first scan");
  if (usSinceWithYS === "ge11d")
    criteria.push("Gestational sac with yolk sac without embryo ≥11 days after scan");
  return criteria;
}

describe("SRU 2013 Definitive EPL Criteria", () => {
  test("MSD ≥25mm without embryo → definitive EPL", () => {
    const result = deriveSRUConclusion({ msd: 30, usNoEmbryo: true });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain("MSD 30mm");
  });

  test("MSD 24mm without embryo → NOT definitive (below threshold)", () => {
    const result = deriveSRUConclusion({ msd: 24, usNoEmbryo: true });
    expect(result.length).toBe(0);
  });

  test("CRL ≥7mm without cardiac activity → definitive EPL", () => {
    const result = deriveSRUConclusion({ crl: 8, cardiac: "absent", usNoEmbryo: false });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain("CRL 8mm");
  });

  test("CRL 6mm without cardiac → NOT definitive (below 7mm threshold)", () => {
    const result = deriveSRUConclusion({ crl: 6, cardiac: "absent", usNoEmbryo: false });
    expect(result.length).toBe(0);
  });

  test("Serial scan ≥11 days without yolk sac → definitive EPL", () => {
    const result = deriveSRUConclusion({ usSinceNoYS: "ge11d" });
    expect(result.length).toBeGreaterThan(0);
  });

  test("Serial scan <11 days → NOT definitive", () => {
    const result = deriveSRUConclusion({ usSinceNoYS: "lt11d" });
    expect(result.length).toBe(0);
  });

  test("Multiple criteria can be met simultaneously", () => {
    const result = deriveSRUConclusion({ msd: 30, usNoEmbryo: true, usSinceNoYS: "ge11d" });
    expect(result.length).toBe(2);
  });

  test("No abnormal findings → no criteria triggered", () => {
    const result = deriveSRUConclusion({});
    expect(result.length).toBe(0);
  });
});


// ── hCG discriminatory zone logic ─────────────────────────────────────────────

function classifyHCG(hcg) {
  if (hcg >= 10000) return "emergent";
  if (hcg >= 3500)  return "urgent";
  return "below-dz";
}

describe("hCG Discriminatory Zone Classification", () => {
  test("hCG ≥10000 → emergent", () => {
    expect(classifyHCG(10000)).toBe("emergent");
    expect(classifyHCG(25000)).toBe("emergent");
  });

  test("hCG 3500-9999 → urgent", () => {
    expect(classifyHCG(3500)).toBe("urgent");
    expect(classifyHCG(5000)).toBe("urgent");
    expect(classifyHCG(9999)).toBe("urgent");
  });

  test("hCG <3500 → below discriminatory zone", () => {
    expect(classifyHCG(1000)).toBe("below-dz");
    expect(classifyHCG(3499)).toBe("below-dz");
  });
});


// ── Serial hCG rise thresholds (ACCESS-Bridge) ────────────────────────────────

function minExpectedRise(baselineHCG) {
  if (baselineHCG < 1500) return 49;
  if (baselineHCG <= 3000) return 40;
  return 33;
}

function classifyHCGTrend(baseline, followUp) {
  const pct = ((followUp - baseline) / baseline) * 100;
  const minRise = minExpectedRise(baseline);
  if (pct <= -50) return "spontaneous-resolution";
  if (pct < 0)    return "inadequate-decline";
  if (pct >= minRise) return "normal-rise";
  return "abnormal-rise";
}

describe("Serial hCG Trend Classification", () => {
  test("≥50% decline → spontaneous resolution", () => {
    expect(classifyHCGTrend(2000, 900)).toBe("spontaneous-resolution");
    expect(classifyHCGTrend(1000, 400)).toBe("spontaneous-resolution");
  });

  test("<50% decline → inadequate decline", () => {
    expect(classifyHCGTrend(2000, 1500)).toBe("inadequate-decline");
  });

  test("Rise ≥49% for baseline <1500 → normal", () => {
    expect(classifyHCGTrend(1000, 1500)).toBe("normal-rise");  // 50% rise
  });

  test("Rise ≥40% for baseline 1500-3000 → normal", () => {
    expect(classifyHCGTrend(2000, 2900)).toBe("normal-rise");  // 45% rise
  });

  test("Rise ≥33% for baseline >3000 → normal", () => {
    expect(classifyHCGTrend(4000, 5500)).toBe("normal-rise");  // 37.5% rise
  });

  test("Subthreshold rise → abnormal", () => {
    expect(classifyHCGTrend(1000, 1100)).toBe("abnormal-rise");  // 10% — below 49%
    expect(classifyHCGTrend(4000, 4500)).toBe("abnormal-rise");  // 12.5% — below 33%
  });
});


// ── Contraception MEC weight logic ────────────────────────────────────────────

function ecRecommendation(hoursPostUPS, weightGe75, wantsSameDayHormonal) {
  if (hoursPostUPS > 120) return "refer-iud";
  if (hoursPostUPS > 72)  return "ella";
  if (weightGe75)         return "ella-weight";
  if (wantsSameDayHormonal) return "plan-b";
  return "ella-preferred";
}

describe("Emergency Contraception Recommendation Logic", () => {
  test(">120hrs → refer for IUD", () => {
    expect(ecRecommendation(121, false, true)).toBe("refer-iud");
  });

  test("73-120hrs → ella regardless of weight", () => {
    expect(ecRecommendation(96, false, true)).toBe("ella");
    expect(ecRecommendation(96, true, true)).toBe("ella");
  });

  test("≤72hrs + weight ≥75kg → ella preferred over Plan B", () => {
    expect(ecRecommendation(48, true, true)).toBe("ella-weight");
  });

  test("≤72hrs + normal weight + same-day hormonal → Plan B", () => {
    expect(ecRecommendation(24, false, true)).toBe("plan-b");
  });

  test("≤72hrs + no same-day hormonal → ella preferred", () => {
    expect(ecRecommendation(24, false, false)).toBe("ella-preferred");
  });
});
