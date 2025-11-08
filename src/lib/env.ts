import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  QDRANT_URL: z.string().url(),
  QDRANT_API_KEY: z.string().min(1),
  QDRANT_COLLECTION: z.string().min(1),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function loadEnv<T extends z.ZodTypeAny>(schema: T) {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const details = Object.entries(formatted)
      .map(([key, value]) => `${key}: ${value?.join(", ") ?? "missing"}`)
      .join("\n  ");

    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }

  return parsed.data;
}

let serverEnvCache: z.infer<typeof serverSchema> | null = null;
let clientEnvCache: z.infer<typeof clientSchema> | null = null;

export const getServerEnv = () => {
  if (!serverEnvCache) {
    serverEnvCache = loadEnv(serverSchema);
  }

  return serverEnvCache;
};

export const getClientEnv = () => {
  if (!clientEnvCache) {
    clientEnvCache = loadEnv(clientSchema);
  }

  return clientEnvCache;
};

