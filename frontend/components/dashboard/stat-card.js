import { Card } from "@/components/ui/misc";
import { cn, formatNumber } from "@/lib/utils";

export function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground sm:text-sm">
        {label}
        <span className={cn("grid size-7 shrink-0 place-items-center sm:size-8 rounded-lg bg-secondary text-primary", tone)}><Icon className="size-4" /></span>
      </div>
      <p className="mt-2 font-display text-3xl sm:mt-3 sm:text-4xl font-semibold tracking-tight tabular">{typeof value === "number" ? formatNumber(value) : value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
