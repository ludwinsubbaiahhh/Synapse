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
      "Highlight text on any page and tap “Save to Synapse”. The extension captures title, URL, and context in one click.",
    action: {
      label: "Get the extension",
      href: "https://github.com/ludwinsubbaiahhh/Synapse/tree/master/extension",
    },
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

const formatPrice = (amount?: string, currency?: string) => {
  if (!amount) return null;
  const normalized = amount.replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) {
    return currency ? `${currency} ${amount}` : amount;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency && currency.length <= 3 ? currency : "USD",
    }).format(value);
  } catch {
    return currency ? `${currency} ${amount}` : amount;
  }
};

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
            Your second brain for every insight—automatically captured.
          </h1>
          <p className="text-lg text-slate-600">
            Synapse works with the browser extension so highlights, research,
            and product finds flow directly into your memory graph. No manual
            entry—just search and explore what you already saved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://github.com/ludwinsubbaiahhh/Synapse/tree/master/extension"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition hover:translate-y-0.5 hover:bg-slate-800"
            >
              Install browser extension
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
                Create a free account, install the extension, and every
                highlight will flow into your personal knowledge base.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Sign in or create account
              </Link>
              <Link
                href="https://github.com/ludwinsubbaiahhh/Synapse/tree/master/extension"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                View extension setup
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
                Highlights and captures from the extension appear here in
                seconds.
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
                  Highlight something with the extension to see it appear here
                  instantly.
                </CardDescription>
              </CardHeader>
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
                    {(() => {
                      const rawRecord =
                        (memory.rawContent &&
                          typeof memory.rawContent === "object" &&
                          !Array.isArray(memory.rawContent)
                          ? (memory.rawContent as Record<string, unknown>)
                          : null) ?? null;
                      const processing =
                        rawRecord &&
                        typeof rawRecord.processing === "object" &&
                        rawRecord.processing !== null &&
                        (rawRecord.processing as Record<string, unknown>).pending ===
                          true;
                      const rawText =
                        rawRecord && typeof rawRecord.text === "string"
                          ? rawRecord.text
                          : undefined;
                      const rawDescription =
                        rawRecord && typeof rawRecord.description === "string"
                          ? rawRecord.description
                          : undefined;
                      return (
                        <>
                          <CardDescription>
                            {processing
                              ? "Processing rich content…"
                              : memory.summary ??
                                (typeof memory.rawContent === "string"
                                  ? (memory.rawContent as string).slice(0, 160)
                                  : rawText
                                    ? rawText.slice(0, 160)
                                    : rawDescription
                                      ? rawDescription.slice(0, 160)
                                      : "Captured memory")}
                          </CardDescription>
                          {processing && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                              Processing
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const raw =
                        memory.rawContent &&
                        typeof memory.rawContent === "object" &&
                        !Array.isArray(memory.rawContent)
                          ? (memory.rawContent as Record<string, unknown>)
                          : null;
                      if (memory.contentType === "PRODUCT") {
                        const metadata =
                          raw &&
                          typeof raw.metadata === "object" &&
                          raw.metadata !== null
                            ? (raw.metadata as Record<string, unknown>)
                            : null;
                        const productMeta =
                          metadata &&
                          typeof metadata.product === "object" &&
                          metadata.product !== null
                            ? (metadata.product as Record<string, unknown>)
                            : null;
                        const priceObj =
                          raw &&
                          typeof raw.price === "object" &&
                          raw.price !== null
                            ? (raw.price as Record<string, unknown>)
                            : productMeta &&
                                typeof productMeta.price === "object" &&
                                productMeta.price !== null
                              ? (productMeta.price as Record<string, unknown>)
                              : null;
                        const priceDisplay =
                          priceObj &&
                          typeof priceObj.display === "string"
                            ? priceObj.display
                            : null;
                        const price = priceObj?.display
                          ? priceObj.display
                          : formatPrice(
                              priceObj &&
                                typeof priceObj.amount === "string"
                                ? priceObj.amount
                                : undefined,
                              priceObj &&
                                typeof priceObj.currency === "string"
                                ? priceObj.currency
                                : undefined,
                            );
                        const availability =
                          raw && typeof raw.availability === "string"
                            ? raw.availability
                            : productMeta &&
                                typeof productMeta.availability === "string"
                              ? productMeta.availability
                              : undefined;
                        const rating =
                          raw && typeof raw.rating === "object" && raw.rating
                            ? (raw.rating as Record<string, unknown>)
                            : productMeta &&
                                typeof productMeta.rating === "object" &&
                                productMeta.rating
                              ? (productMeta.rating as Record<string, unknown>)
                              : null;
                        const ratingDisplay =
                          rating && typeof rating.display === "string"
                            ? rating.display
                            : undefined;
                        return (
                          <div className="space-y-3 text-sm text-slate-600">
                            {price && (
                              <div className="text-base font-semibold text-slate-900">
                                {priceDisplay ?? price}
                              </div>
                            )}
                            {availability && (
                              <div className="flex items-center gap-2 text-emerald-600">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                {availability}
                              </div>
                            )}
                            {ratingDisplay && (
                              <div className="text-xs text-slate-500">
                                {ratingDisplay}
                              </div>
                            )}
                            {memory.sourceUrl && (
                              <a
                                href={memory.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                              >
                                View product
                              </a>
                            )}
                          </div>
                        );
                      }

                      if (memory.contentType === "TODO") {
                        const items = Array.isArray(raw?.items)
                          ? (raw.items as Array<Record<string, unknown>>)
                          : [];
                        return (
                          <ul className="space-y-2 text-sm text-slate-600">
                            {items.slice(0, 5).map((item, index) => {
                              const label =
                                typeof item.label === "string" ? item.label : "";
                              const done = item.done === true;
                              return (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-slate-300">
                                    {done ? "✓" : ""}
                                  </span>
                                  <span>{label}</span>
                                </li>
                              );
                            })}
                            {items.length > 5 && (
                              <li className="text-xs text-slate-400">
                                +{items.length - 5} more
                              </li>
                            )}
                          </ul>
                        );
                      }

                      if (memory.contentType === "ARTICLE") {
                        const metadata =
                          raw &&
                          typeof raw.metadata === "object" &&
                          raw.metadata !== null
                            ? (raw.metadata as Record<string, unknown>)
                            : null;
                        const articleMeta =
                          metadata &&
                          typeof metadata.article === "object" &&
                          metadata.article !== null
                            ? (metadata.article as Record<string, unknown>)
                            : null;
                        const image =
                          (typeof raw?.image === "string" ? raw.image : undefined) ??
                          (articleMeta &&
                          typeof articleMeta.image === "string"
                            ? articleMeta.image
                            : undefined) ??
                          (typeof metadata?.image === "string"
                            ? (metadata.image as string)
                            : undefined);
                        return (
                          <div className="space-y-3 text-sm text-slate-600">
                            {image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={image}
                                alt=""
                                className="h-32 w-full rounded-lg object-cover"
                              />
                            )}
                            {memory.sourceUrl && (
                              <a
                                href={memory.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                              >
                                Open article
                              </a>
                            )}
                          </div>
                        );
                      }

                      return (
                        <>
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
                        </>
                      );
                    })()}

                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-3">
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

