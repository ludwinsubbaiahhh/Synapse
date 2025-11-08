import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;
let cachedUrl: string | undefined;
let cachedAnonKey: string | undefined;

export const getSupabaseBrowserClient = (
  url: string,
  anonKey: string,
) => {
  if (
    browserClient &&
    cachedUrl === url &&
    cachedAnonKey === anonKey
  ) {
    return browserClient;
  }

  cachedUrl = url;
  cachedAnonKey = anonKey;

  browserClient = createBrowserClient(url, anonKey);

  return browserClient;
};

