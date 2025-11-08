import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { processIncomingCapture } from "@/lib/capture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const captureSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().optional(),
  html: z.string().optional(),
  selectedText: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  kind: z
    .enum(["ARTICLE", "PRODUCT", "TODO", "LINK", "article", "product", "todo", "link"])
    .optional(),
  capturedAt: z.string().datetime().optional(),
  context: z
    .object({
      action: z.enum(["highlight", "page", "todo"]).optional(),
      source: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = captureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
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

  const { kind, processed, needsRetry } = await processIncomingCapture(
    parsed.data,
  );

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
}

