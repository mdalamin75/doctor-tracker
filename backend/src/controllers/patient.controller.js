import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { HttpError, dateRange, paginated } from "../utils/http.js";
import { keywordFilter } from "../utils/search.js";

const SORTS = {
  newest: { admittedOn: -1, _id: -1 },
  oldest: { admittedOn: 1, _id: 1 },
  name: { name: 1, _id: 1 },
  age: { age: 1, _id: 1 },
};
const DOCTOR_FIELDS = "name specialization hospital";

function buildFilter({ q, doctor, condition, gender, from, to, minAge, maxAge }) {
  const filter = { ...keywordFilter(q) };
  if (doctor) filter.doctor = doctor;
  if (condition) filter.condition = condition;
  if (gender) filter.gender = gender;
  const admitted = dateRange(from, to);
  if (admitted) filter.admittedOn = admitted;
  if (minAge != null || maxAge != null) {
    filter.age = {};
    if (minAge != null) filter.age.$gte = minAge;
    if (maxAge != null) filter.age.$lte = maxAge;
  }
  return filter;
}

async function assertDoctorExists(id) {
  if (!(await Doctor.exists({ _id: id }))) throw new HttpError(404, "Doctor not found");
}

const clean = (doc) => {
  const o = doc.toObject();
  delete o.keywords;
  return o;
};

// GET /api/patients  and  GET /api/doctors/:id/patients
export async function listPatients(req, res) {
  const query = req.valid.query;
  const doctorId = req.valid.params?.id;
  if (doctorId) {
    await assertDoctorExists(doctorId);
    query.doctor = doctorId;
  }
  const { page, limit, sort } = query;
  const filter = buildFilter(query);

  const [data, total] = await Promise.all([
    Patient.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctor", DOCTOR_FIELDS) // single batched $in query for the page
      .lean(),
    Patient.countDocuments(filter),
  ]);
  res.json(paginated(data, { page, limit }, total));
}

// GET /api/patients/:id
export async function getPatient(req, res) {
  const patient = await Patient.findById(req.valid.params.id).populate("doctor", DOCTOR_FIELDS).lean();
  if (!patient) throw new HttpError(404, "Patient not found");
  res.json({ data: patient });
}

// POST /api/patients  and  POST /api/doctors/:id/patients
export async function createPatient(req, res) {
  const body = { ...req.valid.body, doctor: req.valid.params?.id ?? req.valid.body.doctor };
  await assertDoctorExists(body.doctor);
  const patient = await Patient.create(body);
  await patient.populate("doctor", DOCTOR_FIELDS);
  res.status(201).json({ data: clean(patient) });
}

// PATCH /api/patients/:id
export async function updatePatient(req, res) {
  const patient = await Patient.findById(req.valid.params.id);
  if (!patient) throw new HttpError(404, "Patient not found");
  if (req.valid.body.doctor) await assertDoctorExists(req.valid.body.doctor);
  patient.set(req.valid.body);
  await patient.save();
  await patient.populate("doctor", DOCTOR_FIELDS);
  res.json({ data: clean(patient) });
}

// DELETE /api/patients/:id
export async function deletePatient(req, res) {
  const patient = await Patient.findByIdAndDelete(req.valid.params.id);
  if (!patient) throw new HttpError(404, "Patient not found");
  res.status(204).end();
}

// DELETE /api/doctors/:id/patients/:patientId — only if the patient belongs to that doctor
export async function deleteDoctorPatient(req, res) {
  const { id, patientId } = req.valid.params;
  const patient = await Patient.findOneAndDelete({ _id: patientId, doctor: id });
  if (!patient) throw new HttpError(404, "Patient not found for this doctor");
  res.status(204).end();
}
