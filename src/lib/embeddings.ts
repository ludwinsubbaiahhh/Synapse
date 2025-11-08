import { OpenAIEmbeddings } from "@langchain/openai";

import { getServerEnv } from "@/lib/env";

let embeddings: OpenAIEmbeddings | undefined;

export const getEmbeddings = () => {
  if (!embeddings) {
    const { OPENAI_API_KEY } = getServerEnv();

    embeddings = new OpenAIEmbeddings({
      apiKey: OPENAI_API_KEY,
      model: "text-embedding-3-large",
    });
  }

  return embeddings;
};

