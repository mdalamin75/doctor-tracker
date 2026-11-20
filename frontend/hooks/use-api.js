"use client";
// All server state lives in TanStack Query. Components never hold fetched
// data in useState — they read it from these hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/filters";

// ── Queries ──────────────────────────────────────────────────────────────
export const useDashboard = (months) =>
  useQuery({
    queryKey: queryKeys.dashboard(months),
    queryFn: ({ signal }) => api.dashboard(months, { signal }),
    placeholderData: keepPreviousData,
  });

export const useDoctors = (filters) =>
  useQuery({
    queryKey: queryKeys.doctors(filters),
    queryFn: ({ signal }) => api.listDoctors(filters, { signal }),
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads
  });

export const useDoctor = (id) =>
  useQuery({ queryKey: queryKeys.doctor(id), queryFn: ({ signal }) => api.getDoctor(id, { signal }), select: (r) => r.data });

export const useDoctorOptions = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.doctorOptions,
    queryFn: ({ signal }) => api.doctorOptions({ signal }),
    staleTime: 5 * 60_000,
    enabled,
  });

export const usePatients = (filters) =>
  useQuery({
    queryKey: queryKeys.patients(filters),
    queryFn: ({ signal }) =>
      filters.doctor ? api.listDoctorPatients(filters.doctor, { ...filters, doctor: undefined }, { signal }) : api.listPatients(filters, { signal }),
    placeholderData: keepPreviousData,
  });

// ── Mutations ────────────────────────────────────────────────────────────
// After any write we invalidate only the caches that can be affected.
function useInvalidate() {
  const qc = useQueryClient();
  return (...keys) => Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

const onError = (e) => toast.error(e.message || "Something went wrong");

export function useSaveDoctor(id) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body) => (id ? api.updateDoctor(id, body) : api.createDoctor(body)),
    onSuccess: () => {
      toast.success(id ? "Doctor updated" : "Doctor added");
      return invalidate(["doctors"], ["doctor-options"], ["dashboard"], ...(id ? [["doctor", id]] : []));
    },
  });
}

export function useDeleteDoctor() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id) => api.deleteDoctor(id),
    onSuccess: () => {
      toast.success("Doctor and their patients removed");
      return invalidate(["doctors"], ["doctor-options"], ["patients"], ["dashboard"]);
    },
    onError,
  });
}

export function useSavePatient({ id, doctorId } = {}) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body) => {
      if (id) return api.updatePatient(id, body);
      if (doctorId) return api.createDoctorPatient(doctorId, body);
      return api.createPatient(body);
    },
    onSuccess: () => {
      toast.success(id ? "Patient updated" : "Patient added");
      return invalidate(["patients"], ["doctors"], ["doctor"], ["dashboard"]);
    },
  });
}

export function useDeletePatient({ doctorId } = {}) {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id) => (doctorId ? api.removeDoctorPatient(doctorId, id) : api.deletePatient(id)),
    // Optimistic: drop the row immediately, roll back if the API refuses.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["patients"] });
      const snapshot = qc.getQueriesData({ queryKey: ["patients"] });
      qc.setQueriesData({ queryKey: ["patients"] }, (old) =>
        old?.data ? { ...old, data: old.data.filter((p) => p._id !== id), meta: { ...old.meta, total: old.meta.total - 1 } } : old
      );
      return { snapshot };
    },
    onError: (e, _id, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      onError(e);
    },
    onSuccess: () => toast.success(doctorId ? "Patient removed from this doctor" : "Patient deleted"),
    onSettled: () => invalidate(["patients"], ["doctors"], ["doctor"], ["dashboard"]),
  });
}
