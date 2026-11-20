"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { loginSchema, validate } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

// Only allow same-site relative redirects (prevents open-redirects via ?next=).
const safeNext = (n) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(params.get("expired") ? "Your session expired. Please sign in again." : "");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const { data, errors } = validate(loginSchema, values);
    setErrors(errors);
    setFormError("");
    if (!data) return;
    setBusy(true);
    try {
      await api.login(data);
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-4">
      {formError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{formError}</p>}
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" type="email" autoComplete="email" autoFocus value={values.email} onChange={set("email")} aria-invalid={!!errors.email} placeholder="you@hospital.com" />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password}>
        <div className="relative">
          <Input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" value={values.password} onChange={set("password")} aria-invalid={!!errors.password} className="pr-10" />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Button type="submit" size="lg" disabled={busy} className="mt-2">
        {busy ? <Spinner /> : <LogIn />} {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
