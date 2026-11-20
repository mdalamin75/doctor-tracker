import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }) => <section className={cn("rounded-2xl border bg-card", className)} {...props} />;

export const Skeleton = ({ className }) => <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-hidden />;

export function Spinner({ className }) {
  return <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} role="status" aria-label="Loading" />;
}
