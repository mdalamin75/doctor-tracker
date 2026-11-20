import { Suspense } from "react";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { DoctorsView } from "@/components/doctors/doctors-view";
import { serverFetch } from "@/lib/server-api";
import { parseDoctorFilters, queryKeys, toQueryString } from "@/lib/filters";

export const metadata = { title: "Doctors" };

// Server-render the first page for the exact filters in the URL, so the
// table is in the HTML on first load; the client takes over from there.
export default async function DoctorsPage({ searchParams }) {
  const filters = parseDoctorFilters(await searchParams);
  const qc = new QueryClient();
  await Promise.all([
    qc.prefetchQuery({ queryKey: queryKeys.doctors(filters), queryFn: () => serverFetch(`/doctors?${toQueryString(filters)}`) }),
    qc.prefetchQuery({ queryKey: queryKeys.doctorOptions, queryFn: () => serverFetch("/doctors/options") }),
  ]);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense>
        <DoctorsView />
      </Suspense>
    </HydrationBoundary>
  );
}
