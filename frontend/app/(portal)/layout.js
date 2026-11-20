import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

// Defence in depth: proxy.js already redirects, but every protected layout
// re-checks the session on the server before rendering anything.
export default async function PortalLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AppShell user={session.user}>{children}</AppShell>;
}
