<div align="center">

# Synapse – Your Semantic Second Brain

Capture anything you read, enrich it with AI, and recall it instantly with semantic search.

![Synapse screenshot](./public/window.svg)

</div>

## ✨ Features

- **Unified capture & recall** – Save highlights, full pages, and to‑do lists into Supabase via the built-in API.
- **Semantic search** – Qdrant + OpenAI embeddings power natural‑language search across your memories.
- **Chrome extension** – Lightweight MV3 extension injects a “Save to Synapse” bubble on any webpage.
- **Rich enrichment pipeline** – Prisma models, LangChain processors, and background jobs prepare structured memory cards.
- **Typed, modern stack** – Next.js App Router, TypeScript, Tailwind, shadcn/ui, and Supabase auth.

## 🧱 Architecture

| Layer | Tech | Notes |
| --- | --- | --- |
| Web app | Next.js 15 (App Router) | Routes in `src/app`, server components by default |
| Database | Supabase (Postgres) + Prisma | Schema in `prisma/schema.prisma`, generated client in `src/generated` |
| Semantic search | Qdrant + OpenAI `text-embedding-3-large` | Helpers in `src/lib/vector-store.ts` |
| AI utilities | LangChain / OpenAI SDK | Capture enrichment in `src/lib/capture/**` |
| Auth | Supabase | Provider in `src/components/providers/supabase-provider.tsx` |
| Extension | Manifest V3 Chrome extension | Lives in `extension/` |

The `/api/save` route validates incoming capture payloads, persists memories, schedules retries, and updates vector embeddings so that semantic search stays in sync.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm (comes with Node)
- Supabase project (Postgres + Auth)
- Qdrant cluster (managed or self-hosted)
- OpenAI API key (for embeddings & enrichment)

### 1. Clone & install

```bash
git clone https://github.com/<your-org>/synapse.git
cd synapse
npm install
```

### 2. Configure environment variables

Copy `.env` (or `.env.example`) and fill in real credentials:

```bash
DATABASE_URL=postgresql://postgres:<PASSWORD>@aws-1...supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

OPENAI_API_KEY=sk-...

QDRANT_URL=https://<cluster-id>.cloud.qdrant.io
QDRANT_API_KEY=<qdrant-key>
QDRANT_COLLECTION=synapse_memories
```

### 3. Prepare the database

```bash
npm run db:push       # sync Prisma schema to Supabase
npm run prisma:generate
```

You can inspect data with `npm run db:studio`.

### 4. Run the dev server

```bash
npm run dev
```

Synapse boots on [http://localhost:3000](http://localhost:3000). Sign in with Supabase auth to create an initial session (the extension relies on your browser cookies).

## 🔍 Semantic Search

1. Captures pass through `processIncomingCapture` to detect type (article/product/todo/link).
2. Embedding jobs compute OpenAI vectors and upsert them into Qdrant.
3. `src/app/search/page.tsx` runs filtered Prisma queries; advanced vector search utilities are provided in `src/lib/vector-store.ts`.

To run vector similarity queries:

```ts
import { searchSimilarMemories } from "@/lib/vector-store";

const results = await searchSimilarMemories({
  query: "summarise my research on LLM agents",
  userId,
  limit: 10,
});
```

## 🧩 Chrome Extension

The `extension/` folder contains **Synapse Saver** (manifest V3).

### Install locally

1. Ensure the Next.js dev server is running on port **3000** and you are logged in.
2. In Chrome visit `chrome://extensions`, toggle **Developer mode**, click **Load unpacked**, and pick the `extension/` folder.
3. Optionally pin the extension — the content script runs automatically on every page.

### Use it

1. Highlight text → a floating “Save to Synapse” chip appears.
2. Click to POST `{ selectedText, title, url, capturedAt }` to `http://localhost:3000/api/save`.
3. A toast confirms success; the memory instantly appears at `/captured` or via search.

### Troubleshooting

- “Failed to fetch”: make sure the app is running on a localhost port (3000–3003). The background service worker auto-discovers the first reachable port.
- “Unauthorized”: open [http://localhost:3000](http://localhost:3000) and sign in so the browser has a valid Supabase session cookie.

## 🛠️ Available Scripts

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run start            # Serve production build
npm run lint             # ESLint
npm run prisma:generate  # Regenerate Prisma client
npm run db:push          # Push schema to Supabase
npm run db:studio        # Prisma Studio UI
```

## 🧱 Data Model & Integrations

- `prisma/schema.prisma` defines `Memory`, `Tag`, `CaptureJob`, and supporting tables.
- `src/lib/prisma.ts` exports a singleton Prisma client tuned for serverless environments.
- Vector embeddings live in Qdrant — configure the collection (`cosine`, vector length `3072`).
- OpenAI keys fuel embeddings/summaries; the project uses LangChain wrappers so you can swap models.

## 🧪 Testing Ideas

- Extend `src/app/api/save/route.ts` with unit tests via [Next.js route handlers + Vitest](https://nextjs.org/docs/app/building-your-application/optimizing/testing).
- Add Cypress or Playwright smoke tests for `/captured` and `/search`.

## 📦 Deployment

- Provision environment variables in Vercel/Netlify before deploying.
- Ensure Supabase service role key is **never** exposed to client-side bundles (server-only usage).
- Run `npm run build && npm run start` to verify production readiness locally.

## 🤝 Contributing

1. Fork & clone.
2. Create a feature branch (`git checkout -b feat/semantic-highlights`).
3. Commit with conventional messages.
4. Open a PR — describe feature, screenshots, and testing steps.

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [LangChain JS](https://js.langchain.com/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

Synapse is the second brain you actually keep up-to-date — save the things you read, search them semantically, and stay in flow. Happy building!
