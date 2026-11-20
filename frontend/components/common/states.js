import { AlertCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export function EmptyState({ title = "Nothing here yet", text, action, icon: Icon = SearchX }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted"><Icon className="size-5 text-muted-foreground" /></div>
      <h3 className="mt-4 font-medium">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <p className="mt-3 font-medium">Couldn&apos;t load this data</p>
      <p className="mt-1 text-sm text-muted-foreground">{error?.message}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/5" /></div>
          <Skeleton className="hidden h-6 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}
