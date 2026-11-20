"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useDoctorOptions, useSaveDoctor } from "@/hooks/use-api";
import { doctorSchema, validate } from "@/lib/validation";

const EMPTY = { name: "", specialization: "", hospital: "", phone: "", email: "" };
const FIELDS = Object.keys(EMPTY);

/** Create (no `doctor`) or edit (with `doctor`). The trigger is any element. */
export function DoctorFormDialog({ doctor, trigger }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
      {open && <DoctorForm doctor={doctor} onClose={() => setOpen(false)} />}
    </>
  );
}

// Mounted only while open → fresh state each time, no stale form values.
function DoctorForm({ doctor, onClose }) {
  const [values, setValues] = useState(() => (doctor ? Object.fromEntries(FIELDS.map((k) => [k, doctor[k] ?? ""])) : EMPTY));
  const [errors, setErrors] = useState({});
  const save = useSaveDoctor(doctor?._id);
  const options = useDoctorOptions();

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const { data, errors } = validate(doctorSchema, values);
    setErrors(errors);
    if (!data) return;
    try {
      await save.mutateAsync(data);
      onClose();
    } catch (err) {
      // Show server-side field errors (e.g. duplicate email → 409) inline.
      setErrors(err.details ?? { _form: err.message });
    }
  }

  const input = (k, { label, ...props }) => (
    <Field label={label} htmlFor={`doc-${k}`} error={errors[k]}>
      <Input id={`doc-${k}`} value={values[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `doc-${k}-error` : undefined} {...props} />
    </Field>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={doctor ? "Edit doctor" : "Add a doctor"} description={doctor ? undefined : "They'll appear in the directory straight away."}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {errors._form && <p role="alert" className="text-sm text-destructive">{errors._form}</p>}
        {input("name", { label: "Full name", placeholder: "Dr. Jane Doe", autoFocus: true })}
        <div className="grid gap-4 sm:grid-cols-2">
          {input("specialization", { label: "Specialization", placeholder: "Cardiology", list: "spec-list" })}
          {input("hospital", { label: "Hospital", placeholder: "City Hospital", list: "hosp-list" })}
          {input("phone", { label: "Phone", type: "tel", placeholder: "+880 1711-000000", autoComplete: "off" })}
          {input("email", { label: "Email", type: "email", placeholder: "jane@hospital.com", autoComplete: "off" })}
        </div>
        {/* Suggest existing values to keep filters tidy, while allowing new ones */}
        <datalist id="spec-list">{options.data?.specializations.map((s) => <option key={s} value={s} />)}</datalist>
        <datalist id="hosp-list">{options.data?.hospitals.map((h) => <option key={h} value={h} />)}</datalist>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending && <Spinner />}{doctor ? "Save changes" : "Add doctor"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
