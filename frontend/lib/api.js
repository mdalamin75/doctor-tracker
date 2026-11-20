// Browser-side REST client. All calls go to /api on the same origin; Next.js
// proxies them to Express. The session cookie travels automatically.
import { toQueryString } from "./filters";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    signal,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    // Session expired mid-use → back to login, then return here afterwards.
    // A full page load is intentional here: it drops all in-memory state of the expired session.
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?next=${next}&expired=1`);
    throw new ApiError(401, "Session expired");
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback = res.status >= 500 ? `Server error (${res.status}). Check the backend terminal for details.` : `Request failed (${res.status})`;
    throw new ApiError(res.status, data?.error?.message || fallback, data?.error?.details);
  }
  return data;
}

const qs = (params) => {
  const s = toQueryString(params);
  return s ? `?${s}` : "";
};

export const api = {
  // auth
  login: (body) => request("/auth/login", { method: "POST", body }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // dashboard
  dashboard: (months, opts) => request(`/dashboard/stats${qs({ months })}`, opts),

  // doctors
  listDoctors: (filters, opts) => request(`/doctors${qs(filters)}`, opts),
  doctorOptions: (opts) => request("/doctors/options", opts),
  getDoctor: (id, opts) => request(`/doctors/${id}`, opts),
  createDoctor: (body) => request("/doctors", { method: "POST", body }),
  updateDoctor: (id, body) => request(`/doctors/${id}`, { method: "PATCH", body }),
  deleteDoctor: (id) => request(`/doctors/${id}`, { method: "DELETE" }),

  // patients
  listPatients: (filters, opts) => request(`/patients${qs(filters)}`, opts),
  listDoctorPatients: (doctorId, filters, opts) => request(`/doctors/${doctorId}/patients${qs(filters)}`, opts),
  createPatient: (body) => request("/patients", { method: "POST", body }),
  createDoctorPatient: (doctorId, body) => request(`/doctors/${doctorId}/patients`, { method: "POST", body }),
  updatePatient: (id, body) => request(`/patients/${id}`, { method: "PATCH", body }),
  deletePatient: (id) => request(`/patients/${id}`, { method: "DELETE" }),
  removeDoctorPatient: (doctorId, patientId) => request(`/doctors/${doctorId}/patients/${patientId}`, { method: "DELETE" }),
};
