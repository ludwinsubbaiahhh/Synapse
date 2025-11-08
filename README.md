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

4. Start the dev server on port 5000 (the extension expects this)

```bash
npm run dev -- --port 5000
```

Open http://localhost:5000 to view Synapse.

## Browser Extension (Save to Synapse)

The `extension/` folder contains a manifest V3 Chrome extension that turns any highlight into a Synapse memory.

### Install locally

1. Build/start the app on port 5000 (see above) and ensure you are signed in once.
2. In Chrome, open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `extension/` directory.
3. Optional: Pin the extension for quick access. The content script runs automatically on every page.

### Usage

- Highlight any text on the web; a floating “Save to Synapse” button will appear near your cursor.
- Click the button to send `{ selectedText, pageTitle, pageURL, timestamp }` to `http://localhost:5000/api/save`.
- A toast confirms “Saved to Synapse ✅”. Refresh your Synapse dashboard to see the memory in “Recent memories”.

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

- Connect additional enrichment (summaries, embeddings) in the `/api/save` pipeline.
- Add background jobs for heavy scraping or OCR.
- Wire semantic search against Qdrant using `src/lib/vector-store.ts`.
