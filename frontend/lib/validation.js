// Client-side form validation — mirrors backend/src/validators/schemas.js
// so users get instant, field-level feedback. The API re-validates everything.
import { z } from "zod";

const phone = z.string().trim().regex(/^\+?[\d\s()-]{6,20}$/, "Enter a valid phone number");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const doctorSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  specialization: z.string().trim().min(2, "Specialization is required").max(80),
  hospital: z.string().trim().min(2, "Hospital is required").max(120),
  phone,
  email: z.string().trim().email("Enter a valid email").max(255),
});

export const patientSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  age: z.coerce.number({ invalid_type_error: "Enter an age" }).int("Whole years only").min(0, "Invalid age").max(130, "Invalid age"),
  gender: z.enum(["male", "female", "other"], { errorMap: () => ({ message: "Choose a gender" }) }),
  phone: z.union([phone, z.literal("")]),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]),
  diagnosis: z.string().trim().max(200),
  condition: z.enum(["stable", "recovering", "observation", "critical", "discharged"]),
  admittedOn: z.string().min(1, "Pick a date").refine((d) => d <= new Date().toISOString().slice(0, 10), "Date cannot be in the future"),
  doctor: z.string().min(1, "Choose a doctor"),
});

/** Returns { data, errors } where errors is { field: message }. */
export function validate(schema, values) {
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data, errors: {} };
  const errors = {};
  for (const issue of r.error.issues) errors[issue.path[0]] ??= issue.message;
  return { data: null, errors };
}
