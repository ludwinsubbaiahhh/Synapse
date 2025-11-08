import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processIncomingCapture } from "@/lib/capture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IncomingPayload = {
  url?: unknown;
  title?: unknown;
  html?: unknown;
  selectedText?: unknown;
  metadata?: unknown;
  tags?: unknown;
  kind?: unknown;
  capturedAt?: unknown;
  context?: unknown;
};

type NormalizedPayload = {
  url?: string;
  title?: string;
  html?: string;
  selectedText?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  kind?: "ARTICLE" | "PRODUCT" | "TODO" | "LINK" | "article" | "product" | "todo" | "link";
  capturedAt?: string;
  context?: {
    action?: "highlight" | "page" | "todo";
    source?: string;
    [key: string]: unknown;
  };
};

const toStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const normalizeMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
};

const normalizeTags = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : undefined;
};

const normalizeContext = (
  value: unknown,
): NormalizedPayload["context"] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const ctx = value as Record<string, unknown>;
  const action =
    typeof ctx.action === "string" && ["highlight", "page", "todo"].includes(ctx.action)
      ? (ctx.action as "highlight" | "page" | "todo")
      : undefined;
  const source = typeof ctx.source === "string" && ctx.source.trim().length > 0 ? ctx.source : undefined;

  if (!action && !source) {
    return Object.keys(ctx).length > 0 ? (ctx as NormalizedPayload["context"]) : undefined;
  }

  return {
    ...ctx,
    action,
    source,
  };
};

const normalizePayload = (
  body: IncomingPayload | null,
): { success: true; data: NormalizedPayload } | { success: false; error: string } => {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Payload must be an object" };
  }

  const normalized: NormalizedPayload = {
    url: toStringOrUndefined(body.url),
    title: toStringOrUndefined(body.title),
    html: toStringOrUndefined(body.html),
    selectedText: toStringOrUndefined(body.selectedText),
    metadata: normalizeMetadata(body.metadata),
    tags: normalizeTags(body.tags),
    kind:
      typeof body.kind === "string" &&
      ["ARTICLE", "PRODUCT", "TODO", "LINK", "article", "product", "todo", "link"].includes(body.kind)
        ? (body.kind as NormalizedPayload["kind"])
        : undefined,
    capturedAt: toStringOrUndefined(body.capturedAt),
    context: normalizeContext(body.context),
  };

  if (normalized.url && !/^https?:\/\//i.test(normalized.url)) {
    return { success: false, error: "url must be an http(s) URL" };
  }

  return { success: true, data: normalized };
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as IncomingPayload | null;
    const parsed = normalizePayload(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error },
        { status: 400 },
      );
    }

    const { data: userResponse } = await supabase.auth.getUser();
    const authUser = userResponse?.user;

    if (!authUser) {
      return NextResponse.json(
        { error: "Unable to load authenticated user" },
        { status: 401 },
      );
    }

    await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email ?? `${authUser.id}@synapse.local`,
        name:
          typeof authUser.user_metadata?.full_name === "string"
            ? authUser.user_metadata.full_name
            : null,
      },
      create: {
        id: authUser.id,
        email: authUser.email ?? `${authUser.id}@synapse.local`,
        name:
          typeof authUser.user_metadata?.full_name === "string"
            ? authUser.user_metadata.full_name
            : null,
      },
    });

    const { kind, processed, needsRetry } = await processIncomingCapture(parsed.data);

    const memory = await prisma.memory.create({
      data: {
        userId: authUser.id,
        title: processed.title,
        summary: processed.summary,
        contentType: kind,
        sourceUrl: processed.sourceUrl,
        rawContent: processed.rawContent,
        capturedAt: parsed.data.capturedAt
          ? new Date(parsed.data.capturedAt)
          : undefined,
        tags: {
          create: (processed.tags ?? []).map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { slug: tagName.toLowerCase() },
                create: { name: tagName, slug: tagName.toLowerCase() },
              },
            },
          })),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (needsRetry) {
      await prisma.captureJob.create({
        data: {
          userId: authUser.id,
          memoryId: memory.id,
          payload: parsed.data,
          status: "PENDING",
          attempts: 0,
          nextRun: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    }

    return NextResponse.json(
      {
        memory,
        tags: memory.tags.map((memoryTag) => memoryTag.tag),
        kind,
        processing: needsRetry,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/save] unexpected error", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}

