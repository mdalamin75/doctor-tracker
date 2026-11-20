"use client";
import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { compact } from "@/lib/filters";

/**
 * Keeps list filters in the URL (?q=&condition=&page=…), so filtered views are
 * shareable, survive reloads and work with the back button.
 * Changing any filter other than `page` resets to page 1.
 */
export function useUrlFilters(parse) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const filters = useMemo(() => parse(params), [params, parse]);

  const setFilters = useCallback(
    (patch) => {
      const next = { ...Object.fromEntries(params.entries()), ...patch };
      if (!("page" in patch)) delete next.page;
      if (next.page === 1 || next.page === "1") delete next.page;
      const qs = new URLSearchParams(compact(next)).toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router]
  );

  const reset = useCallback(() => startTransition(() => router.replace(pathname, { scroll: false })), [pathname, router]);

  return { filters, setFilters, reset, isPending };
}
