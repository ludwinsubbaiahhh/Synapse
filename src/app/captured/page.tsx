import Link from "next/link";
import type { Metadata } from "next";

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

export const metadata: Metadata = {
  title: "Your Memories · Synapse",
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(value);

export default async function CapturedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Sign in to view your memories
        </h1>
        <p className="text-sm text-slate-600">
          Install the browser extension, capture highlights, and they will show
          up here once you are logged in.
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

  const memories = await prisma.memory.findMany({
    where: { userId: session.user.id },
    orderBy: { capturedAt: "desc" },
    include: {
      tags: {
        include: { tag: true },
      },
    },
    take: 50,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Your memories
          </h1>
          <p className="text-sm text-slate-600">
            Latest items captured via the Synapse extension and API.
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Search memories
        </Link>
      </div>

      {memories.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-white/80 text-center">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">No memories yet</CardTitle>
            <CardDescription>
              Capture highlights or save pages with the extension to see them
              here.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-3 pb-8">
            <Link
              href="https://github.com/ludwinsubbaiahhh/Synapse/tree/master/extension"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get the extension
            </Link>
            <Link
              href="/"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to home
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {memories.map((memory) => (
            <Card
              key={memory.id}
              className="flex h-full flex-col border-slate-200 bg-white/90"
            >
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg text-slate-900">
                    {memory.title || "Untitled capture"}
                  </CardTitle>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                    {memory.contentType.toLowerCase()}
                  </span>
                </div>
                <CardDescription>
                  Captured {formatDate(memory.capturedAt ?? memory.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {memory.summary ? (
                  <p>{memory.summary}</p>
                ) : (
                  <p className="italic text-slate-400">
                    No summary was generated for this memory.
                  </p>
                )}

                {memory.sourceUrl && (
                  <a
                    href={memory.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View source
                  </a>
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

