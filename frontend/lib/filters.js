// Shared by server pages (to prefetch) and client hooks (to fetch), so both
// derive the exact same query key from the URL.
import { PAGE_SIZE } from "./constants";

const get = (sp, key) => {
  const v = typeof sp?.get === "function" ? sp.get(key) : sp?.[key];
  return (Array.isArray(v) ? v[0] : v) || "";
};
const page = (sp) => Math.max(1, parseInt(get(sp, "page"), 10) || 1);

export function parseDoctorFilters(sp) {
  return {
    q: get(sp, "q"),
    specialization: get(sp, "specialization"),
    hospital: get(sp, "hospital"),
    from: get(sp, "from"),
    to: get(sp, "to"),
    sort: get(sp, "sort") || "newest",
    page: page(sp),
    limit: PAGE_SIZE,
  };
}

export function parsePatientFilters(sp) {
  return {
    q: get(sp, "q"),
    condition: get(sp, "condition"),
    gender: get(sp, "gender"),
    doctor: get(sp, "doctor"),
    from: get(sp, "from"),
    to: get(sp, "to"),
    minAge: get(sp, "minAge"),
    maxAge: get(sp, "maxAge"),
    sort: get(sp, "sort") || "newest",
    page: page(sp),
    limit: PAGE_SIZE,
  };
}

export const DASHBOARD_RANGES = [3, 6, 12];
export function parseMonths(sp) {
  const m = Number(get(sp, "months"));
  return { months: DASHBOARD_RANGES.includes(m) ? m : 6 };
}

/** Drops empty values so URLs and query keys stay clean and stable. */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));
}

export const toQueryString = (obj) => new URLSearchParams(compact(obj)).toString();

export const queryKeys = {
  dashboard: (months) => ["dashboard", months],
  doctors: (filters) => ["doctors", compact(filters)],
  doctor: (id) => ["doctor", id],
  doctorOptions: ["doctor-options"],
  patients: (filters) => ["patients", compact(filters)],
};
