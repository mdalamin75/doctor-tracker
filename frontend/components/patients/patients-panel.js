"use client";
import { useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/misc";
import { SearchInput } from "@/components/common/search-input";
import { DateRangeFilter, FilterBar, FilterItem } from "@/components/common/filter-bar";
import { Pagination } from "@/components/common/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientsTable } from "./patients-table";
import { useDoctorOptions, usePatients } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { parsePatientFilters } from "@/lib/filters";
import { CONDITIONS, GENDERS, PATIENT_SORTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Searchable / filterable / paginated patient list. Used on the Patients page
 * and, with `doctorId`, inside a doctor's profile (scoped to that doctor).
 */
export function PatientsPanel({ doctorId, header, toolbar }) {
  const parse = useCallback((sp) => ({ ...parsePatientFilters(sp), ...(doctorId && { doctor: doctorId }) }), [doctorId]);
  const { filters: f, setFilters, reset, isPending } = useUrlFilters(parse);
  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } = usePatients(f);
  const options = useDoctorOptions({ enabled: !doctorId });

  const filterKeys = ["condition", "gender", "from", "to", "minAge", "maxAge", ...(doctorId ? [] : ["doctor"])];
  const filtering = filterKeys.filter((k) => f[k]).length;
  const active = filtering + (f.q ? 1 : 0);
  const addButton = <PatientFormDialog doctorId={doctorId} trigger={<Button><Plus /> Add patient</Button>} />;

  return (
    <>
      {header?.({ total: data?.meta.total, addButton })}
      <Card>
      {toolbar?.({ total: data?.meta.total, addButton })}
      <FilterBar
        activeCount={filtering}
        onReset={reset}
        search={<SearchInput value={f.q} onChange={(q) => setFilters({ q })} placeholder="Search name, diagnosis, email or phone" loading={isFetching && !isLoading} />}
      >
        <FilterItem label="Condition">
          <Select value={f.condition} onChange={(e) => setFilters({ condition: e.target.value })} placeholder="All" options={CONDITIONS} className="sm:w-44" />
        </FilterItem>
        {!doctorId && (
          <FilterItem label="Doctor">
            <Select value={f.doctor} onChange={(e) => setFilters({ doctor: e.target.value })} placeholder="All" options={(options.data?.doctors ?? []).map((d) => ({ value: d._id, label: d.name }))} className="sm:w-48" />
          </FilterItem>
        )}
        <FilterItem label="Gender">
          <Select value={f.gender} onChange={(e) => setFilters({ gender: e.target.value })} placeholder="Any" options={GENDERS} className="sm:w-28" />
        </FilterItem>
        <FilterItem label="Age">
          <div className="flex items-center gap-1">
            <Input type="number" min={0} max={130} placeholder="Min" value={f.minAge} onChange={(e) => setFilters({ minAge: e.target.value })} className="sm:w-[4.5rem]" aria-label="Minimum age" />
            <span className="text-muted-foreground">–</span>
            <Input type="number" min={0} max={130} placeholder="Max" value={f.maxAge} onChange={(e) => setFilters({ maxAge: e.target.value })} className="sm:w-[4.5rem]" aria-label="Maximum age" />
          </div>
        </FilterItem>
        <DateRangeFilter label="Admitted" from={f.from} to={f.to} onChange={setFilters} />
        <FilterItem label="Sort by" className="lg:ml-auto">
          <Select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value })} options={PATIENT_SORTS} className="sm:w-44" />
        </FilterItem>
      </FilterBar>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : !data.data.length ? (
        active ? (
          <EmptyState title="No patients match" text="Try a different search term or clear the filters." action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
        ) : (
          <EmptyState icon={Users} title="No patients yet" text={doctorId ? "Add the first patient under this doctor." : "Add a patient and assign them to a doctor."} action={addButton} />
        )
      ) : (
        <div className={cn("transition-opacity", (isPlaceholderData || isPending) && "opacity-60")}>
          <PatientsTable patients={data.data} doctorId={doctorId} />
        </div>
      )}
      {data && data.meta.total > 0 && <Pagination meta={data.meta} onPage={(page) => setFilters({ page })} noun="patients" />}
      </Card>
    </>
  );
}
