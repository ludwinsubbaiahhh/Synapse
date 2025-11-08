import { QdrantClient } from "@qdrant/js-client-rest";

import { getServerEnv } from "@/lib/env";

type GlobalWithQdrant = typeof globalThis & {
  qdrantClient?: QdrantClient;
};

const globalWithQdrant = globalThis as GlobalWithQdrant;

const createQdrantClient = () => {
  const { QDRANT_URL, QDRANT_API_KEY } = getServerEnv();

  return new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  });
};

export const qdrant =
  globalWithQdrant.qdrantClient ??
  (globalWithQdrant.qdrantClient = createQdrantClient());

