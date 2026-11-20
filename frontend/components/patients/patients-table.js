"use client";
import { memo } from "react";
import Link from "next/link";
import { Pencil, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ConditionBadge } from "./condition-badge";
import { PatientFormDialog } from "./patient-form-dialog";
import { useDeletePatient } from "@/hooks/use-api";
import { GENDER_MAP } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

function Actions({ p, doctorId, onDelete }) {
  // Inside a doctor's page the action is "remove from this doctor's list".
  const scoped = Boolean(doctorId);
  return (
    <div className="flex justify-end gap-0.5">
      <PatientFormDialog patient={p} trigger={<Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`}><Pencil /></Button>} />
      <ConfirmDialog
        title={scoped ? `Remove ${p.name}?` : `Delete ${p.name}?`}
        description={scoped ? "The patient will be removed from this doctor's list and their record deleted." : "This patient record will be permanently deleted."}
        confirmLabel={scoped ? "Remove patient" : "Delete patient"}
        onConfirm={() => onDelete(p._id)}
        trigger={<Button variant="ghost-destructive" size="icon" aria-label={`${scoped ? "Remove" : "Delete"} ${p.name}`}>{scoped ? <UserMinus /> : <Trash2 />}</Button>}
      />
    </div>
  );
}

const meta = (p) => `${p.age} yrs · ${GENDER_MAP[p.gender]?.label ?? p.gender}`;

const PatientRow = memo(function PatientRow({ p, showDoctor, doctorId, onDelete }) {
  return (
    <tr className="border-t transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <p className="font-medium">{p.name}</p>
        <p className="text-xs text-muted-foreground">{meta(p)}{p.phone && ` · ${p.phone}`}</p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{p.diagnosis || "—"}</td>
      <td className="px-4 py-3"><ConditionBadge value={p.condition} /></td>
      {showDoctor && (
        <td className="hidden px-4 py-3 xl:table-cell">
          {p.doctor ? (
            <Link href={`/doctors/${p.doctor._id}`} className="hover:text-primary hover:underline">{p.doctor.name}</Link>
          ) : "—"}
          <p className="text-xs text-muted-foreground">{p.doctor?.specialization}</p>
        </td>
      )}
      <td className="px-4 py-3 text-muted-foreground tabular">{formatDate(p.admittedOn)}</td>
      <td className="px-2 py-3"><Actions p={p} doctorId={doctorId} onDelete={onDelete} /></td>
    </tr>
  );
});

const PatientCard = memo(function PatientCard({ p, showDoctor, doctorId, onDelete }) {
  return (
    <li className="flex items-start gap-3 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{p.name}</p>
          <ConditionBadge value={p.condition} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{meta(p)} · {p.diagnosis || "No diagnosis"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Admitted {formatDate(p.admittedOn)}
          {showDoctor && p.doctor && <> · <Link href={`/doctors/${p.doctor._id}`} className="text-primary">{p.doctor.name}</Link></>}
        </p>
      </div>
      <Actions p={p} doctorId={doctorId} onDelete={onDelete} />
    </li>
  );
});

export function PatientsTable({ patients, doctorId }) {
  const del = useDeletePatient({ doctorId });
  const showDoctor = !doctorId;
  const props = { showDoctor, doctorId, onDelete: del.mutate };
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Patients</caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Patient</th>
              <th scope="col" className="px-4 py-3 font-medium">Diagnosis</th>
              <th scope="col" className="px-4 py-3 font-medium">Condition</th>
              {showDoctor && <th scope="col" className="hidden px-4 py-3 font-medium xl:table-cell">Doctor</th>}
              <th scope="col" className="px-4 py-3 font-medium">Admitted</th>
              <th scope="col" className="w-24 px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>{patients.map((p) => <PatientRow key={p._id} p={p} {...props} />)}</tbody>
        </table>
      </div>
      <ul className="divide-y md:hidden">{patients.map((p) => <PatientCard key={p._id} p={p} {...props} />)}</ul>
    </>
  );
}
