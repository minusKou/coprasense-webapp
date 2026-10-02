// Grading logic + settings helpers for the CopraSense system.
//
// PNS/BAFS 43:2009 — "Copra — Specification" — Table 1
// Grade boundaries by average moisture of the batch's copra samples:
//   Grade 1: 6.0 – 7.9%   (Superior — clean, white to pale yellow)
//   Grade 2: 8.0 – 10.9%  (Standard — brown to dark brown tolerated)
//   Grade 3: 11.0 – 13.9% (Sub-standard — brown to dark brown)
// Outside 6.0–13.9% → Rejected.
//
// Additional quality factors (color, mold, ARM, inferior copra %) can
// downgrade a batch from the moisture-derived grade.

export const DEFAULT_SETTINGS = {
  orgName: "CopraSense",
  grade1Max: 7.9,
  grade2Max: 10.9,
  grade3Max: 13.9,
  flagAt: 10.9,
  rejectMin: 6,
  rejectMax: 13.9,
  complianceTarget: 85,
};

const SETTINGS_KEY = "coprasense_settings_v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {}
}

/**
 * Classify a batch per PNS/BAFS 43:2009 Table 1.
 *
 * Uses the settings-configurable thresholds so operators can adjust for
 * local trading requirements, but defaults match the national standard.
 *
 * Visual quality factors (color, mold) can only downgrade, never upgrade.
 */
export function classifyBatch(avgMoisture, samples, settings) {
  const rejectMin = settings.rejectMin ?? 6;
  const rejectMax = settings.rejectMax ?? 13.9;

  // Outside the acceptable moisture window → reject.
  if (avgMoisture < rejectMin || avgMoisture > rejectMax) {
    const grade = avgMoisture < rejectMin ? 1 : 3;
    return { grade, status: "Rejected" };
  }

  // Moisture-based grade
  let grade;
  if (avgMoisture <= (settings.grade1Max ?? 7.9)) grade = 1;
  else if (avgMoisture <= (settings.grade2Max ?? 10.9)) grade = 2;
  else grade = 3;

  // ── Visual downgrade factors (PNS/BAFS 43:2009) ──────────────────
  // Grade 1 requires "clean, white to pale yellow" meat color.
  // Any dark color or mold presence forces at least Grade 2.
  if (samples && samples.length > 0) {
    const hasDark = samples.some((s) => s.color === "dark");
    const hasSlightlyDark = samples.some((s) => s.color === "slightly-dark");
    const hasMold = samples.some((s) => s.mold);

    if (hasDark && grade < 3) {
      grade = Math.max(grade, 2);
    }
    if (hasSlightlyDark && grade < 2) {
      grade = Math.max(grade, 2);
    }
    if (hasMold && grade < 2) {
      grade = Math.max(grade, 2);
    }
  }

  // Flagged status: moisture above the flagAt threshold but not rejected
  const status = avgMoisture > (settings.flagAt ?? 10.9) ? "Flagged" : "Passed";

  return { grade, status };
}

export function computeAverage(samples) {
  if (!samples || !samples.length) return 0;
  return samples.reduce((sum, s) => sum + (s.moisture || 0), 0) / samples.length;
}

export function nextBatchId(existing) {
  const nums = (existing || [])
    .map((b) => (b.batch_id.match(/(\d+)$/) || [])[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 231) + 1;
  return "CP-" + String(next).padStart(4, "0");
}

export const colorLabel = (v) =>
  ({ standard: "Standard", "slightly-dark": "Slightly dark", dark: "Dark" }[v] || v);
export const textureLabel = (v) =>
  ({ firm: "Firm", soft: "Soft", brittle: "Brittle" }[v] || v);
export const moldLabel = (v) => (v ? "Mold" : "None");

export function fmtDate(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

export const gradeColors = {
  1: "#2F6E48",
  2: "#B8862E",
  3: "#B4453B",
};

export const gradeBg = {
  1: "#DCEBE1",
  2: "#F6E9CE",
  3: "#F6DEDB",
};

export function gradeRangeLabel(g) {
  return { 1: "6.0–7.9%", 2: "8.0–10.9%", 3: "11.0–13.9%" }[g] || "";
}