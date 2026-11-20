import { Suspense } from "react";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { PatientsView } from "./patients-view";
import { serverFetch } from "@/lib/server-api";
import { parsePatientFilters, queryKeys, toQueryString } from "@/lib/filters";

export const metadata = { title: "Patients" };

export default async function PatientsPage({ searchParams }) {
  const filters = parsePatientFilters(await searchParams);
  const qc = new QueryClient();
  const path = filters.doctor
    ? `/doctors/${filters.doctor}/patients?${toQueryString({ ...filters, doctor: "" })}`
    : `/patients?${toQueryString(filters)}`;
  await Promise.all([
    qc.prefetchQuery({ queryKey: queryKeys.patients(filters), queryFn: () => serverFetch(path) }),
    qc.prefetchQuery({ queryKey: queryKeys.doctorOptions, queryFn: () => serverFetch("/doctors/options") }),
  ]);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense>
        <PatientsView />
      </Suspense>
    </HydrationBoundary>
  );
}
