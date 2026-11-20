"use client";
import { Activity, AlertTriangle, Stethoscope, UserPlus, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/states";
import { Card, Skeleton } from "@/components/ui/misc";
import { ChartCard } from "./chart-card";
import { StatCard } from "./stat-card";
import { AdmissionsTrend, AgeChart, ConditionBars, DailyAdmissions, GenderSplit, NewDoctorsChart, RankedBars } from "./charts";
import { useDashboard } from "@/hooks/use-api";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { CONDITION_MAP } from "@/lib/constants";
import { DASHBOARD_RANGES as RANGES, parseMonths } from "@/lib/filters";
import { cn, formatNumber } from "@/lib/utils";


function RangePicker({ value, onChange }) {
  return (
    <div className="flex rounded-lg border bg-card p-1" role="radiogroup" aria-label="Time range">
      {RANGES.map((m) => (
        <button key={m} role="radio" aria-checked={value === m} onClick={() => onChange(m)}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", value === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          {m} months
        </button>
      ))}
    </div>
  );
}

export function DashboardView() {
  const { filters, setFilters } = useUrlFilters(parseMonths);
  const { data, isLoading, error, refetch, isPlaceholderData } = useDashboard(filters.months);

  const header = (
    <PageHeader
      title="Dashboard"
      subtitle={data ? `Live overview · updated ${format(new Date(data.generatedAt), "HH:mm")}` : "Live overview of your care network"}
      actions={<RangePicker value={filters.months} onChange={(months) => setFilters({ months: months === 6 ? "" : months })} />}
    />
  );

  if (error) return <>{header}<Card><ErrorState error={error} onRetry={refetch} /></Card></>;
  if (isLoading) {
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3"><Skeleton className="h-96 rounded-2xl lg:col-span-2" /><Skeleton className="h-96 rounded-2xl" /></div>
      </>
    );
  }

  const { totals, monthly, daily, byCondition, byGender, ageGroups, patientsPerDoctor, bySpecialization } = data;
  const rangeAdmissions = monthly.reduce((n, m) => n + m.admissions, 0);
  const rangeDoctors = monthly.reduce((n, m) => n + m.newDoctors, 0);
  const rangeLabel = `${monthLabel(monthly[0].month)} – ${monthLabel(monthly.at(-1).month)}`;

  return (
    <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
      {header}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Stethoscope} label="Total doctors" value={totals.doctors} hint={`${rangeDoctors} joined in the last ${filters.months} months`} />
        <StatCard icon={Users} label="Total patients" value={totals.patients} hint={`${totals.avgPatientsPerDoctor} patients per doctor on average`} />
        <StatCard icon={Activity} label="Admitted · last 30 days" value={totals.admittedLast30Days} hint={`${formatNumber(rangeAdmissions)} in the last ${filters.months} months`} />
        <StatCard icon={AlertTriangle} label="Critical patients" value={totals.critical} tone="bg-[var(--status-critical)]/10 text-[var(--status-critical)]"
          hint={`${Math.round((totals.critical / (totals.patients || 1)) * 100)}% of all patients`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="Admissions per month" subtitle={rangeLabel} className="lg:col-span-2"
          table={{ columns: ["Month", "Admissions", "New doctors"], rows: monthly.map((m) => [monthLabel(m.month, "MMMM yyyy"), m.admissions, m.newDoctors]) }}>
          <AdmissionsTrend data={monthly} />
        </ChartCard>

        <ChartCard title="Patient conditions" subtitle={`${formatNumber(totals.patients)} patients`} height="h-auto"
          table={{ columns: ["Condition", "Patients"], rows: byCondition.map((c) => [CONDITION_MAP[c.condition]?.label ?? c.condition, c.count]) }}>
          <ConditionBars data={byCondition} total={totals.patients} />
        </ChartCard>

        <ChartCard title="Patients per doctor" subtitle="Top 10 by patient load" className="lg:col-span-2" height="h-auto"
          table={{ columns: ["Doctor", "Patients", "Critical"], rows: patientsPerDoctor.map((d) => [d.name, d.count, d.critical]) }}>
          <RankedBars unit="patients" rows={patientsPerDoctor.map((d) => ({ key: d.doctorId, label: d.name, sub: d.specialization, value: d.count, href: `/doctors/${d.doctorId}` }))} />
        </ChartCard>

        <ChartCard title="By specialization" subtitle="Patients per specialty" height="h-auto"
          table={{ columns: ["Specialization", "Doctors", "Patients"], rows: bySpecialization.map((s) => [s.specialization, s.doctors, s.patients]) }}>
          <RankedBars unit="patients" rows={bySpecialization.map((s) => ({ key: s.specialization, label: s.specialization, sub: `${s.doctors} dr`, value: s.patients }))} />
        </ChartCard>

        <ChartCard title="Daily admissions" subtitle="Last 30 days" className="lg:col-span-2" height="h-56"
          table={{ columns: ["Date", "Admissions"], rows: daily.map((d) => [format(parseISO(d.date), "EEE d MMM"), d.admissions]) }}>
          <DailyAdmissions data={daily} />
        </ChartCard>

        <ChartCard title="Doctors joined" subtitle={rangeLabel} height="h-56"
          table={{ columns: ["Month", "New doctors"], rows: monthly.map((m) => [monthLabel(m.month, "MMMM yyyy"), m.newDoctors]) }}>
          <NewDoctorsChart data={monthly} />
        </ChartCard>

        <ChartCard title="Age groups" subtitle="Patients by age" className="lg:col-span-2" height="h-56"
          table={{ columns: ["Age", "Patients"], rows: ageGroups.map((a) => [a.range, a.count]) }}>
          <AgeChart data={ageGroups} />
        </ChartCard>

        <ChartCard title="Gender" subtitle="Share of patients" height="h-auto">
          <GenderSplit data={byGender} total={totals.patients} />
        </ChartCard>
      </div>
    </div>
  );
}

function monthLabel(m, pattern = "MMM yyyy") {
  return format(parseISO(`${m}-01`), pattern);
}
