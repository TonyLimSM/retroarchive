"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "./actions";

const initial: AuthState = { error: null, info: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState(action, initial);

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {mode === "signin"
          ? "Welcome back."
          : "Email + password. No verification needed if you disabled it in Supabase."}
      </p>

      <form action={formAction} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 block w-full rounded border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="mt-1 block w-full rounded border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:outline-none"
          />
        </label>

        {state.error && (
          <p className="text-xs text-red-700">{state.error}</p>
        )}
        {state.info && (
          <p className="text-xs text-emerald-700">{state.info}</p>
        )}

        <SubmitButton mode={mode} />
      </form>

      <p className="mt-4 text-xs text-stone-600">
        {mode === "signin" ? "No account? " : "Already have one? "}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="underline hover:text-stone-900"
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function SubmitButton({ mode }: { mode: "signin" | "signup" }) {
  const { pending } = useFormStatus();
  const label = mode === "signin" ? "Sign in" : "Create account";
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
