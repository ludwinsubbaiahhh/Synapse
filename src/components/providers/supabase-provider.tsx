"use client";

import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SupabaseContextValue = {
  session: Session | null;
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  supabaseUrl: string;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined,
);

export function SupabaseProvider({
  initialSession,
  supabaseUrl,
  supabaseAnonKey,
  children,
}: PropsWithChildren<{
  initialSession: Session | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
}>) {
  const supabase = useMemo(
    () => getSupabaseBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseAnonKey, supabaseUrl],
  );
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider
      value={{ session, supabase, supabaseUrl }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return context;
};

