import { Router } from "express";
import * as patients from "../controllers/patient.controller.js";
import { validate } from "../middleware/validate.js";
import { idParams, patientBody, patientQuery, patientUpdateBody } from "../validators/schemas.js";

const router = Router();

router
  .route("/")
  .get(validate({ query: patientQuery }), patients.listPatients)
  .post(validate({ body: patientBody }), patients.createPatient);

router
  .route("/:id")
  .get(validate({ params: idParams }), patients.getPatient)
  .patch(validate({ params: idParams, body: patientUpdateBody }), patients.updatePatient)
  .delete(validate({ params: idParams }), patients.deletePatient);

export default router;
