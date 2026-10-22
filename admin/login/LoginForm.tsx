"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from "lucide-react";
import { signIn, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {
    error: initialError,
  });
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate={false}>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-200">
          <AlertCircle size={18} className="mt-px shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          maxLength={120}
          className="min-h-12 w-full rounded-xl border border-line bg-ink px-4 text-white outline-none transition focus:border-electric focus:ring-4 focus:ring-electric/15"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            maxLength={200}
            className="min-h-12 w-full rounded-xl border border-line bg-ink px-4 pr-12 text-white outline-none transition focus:border-electric focus:ring-4 focus:ring-electric/15"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-white"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
        {pending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <LogIn size={18} aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
