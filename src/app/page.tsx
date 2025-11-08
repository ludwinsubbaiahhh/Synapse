const pillars = [
  {
    title: "Capture Anything",
    description:
      "Drop URLs, highlights, files, or raw thoughts into Synapse. A capture API and browser surfaces will normalize each memory.",
  },
  {
    title: "Visual Memory Board",
    description:
      "Memories render as contextual cards — articles, products, videos, or handwritten notes — so your second brain feels tangible.",
  },
  {
    title: "Semantic Recall",
    description:
      "LangChain + Qdrant power natural language search across your entire knowledge base. Ask questions the way you think.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-24">
      <section className="space-y-6 text-balance">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Project Synapse
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Build the intelligent second brain for everything you save.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          This prototype stitches together Supabase, Prisma, Qdrant, and
          LangChain so every capture is enriched, indexed, and instantly
          recallable. Add the capture flows and bring the magic to life.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-primary px-4 py-1 text-sm text-primary-foreground">
            Next.js 15 + shadcn/ui
          </span>
          <span className="rounded-full border border-border px-4 py-1 text-sm text-muted-foreground">
            Supabase · Prisma · Qdrant · LangChain
          </span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{pillar.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {pillar.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
