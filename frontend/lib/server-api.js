import "server-only";
import { getSession } from "./session";

const API_URL = (process.env.API_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");

/**
 * Server-side fetch to the Express API, forwarding the user's session.
 * Used to prefetch the first page of data during SSR so pages render
 * with content instead of a spinner.
 */
export async function serverFetch(path) {
  const session = await getSession();
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: session ? { Authorization: `Bearer ${session.token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json();
}
