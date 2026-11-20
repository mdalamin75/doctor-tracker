import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (d, pattern = "d MMM yyyy") => (d ? format(new Date(d), pattern) : "—");
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const todayInput = () => new Date().toISOString().slice(0, 10);

export const initials = (name = "") =>
  name.replace(/^Dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export const formatNumber = (n) => new Intl.NumberFormat("en").format(n ?? 0);
