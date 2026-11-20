"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Stethoscope, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn, initials } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
];

export function AppShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const signOut = async () => {
    await api.logout().catch(() => {});
    qc.clear(); // no data from this session may leak into the next one
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <div className="hidden bg-sidebar lg:block">
      <aside className="sticky top-0 flex h-dvh flex-col px-4 py-6 text-sidebar-foreground">
        <Link href="/dashboard" className="px-2"><Logo /></Link>
        <nav className="mt-10 grid gap-1" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive(href) ? "bg-sidebar-accent font-medium" : "opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100"
              )}
            >
              <Icon className={cn("size-4", isActive(href) && "text-sidebar-primary")} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize opacity-60">{user.role}</p>
            </div>
          </div>
          <button onClick={signOut} className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      </div>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <Link href="/dashboard"><Logo /></Link>
        <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm opacity-80 hover:bg-sidebar-accent" aria-label="Sign out">
          <LogOut className="size-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-card/95 backdrop-blur lg:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", isActive(href) ? "text-primary" : "text-muted-foreground")}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
