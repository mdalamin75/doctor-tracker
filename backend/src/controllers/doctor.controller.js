import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { HttpError, dateRange, paginated } from "../utils/http.js";
import { keywordFilter } from "../utils/search.js";

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { name: 1, _id: 1 },
};

/** One aggregation that returns patient + critical counts for a set of doctors. */
async function patientCountsFor(doctorIds) {
  if (!doctorIds.length) return new Map();
  const rows = await Patient.aggregate([
    { $match: { doctor: { $in: doctorIds } } },
    {
      $group: {
        _id: "$doctor",
        patientCount: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ["$condition", "critical"] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

// GET /api/doctors
export async function listDoctors(req, res) {
  const { page, limit, q, specialization, hospital, from, to, sort } = req.valid.query;

  const filter = { ...keywordFilter(q) };
  if (specialization) filter.specialization = specialization;
  if (hospital) filter.hospital = hospital;
  const created = dateRange(from, to);
  if (created) filter.createdAt = created;

  // Page of documents and total count run in parallel.
  const [doctors, total] = await Promise.all([
    Doctor.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).lean(),
    Doctor.countDocuments(filter),
  ]);

  // Counts only for the ≤ `limit` doctors on this page — never the whole collection.
  const counts = await patientCountsFor(doctors.map((d) => d._id));
  const data = doctors.map((d) => ({
    ...d,
    patientCount: counts.get(String(d._id))?.patientCount ?? 0,
    criticalCount: counts.get(String(d._id))?.criticalCount ?? 0,
  }));

  res.json(paginated(data, { page, limit }, total));
}

// GET /api/doctors/options — values for filter dropdowns and the "assign doctor" select
export async function doctorOptions(_req, res) {
  const [specializations, hospitals, doctors] = await Promise.all([
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
    Doctor.find({}, { name: 1, specialization: 1 }).sort({ name: 1 }).lean(),
  ]);
  res.set("Cache-Control", "private, max-age=30");
  res.json({ specializations: specializations.sort(), hospitals: hospitals.sort(), doctors });
}

// GET /api/doctors/:id
export async function getDoctor(req, res) {
  const { id } = req.valid.params;
  const [doctor, byCondition] = await Promise.all([
    Doctor.findById(id).lean(),
    Patient.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$condition", count: { $sum: 1 } } },
    ]),
  ]);
  if (!doctor) throw new HttpError(404, "Doctor not found");
  const stats = Object.fromEntries(byCondition.map((c) => [c._id, c.count]));
  const patientCount = byCondition.reduce((n, c) => n + c.count, 0);
  res.json({ data: { ...doctor, patientCount, conditionCounts: stats } });
}

// POST /api/doctors
export async function createDoctor(req, res) {
  const doctor = await Doctor.create(req.valid.body);
  res.status(201).json({ data: doctor.toObject({ transform: stripKeywords }) });
}

// PATCH /api/doctors/:id
export async function updateDoctor(req, res) {
  const doctor = await Doctor.findById(req.valid.params.id);
  if (!doctor) throw new HttpError(404, "Doctor not found");
  doctor.set(req.valid.body);
  await doctor.save(); // save (not findOneAndUpdate) so the keyword hook re-runs
  res.json({ data: doctor.toObject({ transform: stripKeywords }) });
}

// DELETE /api/doctors/:id — removes the doctor and their patients
export async function deleteDoctor(req, res) {
  const { id } = req.valid.params;
  const run = async (session) => {
    const doc = await Doctor.findByIdAndDelete(id, { session });
    if (!doc) throw new HttpError(404, "Doctor not found");
    await Patient.deleteMany({ doctor: doc._id }, { session });
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => run(session));
  } catch (err) {
    // Standalone MongoDB (no replica set) can't run transactions → fall back.
    if (err?.code === 20 || /Transaction numbers/i.test(err?.message)) await run();
    else throw err;
  } finally {
    await session.endSession();
  }
  res.status(204).end();
}

function stripKeywords(_doc, ret) {
  delete ret.keywords;
  return ret;
}
