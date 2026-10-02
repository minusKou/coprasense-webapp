// Grading logic + settings helpers for the CopraSense system.
// Acceptable moisture window: 6.0–13.0%. Anything outside is REJECTED.
// Grade ranges (by average moisture of the batch's copra samples):
//   Grade 1: 6.0  – 7.9
//   Grade 2: 8.0  – 10.9
//   Grade 3: 11.0 – 13.0
// Dark color, brittle texture, or detected mold flags an otherwise-passing batch.

export const DEFAULT_SETTINGS = {
  orgName: "CopraSense",
  grade1Max: 7.9,
  grade2Max: 10.9,
  grade3Max: 13.9,
  flagAt: 10.9,
  rejectMin: 6,
  rejectMax: 13,
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

export function classifyBatch(avgMoisture, samples, settings) {
  const rejectMin = settings.rejectMin ?? 6;
  const rejectMax = settings.rejectMax ?? 13;

  // Grading is based solely on the moisture percentage.
  // Outside the acceptable moisture window → reject.
  if (avgMoisture < rejectMin || avgMoisture > rejectMax) {
    const grade = avgMoisture < rejectMin ? 1 : 3;
    return { grade, status: "Rejected" };
  }

  let grade;
  if (avgMoisture <= settings.grade1Max) grade = 1;
  else if (avgMoisture <= settings.grade2Max) grade = 2;
  else grade = 3;

  return { grade, status: "Passed" };
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
  return { 1: "6.0–7.9%", 2: "8.0–10.9%", 3: "11.0–13.0%" }[g] || "";
}