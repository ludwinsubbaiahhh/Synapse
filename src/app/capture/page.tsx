"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useSupabase } from "@/components/providers/supabase-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const memoryTypes = [
  { value: "ARTICLE", label: "Article or blog" },
  { value: "PRODUCT", label: "Product or shopping find" },
  { value: "VIDEO", label: "Video or clip" },
  { value: "IMAGE", label: "Image or inspiration" },
  { value: "NOTE", label: "Note or idea" },
  { value: "TODO", label: "Task list" },
  { value: "DOCUMENT", label: "Document or PDF" },
  { value: "LINK", label: "General link" },
] as const;

type FormState = {
  title: string;
  summary: string;
  sourceUrl: string;
  rawContent: string;
  contentType: (typeof memoryTypes)[number]["value"];
  tags: string;
};

const defaultState: FormState = {
  title: "",
  summary: "",
  sourceUrl: "",
  rawContent: "",
  contentType: "LINK",
  tags: "",
};

export default function CapturePage() {
  const router = useRouter();
  const { session } = useSupabase();
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-4 px-6 py-24 text-center">
        <Card className="border border-slate-200 bg-white/90">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Sign in required
            </CardTitle>
            <CardDescription>
              You need to sign in to capture memories.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <a
              href="/login"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Go to login
            </a>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: formState.title,
      summary: formState.summary || null,
      sourceUrl: formState.sourceUrl || null,
      rawContent: formState.rawContent || null,
      contentType: formState.contentType,
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const response = await fetch("/api/memories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to save memory");
      setSaving(false);
      return;
    }

    setFormState(defaultState);
    setSaving(false);
    setSuccess("Memory captured! Redirecting to dashboard...");
    setTimeout(() => router.push("/"), 1200);
  };

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(79,70,229,0.15),_transparent_60%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <div className="max-w-xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white backdrop-blur">
            Capture
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Save a memory with structure and context.
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Drop in links, highlights, product finds, or handwritten notes.
            Synapse stores it as rich data, ready for enrichment and search.
          </p>
        </div>

        <Card className="border-white/40 bg-white/90">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Memory details</CardTitle>
              <CardDescription>
                The more context you add now, the smarter the enrichment and
                recall will be later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    required
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Design systems for AI products"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="sourceUrl">
                    Source URL
                  </label>
                  <input
                    id="sourceUrl"
                    type="url"
                    placeholder="https://"
                    value={formState.sourceUrl}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        sourceUrl: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </section>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="summary">
                  Summary
                </label>
                <textarea
                  id="summary"
                  rows={3}
                  placeholder="Why this matters, key takeaways, or action steps."
                  value={formState.summary}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      summary: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="rawContent">
                  Raw content
                </label>
                <textarea
                  id="rawContent"
                  rows={6}
                  placeholder="Paste raw text, transcript snippets, or any context you'd like to enrich later."
                  value={formState.rawContent}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      rawContent: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="contentType">
                    Memory type
                  </label>
                  <select
                    id="contentType"
                    value={formState.contentType}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        contentType: event.target.value as FormState["contentType"],
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {memoryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="tags">
                    Tags
                  </label>
                  <input
                    id="tags"
                    placeholder="ai, design systems, research"
                    value={formState.tags}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        tags: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas. We&apos;ll clean them up and
                    handle duplicates automatically.
                  </p>
                </div>
              </section>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 py-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90",
                  saving && "opacity-60",
                )}
              >
                {saving ? "Saving..." : "Capture memory"}
              </button>

              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              {success && (
                <p className="text-sm text-muted-foreground">{success}</p>
              )}
            </CardFooter>
          </form>
        </Card>
      </section>
    </main>
  );
}

