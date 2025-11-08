"use client";

import { FormEvent, useEffect, useState } from "react";

import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { supabase, session } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      window.location.assign("/");
    }
  }, [session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setMessage(null);
    setLoading(true);

    const authFn = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    const { error: authError } = await authFn;

    if (authError) {
      setError(authError.message);
    } else {
      setMessage(
        isSignUp
          ? "Account created. Check your email for verification if required."
          : "Signed in! Redirecting...",
      );
      window.location.assign("/");
    }

    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-6 py-24">
      <h1 className="text-2xl font-semibold">
        {isSignUp ? "Create your Synapse account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSignUp
          ? "Sign up with email and password to start building your second brain."
          : "Sign in with your credentials to access your memories."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90",
            loading && "opacity-60",
          )}
        >
          {loading
            ? "Processing..."
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {(error || message) && (
        <p
          className={cn(
            "mt-4 text-sm",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error ?? message}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setIsSignUp((prev) => !prev);
          setError(null);
          setMessage(null);
        }}
        className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </main>
  );
}

