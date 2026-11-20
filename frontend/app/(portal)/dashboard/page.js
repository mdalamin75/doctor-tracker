import { Suspense } from "react";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { serverFetch } from "@/lib/server-api";
import { parseMonths, queryKeys } from "@/lib/filters";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }) {
  const { months } = parseMonths(await searchParams);
  const qc = new QueryClient();
  await qc.prefetchQuery({ queryKey: queryKeys.dashboard(months), queryFn: () => serverFetch(`/dashboard/stats?months=${months}`) });
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense>
        <DashboardView />
      </Suspense>
    </HydrationBoundary>
  );
}
