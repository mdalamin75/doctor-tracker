import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { DoctorProfile } from "@/components/doctors/doctor-profile";
import { serverFetch } from "@/lib/server-api";
import { parsePatientFilters, queryKeys, toQueryString } from "@/lib/filters";

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!isObjectId(id)) return { title: "Doctor not found" };
  const res = await serverFetch(`/doctors/${id}`).catch(() => null);
  return { title: res?.data?.name ?? "Doctor" };
}

export default async function DoctorPage({ params, searchParams }) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const qc = new QueryClient();
  const doctor = await serverFetch(`/doctors/${id}`).catch(() => null);
  if (!doctor) notFound();
  qc.setQueryData(queryKeys.doctor(id), doctor);

  const filters = { ...parsePatientFilters(await searchParams), doctor: id };
  await qc.prefetchQuery({
    queryKey: queryKeys.patients(filters),
    queryFn: () => serverFetch(`/doctors/${id}/patients?${toQueryString({ ...filters, doctor: "" })}`),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense>
        <DoctorProfile id={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
