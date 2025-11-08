import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "Clip Anything",
    description:
      "Save articles, highlights, screenshots, audio notes, or raw thoughts. Synapse normalizes and enriches every capture automatically.",
    action: { label: "Capture now", href: "/capture" },
  },
  {
    title: "Visual Mindspace",
    description:
      "Memories render as rich cards—products show price context, research highlights stay readable, and todos flow into structured lists.",
    action: { label: "View board", href: "/captured" },
  },
  {
    title: "Ask and Recall",
    description:
      "Semantic search over embeddings + metadata lets you ask natural questions. Filter by type, tags, or time with zero friction.",
    action: { label: "Try search", href: "/search" },
  },
];

const typeColor = (contentType: string) => {
  switch (contentType) {
    case "ARTICLE":
      return "bg-orange-100 text-orange-600";
    case "PRODUCT":
      return "bg-emerald-100 text-emerald-600";
    case "VIDEO":
      return "bg-rose-100 text-rose-600";
    case "NOTE":
      return "bg-sky-100 text-sky-600";
    case "TODO":
      return "bg-violet-100 text-violet-600";
    case "DOCUMENT":
      return "bg-amber-100 text-amber-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const memories = session
    ? await prisma.memory.findMany({
        where: { userId: session.user.id },
        orderBy: { capturedAt: "desc" },
        take: 6,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })
    : [];

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(79,70,229,0.22),_transparent_60%)]" />

      <section className="mx-auto flex min-h-[60vh] max-w-5xl flex-col gap-12 px-6 pb-20 pt-28">
        <div className="max-w-3xl space-y-6 text-balance">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur">
            Project Synapse
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 drop-shadow-sm sm:text-5xl">
            Your second brain for every insight, everywhere you capture it.
          </h1>
          <p className="text-lg text-slate-600">
            Synapse weaves Supabase, Prisma, Qdrant, and LangChain into a
            personal intelligence layer. Clip ideas in seconds, let enrichment
            jobs add context, and recall anything with a natural prompt.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/capture"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition hover:translate-y-0.5 hover:bg-slate-800"
            >
              Capture a memory
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-slate-900/20 bg-white/80 px-5 py-2 text-sm font-medium text-slate-900 backdrop-blur transition hover:bg-white"
            >
              Search your knowledge
            </Link>
          </div>
        </div>

        {!session && (
          <Card className="max-w-xl border-white/50 bg-white/70">
            <CardHeader>
              <CardTitle>Sign in to unlock Synapse</CardTitle>
              <CardDescription>
                Create a free account to start capturing and indexing your
                research, notes, screenshots, and audio snippets.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Sign in or create account
              </Link>
            </CardFooter>
          </Card>
        )}
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
        {featureCards.map((card) => (
          <Card key={card.title} className="border-white/30 bg-white/80">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link
                href={card.action.href}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {card.action.label}
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>

      {session && (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-24">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Recent memories
              </h2>
              <p className="text-sm text-slate-500">
                A quick snapshot of the latest ideas you saved.
              </p>
            </div>
            <Link
              href="/captured"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          {memories.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/70 text-center">
              <CardHeader>
                <CardTitle className="text-lg">No memories yet</CardTitle>
                <CardDescription>
                  Capture your first highlight, link, or note to see it appear
                  here instantly.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Link
                  href="/capture"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Capture something
                </Link>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {memories.map((memory) => (
                <Card
                  key={memory.id}
                  className="border-slate-200 bg-white/90 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{memory.title}</CardTitle>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${typeColor(memory.contentType)}`}
                      >
                        {memory.contentType.toLowerCase()}
                      </span>
                    </div>
                    <CardDescription>
                      {memory.summary ??
                        memory.rawContent?.slice(0, 160) ??
                        "Captured memory"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {memory.sourceUrl && (
                      <a
                        href={memory.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Open source
                      </a>
                    )}
                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {memory.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-slate-400">
                    Captured {formatDate(memory.capturedAt)}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

