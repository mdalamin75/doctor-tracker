"use client";
import { ErrorState } from "@/components/common/states";
import { Card } from "@/components/ui/misc";

export default function PortalError({ error, reset }) {
  return <Card><ErrorState error={error} onRetry={reset} /></Card>;
}
