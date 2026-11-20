import mongoose from "mongoose";
import { buildKeywords } from "../utils/search.js";

export const CONDITIONS = ["stable", "recovering", "observation", "critical", "discharged"];
export const GENDERS = ["male", "female", "other"];

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, trim: true, maxlength: 25, default: "" },
    email: { type: String, trim: true, lowercase: true, maxlength: 255, default: "" },
    diagnosis: { type: String, trim: true, maxlength: 200, default: "" },
    condition: { type: String, enum: CONDITIONS, default: "stable" },
    admittedOn: { type: Date, default: Date.now },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    keywords: { type: [String], select: false },
  },
  { timestamps: true, versionKey: false }
);

export const patientKeywords = (p) =>
  buildKeywords({ text: [p.name, p.diagnosis], emails: [p.email], phones: [p.phone] });

patientSchema.pre("save", function setKeywords() {
  this.keywords = patientKeywords(this);
});

patientSchema.index({ keywords: 1 });
patientSchema.index({ admittedOn: -1, _id: -1 });             // default list + date filter + timelines
patientSchema.index({ doctor: 1, admittedOn: -1 });           // a doctor's patient list, per-doctor counts
patientSchema.index({ condition: 1, admittedOn: -1 });        // condition filter + condition counts
patientSchema.index({ gender: 1, admittedOn: -1 });           // gender filter

export const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);
