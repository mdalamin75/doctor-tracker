import mongoose from "mongoose";
import { buildKeywords } from "../utils/search.js";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    specialization: { type: String, required: true, trim: true, maxlength: 80 },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 25 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    // Denormalised search tokens — see utils/search.js
    keywords: { type: [String], select: false },
  },
  { timestamps: true, versionKey: false }
);

export const doctorKeywords = (d) =>
  buildKeywords({ text: [d.name, d.specialization, d.hospital], emails: [d.email], phones: [d.phone] });

// Recomputed on every save. (insertMany skips save hooks, so bulk loaders call doctorKeywords directly.)
doctorSchema.pre("save", function setKeywords() {
  this.keywords = doctorKeywords(this);
});

// ── Indexes (ESR rule: Equality → Sort → Range) ─────────────────────────
doctorSchema.index({ keywords: 1 });                         // search
doctorSchema.index({ createdAt: -1, _id: -1 });              // default list + "joined" date filter
doctorSchema.index({ specialization: 1, createdAt: -1 });    // filter by specialization
doctorSchema.index({ hospital: 1, createdAt: -1 });          // filter by hospital
doctorSchema.index({ name: 1 });                             // sort by name / dropdowns

export const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
