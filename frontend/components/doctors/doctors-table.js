"use client";
import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DoctorFormDialog } from "./doctor-form-dialog";
import { useDeleteDoctor } from "@/hooks/use-api";
import { formatDate, initials } from "@/lib/utils";

function Avatar({ name }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(name)}</span>;
}

function PatientCount({ d }) {
  return (
    <span className="inline-flex items-center gap-2 tabular">
      <span className="font-medium">{d.patientCount}</span>
      {d.criticalCount > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--status-critical)]" title={`${d.criticalCount} critical`}>
          <AlertTriangle className="size-3" />{d.criticalCount} critical
        </span>
      )}
    </span>
  );
}

function RowActions({ d, onDelete }) {
  return (
    <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      <DoctorFormDialog doctor={d} trigger={<Button variant="ghost" size="icon" aria-label={`Edit ${d.name}`}><Pencil /></Button>} />
      <ConfirmDialog
        title={`Delete ${d.name}?`}
        description={`This also removes their ${d.patientCount} patient record${d.patientCount === 1 ? "" : "s"}. This cannot be undone.`}
        confirmLabel="Delete doctor"
        onConfirm={() => onDelete(d._id)}
        trigger={<Button variant="ghost-destructive" size="icon" aria-label={`Delete ${d.name}`}><Trash2 /></Button>}
      />
    </div>
  );
}

// memo: rows only re-render when their own doctor object changes.
const DoctorRow = memo(function DoctorRow({ d, onDelete, onOpen }) {
  return (
    <tr className="group cursor-pointer border-t transition-colors hover:bg-muted/50" onClick={() => onOpen(d._id)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={d.name} />
          <div className="min-w-0">
            <Link href={`/doctors/${d._id}`} className="font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}>{d.name}</Link>
            <p className="truncate text-xs text-muted-foreground">{d.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{d.specialization}</span></td>
      <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">{d.hospital}</td>
      <td className="hidden px-4 py-3 text-muted-foreground tabular xl:table-cell">{d.phone}</td>
      <td className="px-4 py-3"><PatientCount d={d} /></td>
      <td className="px-4 py-3 text-muted-foreground tabular">{formatDate(d.createdAt)}</td>
      <td className="px-2 py-3"><RowActions d={d} onDelete={onDelete} /></td>
    </tr>
  );
});

const DoctorCard = memo(function DoctorCard({ d, onDelete }) {
  return (
    <li className="flex items-start gap-3 px-4 py-4">
      <Avatar name={d.name} />
      <Link href={`/doctors/${d._id}`} className="min-w-0 flex-1">
        <p className="font-medium">{d.name}</p>
        <p className="text-xs text-muted-foreground">{d.specialization} · {d.hospital}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <PatientCount d={d} /><span>patients</span><span>· Joined {formatDate(d.createdAt)}</span>
        </div>
      </Link>
      <RowActions d={d} onDelete={onDelete} />
    </li>
  );
});

export function DoctorsTable({ doctors, sort }) {
  const del = useDeleteDoctor();
  const router = useRouter();
  const open = (id) => router.push(`/doctors/${id}`);

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Doctors, sorted by {sort}</caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Doctor</th>
              <th scope="col" className="px-4 py-3 font-medium">Specialization</th>
              <th scope="col" className="hidden px-4 py-3 font-medium xl:table-cell">Hospital</th>
              <th scope="col" className="hidden px-4 py-3 font-medium xl:table-cell">Phone</th>
              <th scope="col" className="px-4 py-3 font-medium">Patients</th>
              <th scope="col" className="px-4 py-3 font-medium">Joined</th>
              <th scope="col" className="w-24 px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>{doctors.map((d) => <DoctorRow key={d._id} d={d} onDelete={del.mutate} onOpen={open} />)}</tbody>
        </table>
      </div>
      <ul className="divide-y md:hidden">{doctors.map((d) => <DoctorCard key={d._id} d={d} onDelete={del.mutate} />)}</ul>
    </>
  );
}
