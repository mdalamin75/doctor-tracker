import { memo } from "react";
import { CONDITION_MAP } from "@/lib/constants";

/** Status colour + text label (never colour alone). */
export const ConditionBadge = memo(function ConditionBadge({ value }) {
  const c = CONDITION_MAP[value] ?? { label: value, color: "var(--status-neutral)" };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium">
      <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
      {c.label}
    </span>
  );
});
