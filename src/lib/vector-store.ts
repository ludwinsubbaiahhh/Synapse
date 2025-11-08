import { QdrantVectorStore } from "langchain/vectorstores/qdrant";

import { getEmbeddings } from "@/lib/embeddings";
import { getServerEnv } from "@/lib/env";
import { qdrant } from "@/lib/qdrant";

let vectorStorePromise: Promise<QdrantVectorStore> | null = null;

export const getMemoryVectorStore = () => {
  if (!vectorStorePromise) {
    const { QDRANT_COLLECTION } = getServerEnv();

    vectorStorePromise = QdrantVectorStore.fromExistingCollection(
      getEmbeddings(),
      {
        client: qdrant,
        collectionName: QDRANT_COLLECTION,
      },
    );
  }

  return vectorStorePromise;
};

