"use client";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Search on top; filters inline on desktop and collapsible on mobile
 * (with a badge counting the active ones).
 */
export function FilterBar({ search, children, activeCount, onReset }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b p-3 sm:p-4">
      <div className="flex gap-2">
        {search}
        <Button variant="outline" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="filters" aria-label={activeCount ? `Filters (${activeCount} active)` : "Filters"}>
          <SlidersHorizontal />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">{activeCount}</span>}
        </Button>
      </div>
      <div id="filters" className={cn("mt-3 flex-wrap items-end gap-2 lg:flex", open ? "grid grid-cols-2 sm:flex" : "hidden")}>
        {children}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="col-span-2 h-10 text-muted-foreground">
            <X /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

/** Small labelled wrapper so every filter control has a visible label. */
export function FilterItem({ label, children, className }) {
  return (
    <label className={cn("grid min-w-0 gap-1 text-xs font-medium text-muted-foreground", className)}>
      {label}
      {children}
    </label>
  );
}

export function DateRangeFilter({ label, from, to, onChange }) {
  return (
    <>
      <FilterItem label={`${label} from`}>
        <Input type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value })} className="sm:w-40" />
      </FilterItem>
      <FilterItem label={`${label} to`}>
        <Input type="date" value={to} min={from || undefined} onChange={(e) => onChange({ to: e.target.value })} className="sm:w-40" />
      </FilterItem>
    </>
  );
}
