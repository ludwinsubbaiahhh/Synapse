import Link from "next/link";
import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams?: {
    q?: string;
  };
};

export const metadata: Metadata = {
  title: "Search Memories · Synapse",
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Sign in to search your memories
        </h1>
        <p className="text-sm text-slate-600">
          You need to be logged in to view and search your saved highlights.
        </p>
        <Link
          href="/login"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Go to login
        </Link>
      </main>
    );
  }

  const query = searchParams?.q?.trim() ?? "";

  const memories = await prisma.memory.findMany({
    where: {
      userId: session.user.id,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { capturedAt: "desc" },
    take: 20,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Search</h1>
        <p className="text-sm text-slate-600">
          Find captured snippets and pages across your knowledge base.
        </p>
        <form className="mt-4 flex gap-3" action="/search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by title or summary…"
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <p className="mb-4 text-sm text-slate-500">
          Showing results for <span className="font-medium">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      {memories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center text-sm text-slate-500">
          {query
            ? "No memories match your search yet."
            : "You have not captured any memories yet. Save highlights with the extension to see them here."}
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map((memory) => (
            <Card key={memory.id} className="border-slate-200 bg-white/90">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    {memory.title || "Untitled capture"}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Captured {formatDate(memory.capturedAt ?? memory.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium uppercase tracking-wide">
                    {memory.contentType.toLowerCase()}
                  </span>
                  {memory.sourceUrl && (
                    <a
                      href={memory.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Open source
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {memory.summary ? (
                  <p>{memory.summary}</p>
                ) : (
                  <p className="italic text-slate-400">
                    No summary available for this capture.
                  </p>
                )}

                {memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

