"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useDoctorOptions, useSavePatient } from "@/hooks/use-api";
import { CONDITIONS, GENDERS } from "@/lib/constants";
import { patientSchema, validate } from "@/lib/validation";
import { toInputDate, todayInput } from "@/lib/utils";

/**
 * Add or edit a patient. With `doctorId` the patient is created under that
 * doctor (nested REST route) and the doctor select is hidden.
 */
export function PatientFormDialog({ patient, doctorId, trigger }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
      {open && <PatientForm patient={patient} doctorId={doctorId} onClose={() => setOpen(false)} />}
    </>
  );
}

function initialValues(patient, doctorId) {
  if (!patient) {
    return { name: "", age: "", gender: "", phone: "", email: "", diagnosis: "", condition: "stable", admittedOn: todayInput(), doctor: doctorId ?? "" };
  }
  return {
    name: patient.name,
    age: String(patient.age),
    gender: patient.gender,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    diagnosis: patient.diagnosis ?? "",
    condition: patient.condition,
    admittedOn: toInputDate(patient.admittedOn),
    doctor: patient.doctor?._id ?? patient.doctor ?? doctorId ?? "",
  };
}

function PatientForm({ patient, doctorId, onClose }) {
  const [values, setValues] = useState(() => initialValues(patient, doctorId));
  const [errors, setErrors] = useState({});
  const lockDoctor = Boolean(doctorId && !patient);
  const save = useSavePatient({ id: patient?._id, doctorId: lockDoctor ? doctorId : undefined });
  const options = useDoctorOptions({ enabled: !lockDoctor });

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const { data, errors } = validate(patientSchema, values);
    setErrors(errors);
    if (!data) return;
    const body = lockDoctor ? { ...data, doctor: undefined } : data;
    try {
      await save.mutateAsync(body);
      onClose();
    } catch (err) {
      setErrors(err.details ?? { _form: err.message });
    }
  }

  const a11y = (k) => ({ id: `pt-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `pt-${k}-error` : undefined, value: values[k], onChange: set(k) });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={patient ? "Edit patient" : "Add a patient"} className="max-w-xl">
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {errors._form && <p role="alert" className="text-sm text-destructive">{errors._form}</p>}
        <Field label="Full name" htmlFor="pt-name" error={errors.name}>
          <Input {...a11y("name")} autoFocus placeholder="e.g. Karim Uddin" />
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Age" htmlFor="pt-age" error={errors.age}>
            <Input {...a11y("age")} type="number" inputMode="numeric" min={0} max={130} />
          </Field>
          <Field label="Gender" htmlFor="pt-gender" error={errors.gender}>
            <Select {...a11y("gender")} placeholder="Select…" options={GENDERS} />
          </Field>
          <Field label="Condition" htmlFor="pt-condition" error={errors.condition} className="col-span-2 sm:col-span-1">
            <Select {...a11y("condition")} options={CONDITIONS} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Diagnosis" htmlFor="pt-diagnosis" error={errors.diagnosis}>
            <Input {...a11y("diagnosis")} placeholder="e.g. Hypertension" />
          </Field>
          <Field label="Admitted on" htmlFor="pt-admittedOn" error={errors.admittedOn}>
            <Input {...a11y("admittedOn")} type="date" max={todayInput()} />
          </Field>
          <Field label="Phone (optional)" htmlFor="pt-phone" error={errors.phone}>
            <Input {...a11y("phone")} type="tel" placeholder="+880 1811-000000" />
          </Field>
          <Field label="Email (optional)" htmlFor="pt-email" error={errors.email}>
            <Input {...a11y("email")} type="email" />
          </Field>
        </div>
        {!lockDoctor && (
          <Field label="Assigned doctor" htmlFor="pt-doctor" error={errors.doctor}>
            <Select
              {...a11y("doctor")}
              placeholder={options.isLoading ? "Loading doctors…" : "Choose a doctor"}
              options={(options.data?.doctors ?? []).map((d) => ({ value: d._id, label: `${d.name} — ${d.specialization}` }))}
            />
          </Field>
        )}
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending && <Spinner />}{patient ? "Save changes" : "Add patient"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
