// Resets doctors & patients and fills them with realistic demo data.
// Usage: npm run seed            (≈ 24 doctors, 480 patients over 12 months)
//        npm run seed -- --large (≈ 200 doctors, 50 000 patients, for perf testing)
import { connectDB, disconnectDB } from "../db.js";
import { Doctor, doctorKeywords } from "../models/Doctor.js";
import { Patient, patientKeywords } from "../models/Patient.js";
import { upsertAdmin } from "./create-admin.js";

const large = process.argv.includes("--large");
const DOCTORS = large ? 200 : 24;
const PATIENTS = large ? 50_000 : 480;

let seed = 42; // deterministic random so screenshots/tests are reproducible
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (pairs) => {
  let r = rand() * pairs.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of pairs) if ((r -= w) <= 0) return v;
  return pairs[0][0];
};

const firstM = ["Tanvir", "Imran", "Rafiq", "Arif", "Kamal", "Sabbir", "Mahmud", "Nazmul", "Shahid", "Faisal", "Rakib", "Zahid", "Hasan", "Sohel", "Jamil"];
const firstF = ["Ayesha", "Nusrat", "Farhana", "Sadia", "Tahmina", "Rumana", "Shirin", "Nadia", "Lamia", "Sharmin", "Mehjabin", "Sumaiya", "Fariha", "Jannat", "Tasnim"];
const last = ["Rahman", "Hasan", "Islam", "Ahmed", "Chowdhury", "Hossain", "Kabir", "Akter", "Karim", "Siddiqui", "Uddin", "Sarker", "Talukder", "Majumder", "Biswas"];
const specialties = {
  Cardiology: ["Hypertension", "Arrhythmia", "Coronary artery disease", "Heart failure"],
  Neurology: ["Migraine", "Epilepsy", "Stroke recovery", "Parkinson's disease"],
  Pediatrics: ["Bronchiolitis", "Dengue fever", "Malnutrition", "Asthma"],
  Orthopedics: ["Fractured tibia", "Osteoarthritis", "Lumbar disc herniation", "ACL tear"],
  Dermatology: ["Eczema", "Psoriasis", "Acne vulgaris", "Fungal infection"],
  Oncology: ["Breast cancer", "Lung cancer", "Lymphoma", "Leukemia"],
  Endocrinology: ["Type 2 diabetes", "Hypothyroidism", "PCOS", "Obesity"],
  Gastroenterology: ["Peptic ulcer", "Hepatitis B", "IBS", "Gallstones"],
  Pulmonology: ["COPD", "Pneumonia", "Tuberculosis", "Asthma"],
  Nephrology: ["Chronic kidney disease", "Kidney stones", "Nephrotic syndrome"],
};
const hospitals = ["Square Hospital", "United Hospital", "Evercare Hospital", "Labaid Specialized Hospital", "Ibn Sina Hospital", "Dhaka Medical College Hospital", "BIRDEM General Hospital", "Popular Medical College Hospital"];

const now = Date.now();
const DAY = 86_400_000;
const phone = (prefix) => `+880 1${prefix}${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`;

await connectDB();
const admin = await upsertAdmin();
await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})]);

const usedEmails = new Set();
const doctorDocs = Array.from({ length: DOCTORS }, (_, i) => {
  const female = rand() < 0.5;
  const first = pick(female ? firstF : firstM);
  const surname = pick(last);
  const specialization = Object.keys(specialties)[i % Object.keys(specialties).length];
  let email = `${first}.${surname}`.toLowerCase();
  while (usedEmails.has(email)) email += Math.floor(rand() * 10);
  usedEmails.add(email);
  // Most doctors joined over a year ago; a few joined recently.
  const daysAgo = rand() < 0.75 ? 380 + Math.floor(rand() * 300) : Math.floor(rand() * 360);
  const createdAt = new Date(now - daysAgo * DAY - Math.floor(rand() * DAY));
  const d = {
    name: `Dr. ${first} ${surname}`,
    specialization,
    hospital: pick(hospitals),
    phone: phone(7),
    email: `${email}@${large ? "perf" : "hospital"}.test`,
    createdAt,
    updatedAt: createdAt,
  };
  return { ...d, keywords: doctorKeywords(d) };
});
const doctors = await Doctor.insertMany(doctorDocs, { timestamps: false });

// Some doctors are busier than others → more interesting charts.
const load = doctors.map(() => 0.3 + rand() * 2);
const doctorPool = doctors.flatMap((d, i) => Array(Math.round(load[i] * 10)).fill(d));

const BATCH = 5_000;
for (let start = 0; start < PATIENTS; start += BATCH) {
  const batch = Array.from({ length: Math.min(BATCH, PATIENTS - start) }, () => {
    const doctor = pick(doctorPool);
    const female = rand() < 0.52;
    const gender = rand() < 0.02 ? "other" : female ? "female" : "male";
    // Admissions spread over the last 12 months, slightly skewed towards recent ones
    const earliest = Math.max(+doctor.createdAt, now - 365 * DAY);
    const admittedOn = new Date(earliest + Math.pow(rand(), 0.8) * (now - earliest));
    const condition = weighted([["stable", 38], ["recovering", 26], ["observation", 16], ["critical", 9], ["discharged", 11]]);
    const name = `${pick(female ? firstF : firstM)} ${pick(last)}`;
    const age = doctor.specialization === "Pediatrics" ? Math.floor(rand() * 16) : 18 + Math.floor(Math.pow(rand(), 0.9) * 70);
    const p = {
      name,
      age,
      gender,
      phone: phone(8),
      email: rand() < 0.6 ? `${name.toLowerCase().replace(/\s+/g, ".")}${Math.floor(rand() * 99)}@mail.test` : "",
      diagnosis: pick(specialties[doctor.specialization]),
      condition,
      admittedOn,
      doctor: doctor._id,
      createdAt: admittedOn,
      updatedAt: admittedOn,
    };
    return { ...p, keywords: patientKeywords(p) };
  });
  await Patient.insertMany(batch, { timestamps: false, ordered: false });
}

console.log(`✓ Seeded ${doctors.length} doctors and ${PATIENTS} patients`);
console.log(`✓ Sign in with ${admin.email} / (ADMIN_PASSWORD from .env)`);
await disconnectDB();
