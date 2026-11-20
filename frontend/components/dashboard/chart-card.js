"use client";
import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Card } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/**
 * Panel for one chart, with a chart/table toggle so every figure has an
 * accessible, exact-number alternative.
 */
export function ChartCard({ title, subtitle, table, children, className, height = "h-72", action }) {
  const [view, setView] = useState("chart");
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {table && (
            <div className="flex rounded-lg border p-0.5" role="group" aria-label={`${title} view`}>
              {[["chart", BarChart3, "Chart view"], ["table", Table2, "Table view"]].map(([v, Icon, label]) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={label} title={label}
                  className={cn("rounded-md p-1.5", view === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {view === "chart" ? <div className={cn("min-h-0", height)}>{children}</div> : <DataTable {...table} />}
    </Card>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
          <tr>{columns.map((c, i) => <th key={c} scope="col" className={cn("px-3 py-2 font-medium", i && "text-right")}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => <td key={j} className={cn("px-3 py-1.5", j && "text-right tabular")}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
