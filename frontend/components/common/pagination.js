"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

/** Compact page list: 1 … 4 5 [6] 7 8 … 20 */
function pageList(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i && p - sorted[i - 1] > 1 ? ["…", p] : [p]));
}

export function Pagination({ meta, onPage, noun = "records" }) {
  if (!meta) return null;
  const { page, limit, total, totalPages } = meta;
  const start = total ? (page - 1) * limit + 1 : 0;
  const end = Math.min(total, page * limit);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
      <p className="text-muted-foreground tabular">
        Showing <span className="font-medium text-foreground">{start}–{end}</span> of{" "}
        <span className="font-medium text-foreground">{formatNumber(total)}</span> {noun}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "primary" : "ghost"}
              size="icon"
              className="size-8 text-xs tabular"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
