export const PAGE_SIZE = 10;

// Patient condition is a *state*, so it uses the reserved status colours,
// always paired with a label (never colour alone).
export const CONDITIONS = [
  { value: "stable", label: "Stable", color: "var(--status-good)" },
  { value: "recovering", label: "Recovering", color: "var(--status-info)" },
  { value: "observation", label: "Under observation", color: "var(--status-warning)" },
  { value: "critical", label: "Critical", color: "var(--status-critical)" },
  { value: "discharged", label: "Discharged", color: "var(--status-neutral)" },
];
export const CONDITION_MAP = Object.fromEntries(CONDITIONS.map((c) => [c.value, c]));

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];
export const GENDER_MAP = Object.fromEntries(GENDERS.map((g) => [g.value, g]));

export const DOCTOR_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
];
export const PATIENT_SORTS = [
  { value: "newest", label: "Recently admitted" },
  { value: "oldest", label: "Earliest admitted" },
  { value: "name", label: "Name A–Z" },
  { value: "age", label: "Youngest first" },
];
