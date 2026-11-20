import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact }) {
  return (
    <span className={cn("flex items-center gap-2.5 font-display text-lg font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar"><Stethoscope className="size-4" /></span>
      {!compact && <span>Doctor Tracker</span>}
    </span>
  );
}
