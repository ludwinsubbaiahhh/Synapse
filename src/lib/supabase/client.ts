import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    getClientEnv();

  browserClient = createBrowserClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
};

