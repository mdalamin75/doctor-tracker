"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Spinner } from "@/components/ui/misc";

/**
 * Local state for instant typing; pushes to the URL 300 ms after the user
 * stops, so we fire one request per pause rather than one per keystroke.
 */
export function SearchInput({ value, onChange, placeholder, loading }) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, 300);
  const lastPushed = useRef(value);

  // URL changed from elsewhere (back button, "clear filters") → reflect it.
  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (debounced.trim() !== lastPushed.current) {
      lastPushed.current = debounced.trim();
      onChange(debounced.trim());
    }
  }, [debounced, onChange]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {loading ? (
          <Spinner className="size-3.5" />
        ) : text ? (
          <button type="button" onClick={() => setText("")} aria-label="Clear search" className="grid place-items-center rounded p-0.5 hover:text-foreground">
            <X className="size-3.5" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
