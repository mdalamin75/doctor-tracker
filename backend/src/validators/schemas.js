import { z } from "zod";
import mongoose from "mongoose";
import { CONDITIONS, GENDERS } from "../models/Patient.js";

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid id");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const phone = z.string().trim().regex(/^\+?[\d\s()-]{6,20}$/, "Enter a valid phone number");
const emptyToUndefined = (v) => (v === "" || v === null ? undefined : v);
const optional = (schema) => z.preprocess(emptyToUndefined, schema.optional());

// ── Shared query pieces ──────────────────────────────────────────────────
const listBase = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: optional(z.string().trim().max(100)),
  from: optional(isoDate),
  to: optional(isoDate),
};

export const idParams = z.object({ id: objectId });
export const doctorPatientParams = z.object({ id: objectId, patientId: objectId });

// ── Auth ─────────────────────────────────────────────────────────────────
export const loginBody = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(128),
});

// ── Doctors ──────────────────────────────────────────────────────────────
export const doctorBody = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  specialization: z.string().trim().min(2, "Specialization is required").max(80),
  hospital: z.string().trim().min(2, "Hospital is required").max(120),
  phone,
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
});

export const doctorQuery = z.object({
  ...listBase,
  specialization: optional(z.string().trim().max(80)),
  hospital: optional(z.string().trim().max(120)),
  sort: z.enum(["newest", "oldest", "name"]).default("newest"),
});

// ── Patients ─────────────────────────────────────────────────────────────
export const patientBody = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  age: z.coerce.number({ invalid_type_error: "Age must be a number" }).int().min(0).max(130),
  gender: z.enum(GENDERS),
  phone: z.union([phone, z.literal("")]).default(""),
  email: z.union([z.string().trim().toLowerCase().email("Enter a valid email"), z.literal("")]).default(""),
  diagnosis: z.string().trim().max(200).default(""),
  condition: z.enum(CONDITIONS).default("stable"),
  admittedOn: z.coerce.date().refine((d) => d <= new Date(Date.now() + 86_400_000), "Date cannot be in the future"),
  doctor: objectId,
});

export const patientUpdateBody = patientBody.partial().refine((b) => Object.keys(b).length > 0, "Nothing to update");
export const doctorPatientBody = patientBody.omit({ doctor: true });

export const patientQuery = z.object({
  ...listBase,
  doctor: optional(objectId),
  condition: optional(z.enum(CONDITIONS)),
  gender: optional(z.enum(GENDERS)),
  minAge: optional(z.coerce.number().int().min(0).max(130)),
  maxAge: optional(z.coerce.number().int().min(0).max(130)),
  sort: z.enum(["newest", "oldest", "name", "age"]).default("newest"),
});

// ── Dashboard ────────────────────────────────────────────────────────────
export const dashboardQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});
