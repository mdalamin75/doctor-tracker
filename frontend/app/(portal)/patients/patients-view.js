"use client";
import { PageHeader } from "@/components/common/page-header";
import { PatientsPanel } from "@/components/patients/patients-panel";
import { formatNumber } from "@/lib/utils";

export function PatientsView() {
  return (
    <PatientsPanel
      header={({ total, addButton }) => (
        <>
          <PageHeader title="Patients" subtitle={total != null ? `${formatNumber(total)} patient records` : "All patient records"} actions={addButton} />
          <div className="sr-only" aria-live="polite">{total != null && `${total} results`}</div>
        </>
      )}
    />
  );
}
