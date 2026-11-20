// Integration tests: real Express app + real MongoDB (separate test database).
// Run with: npm test   (uses MONGODB_URI_TEST, or MONGODB_URI with a "_test" database)
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.ADMIN_EMAIL = "test-admin@example.com";
process.env.ADMIN_PASSWORD = "TestPass123";

const { config } = await import("../src/config.js");
const testUri = process.env.MONGODB_URI_TEST || config.mongoUri.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
const { connectDB, disconnectDB } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const { upsertAdmin } = await import("../src/scripts/create-admin.js");
const { Doctor } = await import("../src/models/Doctor.js");
const { Patient } = await import("../src/models/Patient.js");

const app = createApp();
const agent = request.agent(app); // keeps the auth cookie between requests

const doctorInput = {
  name: "Dr. Ayesha Rahman",
  specialization: "Cardiology",
  hospital: "Square Hospital",
  phone: "+880 1711-000001",
  email: "ayesha@square.test",
};
const patientInput = (extra = {}) => ({
  name: "Karim Uddin",
  age: 54,
  gender: "male",
  phone: "+880 1811-123456",
  diagnosis: "Hypertension",
  condition: "stable",
  admittedOn: "2026-03-15",
  ...extra,
});

before(async () => {
  assert.match(testUri, /_test/, "Refusing to run tests against a non-test database");
  const conn = await connectDB(testUri);
  await conn.db.dropDatabase();
  await connectDB(testUri); // recreate indexes after drop
  await upsertAdmin();
});
after(async () => {
  await disconnectDB();
});

describe("auth", () => {
  test("protected routes reject anonymous requests", async () => {
    const res = await request(app).get("/api/doctors");
    assert.equal(res.status, 401);
  });

  test("rejects wrong password with a generic message", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "test-admin@example.com", password: "wrong" });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Invalid email or password");
  });

  test("logs in and sets an httpOnly cookie", async () => {
    const res = await agent.post("/api/auth/login").send({ email: "TEST-ADMIN@example.com", password: "TestPass123" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "admin");
    assert.ok(!("password" in res.body.user));
    const cookie = res.headers["set-cookie"].join(";");
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
  });

  test("accepts a Bearer token for non-browser clients", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "test-admin@example.com", password: "TestPass123" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, "test-admin@example.com");
  });

  test("rejects a tampered token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer abc.def.ghi");
    assert.equal(res.status, 401);
  });
});

describe("doctors", () => {
  let doctorId;

  test("validates input", async () => {
    const res = await agent.post("/api/doctors").send({ name: "X", email: "nope" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.details.email);
    assert.ok(res.body.error.details.hospital);
  });

  test("creates a doctor", async () => {
    const res = await agent.post("/api/doctors").send(doctorInput);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.name, doctorInput.name);
    assert.ok(!res.body.data.keywords, "search tokens are internal");
    doctorId = res.body.data._id;
  });

  test("returns 409 on duplicate email", async () => {
    const res = await agent.post("/api/doctors").send({ ...doctorInput, email: "AYESHA@square.test" });
    assert.equal(res.status, 409);
  });

  test("lists, searches (prefix, multi-word, phone) and paginates", async () => {
    await agent.post("/api/doctors").send({ ...doctorInput, name: "Dr. Tanvir Hasan", specialization: "Neurology", hospital: "United Hospital", email: "tanvir@united.test", phone: "01712345678" });
    await agent.post("/api/doctors").send({ ...doctorInput, name: "Dr. Nusrat Jahan", specialization: "Pediatrics", hospital: "United Hospital", email: "nusrat@united.test" });

    const all = await agent.get("/api/doctors?limit=2");
    assert.equal(all.body.meta.total, 3);
    assert.equal(all.body.meta.totalPages, 2);
    assert.equal(all.body.data.length, 2);

    const byPrefix = await agent.get("/api/doctors?q=AYES");
    assert.deepEqual(byPrefix.body.data.map((d) => d.name), ["Dr. Ayesha Rahman"]);

    const multi = await agent.get("/api/doctors").query({ q: "united neuro" });
    assert.deepEqual(multi.body.data.map((d) => d.name), ["Dr. Tanvir Hasan"]);

    const byPhone = await agent.get("/api/doctors?q=0171234");
    assert.deepEqual(byPhone.body.data.map((d) => d.name), ["Dr. Tanvir Hasan"]);
  });

  test("filters by hospital, specialization and date, and sorts by name", async () => {
    const res = await agent.get("/api/doctors").query({ hospital: "United Hospital", sort: "name" });
    assert.deepEqual(res.body.data.map((d) => d.name), ["Dr. Nusrat Jahan", "Dr. Tanvir Hasan"]);
    const future = await agent.get("/api/doctors").query({ from: "2999-01-01" });
    assert.equal(future.body.meta.total, 0);
    const spec = await agent.get("/api/doctors").query({ specialization: "Cardiology" });
    assert.equal(spec.body.meta.total, 1);
  });

  test("updates a doctor and keeps search tokens in sync", async () => {
    const res = await agent.patch(`/api/doctors/${doctorId}`).send({ hospital: "Evercare Hospital" });
    assert.equal(res.status, 200);
    const found = await agent.get("/api/doctors?q=evercare");
    assert.equal(found.body.meta.total, 1);
  });

  test("returns options for filter dropdowns", async () => {
    const res = await agent.get("/api/doctors/options");
    assert.deepEqual(res.body.specializations, ["Cardiology", "Neurology", "Pediatrics"]);
    assert.equal(res.body.doctors.length, 3);
  });

  test("404 for unknown doctor, 400 for malformed id", async () => {
    assert.equal((await agent.get("/api/doctors/64b7f0000000000000000000")).status, 404);
    assert.equal((await agent.get("/api/doctors/not-an-id")).status, 400);
  });

  describe("patients under a doctor", () => {
    let patientId;

    test("adds a patient under a doctor", async () => {
      const res = await agent.post(`/api/doctors/${doctorId}/patients`).send(patientInput());
      assert.equal(res.status, 201);
      assert.equal(res.body.data.doctor.name, doctorInput.name);
      patientId = res.body.data._id;
      await agent.post(`/api/doctors/${doctorId}/patients`).send(patientInput({ name: "Rumana Akter", gender: "female", condition: "critical", admittedOn: "2026-05-01" }));
    });

    test("lists the doctor's patients with counts", async () => {
      const list = await agent.get(`/api/doctors/${doctorId}/patients`);
      assert.equal(list.body.meta.total, 2);
      const doc = await agent.get(`/api/doctors/${doctorId}`);
      assert.equal(doc.body.data.patientCount, 2);
      assert.equal(doc.body.data.conditionCounts.critical, 1);
      const listed = await agent.get("/api/doctors?q=ayesha");
      assert.equal(listed.body.data[0].patientCount, 2);
      assert.equal(listed.body.data[0].criticalCount, 1);
    });

    test("removes a patient from the doctor's list", async () => {
      const other = (await agent.get("/api/doctors?q=tanvir")).body.data[0]._id;
      // Cannot delete through the wrong doctor
      assert.equal((await agent.delete(`/api/doctors/${other}/patients/${patientId}`)).status, 404);
      assert.equal((await agent.delete(`/api/doctors/${doctorId}/patients/${patientId}`)).status, 204);
      assert.equal((await agent.get(`/api/doctors/${doctorId}/patients`)).body.meta.total, 1);
    });
  });
});

describe("patients", () => {
  let doctorId;
  let patientId;

  before(async () => {
    doctorId = String((await Doctor.findOne({ email: "tanvir@united.test" }))._id);
    for (const [i, condition] of ["stable", "recovering", "critical", "discharged", "observation"].entries()) {
      const res = await agent.post("/api/patients").send(patientInput({
        name: `Patient ${i} Hossain`, age: 20 + i * 10, gender: i % 2 ? "female" : "male",
        condition, admittedOn: `2026-0${i + 1}-10`, doctor: doctorId,
      }));
      assert.equal(res.status, 201);
      patientId ??= res.body.data._id;
    }
  });

  test("rejects a patient for a doctor that does not exist", async () => {
    const res = await agent.post("/api/patients").send(patientInput({ doctor: "64b7f0000000000000000000" }));
    assert.equal(res.status, 404);
  });

  test("rejects future admission dates and bad enums", async () => {
    const res = await agent.post("/api/patients").send(patientInput({ doctor: doctorId, admittedOn: "2999-01-01", gender: "x" }));
    assert.equal(res.status, 400);
    assert.ok(res.body.error.details.admittedOn);
    assert.ok(res.body.error.details.gender);
  });

  test("filters by condition, gender, doctor, date range and age", async () => {
    const q = (query) => agent.get("/api/patients").query(query).then((r) => r.body.meta.total);
    assert.equal(await q({ doctor: doctorId }), 5);
    assert.equal(await q({ doctor: doctorId, condition: "critical" }), 1);
    assert.equal(await q({ doctor: doctorId, gender: "female" }), 2);
    assert.equal(await q({ doctor: doctorId, from: "2026-02-01", to: "2026-03-31" }), 2);
    assert.equal(await q({ doctor: doctorId, minAge: 40, maxAge: 60 }), 3);
    assert.equal(await q({ q: "hossain 3" }), 1);
  });

  test("sorts and paginates", async () => {
    const res = await agent.get("/api/patients").query({ doctor: doctorId, sort: "oldest", limit: 2, page: 2 });
    assert.equal(res.body.meta.totalPages, 3);
    assert.deepEqual(res.body.data.map((p) => p.name), ["Patient 2 Hossain", "Patient 3 Hossain"]);
  });

  test("edits a patient", async () => {
    const res = await agent.patch(`/api/patients/${patientId}`).send({ condition: "critical", name: "Renamed Person" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.condition, "critical");
    assert.equal((await agent.get("/api/patients?q=renamed")).body.meta.total, 1);
  });

  test("rejects empty updates", async () => {
    assert.equal((await agent.patch(`/api/patients/${patientId}`).send({})).status, 400);
  });

  test("deletes a patient", async () => {
    assert.equal((await agent.delete(`/api/patients/${patientId}`)).status, 204);
    assert.equal((await agent.get(`/api/patients/${patientId}`)).status, 404);
  });
});

describe("dashboard", () => {
  test("returns aggregated analytics", async () => {
    const res = await agent.get("/api/dashboard/stats?months=12");
    assert.equal(res.status, 200);
    const { totals, monthly, daily, byCondition, patientsPerDoctor, bySpecialization } = res.body;
    assert.equal(totals.doctors, await Doctor.countDocuments());
    assert.equal(totals.patients, await Patient.countDocuments());
    assert.equal(monthly.length, 12);
    assert.equal(daily.length, 30);
    assert.equal(byCondition.reduce((n, c) => n + c.count, 0), totals.patients);
    assert.ok(patientsPerDoctor.length > 0 && patientsPerDoctor[0].name);
    assert.ok(bySpecialization.every((s) => s.specialization && s.patients > 0));
  });
});

describe("query plans", () => {
  test("search and filters use indexes (no collection scans)", async () => {
    const plan = async (query, sort) => JSON.stringify(await Patient.find(query).sort(sort).limit(10).explain("queryPlanner"));
    const { keywordFilter } = await import("../src/utils/search.js");
    for (const [q, s] of [
      [keywordFilter("hoss"), { admittedOn: -1 }],
      [{ condition: "critical" }, { admittedOn: -1 }],
      [{ doctor: (await Doctor.findOne())._id }, { admittedOn: -1 }],
      [{ admittedOn: { $gte: new Date("2026-01-01") } }, { admittedOn: -1 }],
    ]) {
      const p = await plan(q, s);
      assert.match(p, /IXSCAN/, `expected index scan for ${JSON.stringify(q)}`);
      assert.doesNotMatch(p, /"stage":"COLLSCAN"/);
    }
  });
});
