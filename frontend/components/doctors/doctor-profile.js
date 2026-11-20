"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Card, Skeleton } from "@/components/ui/misc";
import { ErrorState } from "@/components/common/states";
import { DoctorFormDialog } from "./doctor-form-dialog";
import { PatientsPanel } from "@/components/patients/patients-panel";
import { useDeleteDoctor, useDoctor } from "@/hooks/use-api";
import { CONDITIONS } from "@/lib/constants";
import { formatDate, formatNumber, initials } from "@/lib/utils";

/** Share of patients per condition as one segmented bar + labelled legend. */
function ConditionBreakdown({ counts = {}, total }) {
  if (!total) return null;
  const rows = CONDITIONS.filter((c) => counts[c.value]);
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Patient conditions">
        {rows.map((c) => (
          <span key={c.value} style={{ width: `${(counts[c.value] / total) * 100}%`, background: c.color }} title={`${c.label}: ${counts[c.value]}`} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        {rows.map((c) => (
          <li key={c.value} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
            {c.label} <span className="font-medium text-foreground tabular">{counts[c.value]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DoctorProfile({ id }) {
  const router = useRouter();
  const { data: d, isLoading, error, refetch } = useDoctor(id);
  const del = useDeleteDoctor();

  const remove = () => del.mutate(id, { onSuccess: () => router.replace("/doctors") });

  return (
    <>
      <Link href="/doctors" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All doctors
      </Link>

      {error ? (
        <Card><ErrorState error={error} onRetry={refetch} /></Card>
      ) : isLoading || !d ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <Card className="animate-in p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent font-display text-2xl font-semibold text-accent-foreground">{initials(d.name)}</div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">{d.name}</h1>
                <p className="mt-0.5 text-sm font-medium text-primary">{d.specialization}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <DoctorFormDialog doctor={d} trigger={<Button variant="outline"><Pencil /> Edit</Button>} />
              <ConfirmDialog
                title={`Delete ${d.name}?`}
                description={`This also removes their ${d.patientCount} patient record${d.patientCount === 1 ? "" : "s"}. This cannot be undone.`}
                confirmLabel="Delete doctor"
                onConfirm={remove}
                trigger={<Button variant="outline" className="text-destructive" aria-label="Delete doctor"><Trash2 /><span className="hidden sm:inline">Delete</span></Button>}
              />
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Building2, label: "Hospital", value: d.hospital },
              { icon: Mail, label: "Email", value: <a href={`mailto:${d.email}`} className="hover:text-primary hover:underline">{d.email}</a> },
              { icon: Phone, label: "Phone", value: <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="hover:text-primary hover:underline">{d.phone}</a> },
              { icon: CalendarDays, label: "Joined", value: formatDate(d.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="truncate font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t pt-5">
            <p className="mb-3 text-sm">
              <span className="font-display text-2xl font-semibold tabular">{formatNumber(d.patientCount)}</span>{" "}
              <span className="text-muted-foreground">patients under care</span>
            </p>
            <ConditionBreakdown counts={d.conditionCounts} total={d.patientCount} />
          </div>
        </Card>
      )}

      <div className="mt-6">
        <PatientsPanel
          doctorId={id}
          toolbar={({ total, addButton }) => (
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
              <h2 className="font-display text-xl font-semibold">
                Patients {total != null && <span className="text-base font-normal text-muted-foreground tabular">({formatNumber(total)})</span>}
              </h2>
              {addButton}
            </div>
          )}
        />
      </div>
    </>
  );
}
