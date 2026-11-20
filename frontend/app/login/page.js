import { Suspense } from "react";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <Logo />
        <div className="relative z-10 max-w-md">
          <p className="font-display text-4xl leading-tight">Every doctor. Every patient. <em className="text-sidebar-primary">One calm view.</em></p>
          <p className="mt-4 text-sm opacity-70">Manage your care network, track patient conditions and see admissions trends at a glance.</p>
        </div>
        <p className="text-xs opacity-50">Authorised administrators only. Activity is logged.</p>
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-sidebar-accent/60" />
        <div aria-hidden className="absolute -bottom-32 right-20 size-72 rounded-full bg-sidebar-accent/40" />
      </aside>
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 rounded-xl bg-sidebar p-3 text-sidebar-foreground lg:hidden"><Logo /></div>
          <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to the admin portal.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
