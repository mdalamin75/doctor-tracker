"use client";
import { Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card } from "@/components/ui/misc";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { DateRangeFilter, FilterBar, FilterItem } from "@/components/common/filter-bar";
import { Pagination } from "@/components/common/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states";
import { DoctorFormDialog } from "./doctor-form-dialog";
import { DoctorsTable } from "./doctors-table";
import { useDoctorOptions, useDoctors } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { parseDoctorFilters } from "@/lib/filters";
import { DOCTOR_SORTS } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";

const toOptions = (arr = []) => arr.map((v) => ({ value: v, label: v }));

export function DoctorsView() {
  const { filters: f, setFilters, reset, isPending } = useUrlFilters(parseDoctorFilters);
  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } = useDoctors(f);
  const options = useDoctorOptions();
  const active = [f.q, f.specialization, f.hospital, f.from, f.to].filter(Boolean).length;
  const filtering = [f.specialization, f.hospital, f.from, f.to].filter(Boolean).length;

  const addButton = <DoctorFormDialog trigger={<Button><Plus /> Add doctor</Button>} />;

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle={data ? `${formatNumber(data.meta.total)} ${active ? "matching" : "doctors in your network"}` : "Your care network"}
        actions={addButton}
      />
      <Card>
        <FilterBar
          activeCount={filtering}
          onReset={reset}
          search={<SearchInput value={f.q} onChange={(q) => setFilters({ q })} placeholder="Search name, specialty, hospital, email or phone" loading={isFetching && !isLoading} />}
        >
          <FilterItem label="Specialization">
            <Select value={f.specialization} onChange={(e) => setFilters({ specialization: e.target.value })} placeholder="All" options={toOptions(options.data?.specializations)} className="sm:w-44" />
          </FilterItem>
          <FilterItem label="Hospital">
            <Select value={f.hospital} onChange={(e) => setFilters({ hospital: e.target.value })} placeholder="All" options={toOptions(options.data?.hospitals)} className="sm:w-52" />
          </FilterItem>
          <DateRangeFilter label="Joined" from={f.from} to={f.to} onChange={setFilters} />
          <FilterItem label="Sort by" className="lg:ml-auto">
            <Select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value })} options={DOCTOR_SORTS} className="sm:w-40" />
          </FilterItem>
        </FilterBar>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <TableSkeleton />
        ) : !data.data.length ? (
          active ? (
            <EmptyState title="No doctors match" text="Try a different search term or clear the filters." action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
          ) : (
            <EmptyState icon={Stethoscope} title="No doctors yet" text="Add your first doctor to start tracking patients." action={addButton} />
          )
        ) : (
          <div className={cn("transition-opacity", (isPlaceholderData || isPending) && "opacity-60")}>
            <DoctorsTable doctors={data.data} sort={f.sort} />
          </div>
        )}
        {data && data.meta.total > 0 && <Pagination meta={data.meta} onPage={(page) => setFilters({ page })} noun="doctors" />}
      </Card>
    </>
  );
}
