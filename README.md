## Project Synapse

Second-brain workspace for capturing, enriching, and recalling anything you care about. The stack pairs Next.js App Router with Supabase for relational storage, Prisma for modeling, Qdrant for vector search, and LangChain/OpenAI for semantic understanding.

## Tech Stack

- Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui)
- Supabase (hosted Postgres + auth) accessed via Prisma
- Qdrant vector database for semantic search (managed or self-hosted)
- LangChain + OpenAI embeddings

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Copy `.env` to `.env.local` and provide credentials from Supabase, Qdrant, and OpenAI.

```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[project-ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key

OPENAI_API_KEY=sk-...

QDRANT_URL=https://[cluster-id].qdrant.tech
QDRANT_API_KEY=...
QDRANT_COLLECTION=synapse_memories
```

3. Push the Prisma schema to Supabase and generate the client

```bash
npm run db:push
npm run prisma:generate
```

4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 and you should see the Synapse workspace shell UI.

## Supabase Notes

- Create a new project, enable the `[uuid-ossp]` extension (Settings → Database).
- Set `DATABASE_URL` to the project connection string.
- Add the service role and anon keys to your environment files.
- Prisma migrations can run directly against Supabase; for prototyping `db:push` is fine.

## Qdrant Notes

- Create a collection named `synapse_memories` with cosine distance and vector size `3072` (OpenAI `text-embedding-3-large`).
- The app lazily connects via `src/lib/vector-store.ts`; make sure the API key has read/write access.

## Useful Commands

```bash
npm run dev              # start Next.js with Turbopack disabled
npm run build            # production build
npm run lint             # ESLint
npm run prisma:generate  # regenerate Prisma client
npm run db:push          # sync schema to Supabase
npm run db:studio        # inspect data
```

## Next Steps

- Implement capture APIs for URLs, highlights, and file uploads.
- Add background jobs for enrichment (scraping, OCR, summarization).
- Wire UI surfaces for the visual memory board and semantic search (see `src/lib/vector-store.ts`).
