"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { supabase, session } = useSupabase();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[Auth] sign out error", error);
      } else {
        window.location.reload();
      }
    } finally {
      setIsSigningOut(false);
    }
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-semibold tracking-tight text-slate-900 transition hover:text-slate-700"
        >
          Synapse
        </Link>

        <nav className="flex items-center gap-3 text-sm text-slate-600">
          <Link
            href="/captured"
            className="rounded-full px-3 py-1.5 transition hover:bg-slate-900/5 hover:text-slate-900"
          >
            Memories
          </Link>
          <Link
            href="/search"
            className="rounded-full px-3 py-1.5 transition hover:bg-slate-900/5 hover:text-slate-900"
          >
            Search
          </Link>
          {session ? (
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                "rounded-full border border-slate-200 px-4 py-1.5 text-slate-900 transition hover:bg-slate-900 hover:text-white",
                isSigningOut && "opacity-60",
              )}
              disabled={isSigningOut}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white shadow-md transition hover:bg-slate-800"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

