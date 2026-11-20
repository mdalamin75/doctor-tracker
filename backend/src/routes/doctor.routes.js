import { Router } from "express";
import * as doctors from "../controllers/doctor.controller.js";
import * as patients from "../controllers/patient.controller.js";
import { validate } from "../middleware/validate.js";
import {
  doctorBody, doctorPatientBody, doctorPatientParams, doctorQuery, idParams, patientQuery,
} from "../validators/schemas.js";

const router = Router();

router
  .route("/")
  .get(validate({ query: doctorQuery }), doctors.listDoctors)
  .post(validate({ body: doctorBody }), doctors.createDoctor);

router.get("/options", doctors.doctorOptions);

router
  .route("/:id")
  .get(validate({ params: idParams }), doctors.getDoctor)
  .patch(validate({ params: idParams, body: doctorBody.partial() }), doctors.updateDoctor)
  .delete(validate({ params: idParams }), doctors.deleteDoctor);

// A doctor's patient list (nested resource)
router
  .route("/:id/patients")
  .get(validate({ params: idParams, query: patientQuery.omit({ doctor: true }) }), patients.listPatients)
  .post(validate({ params: idParams, body: doctorPatientBody }), patients.createPatient);

router.delete("/:id/patients/:patientId", validate({ params: doctorPatientParams }), patients.deleteDoctorPatient);

export default router;
