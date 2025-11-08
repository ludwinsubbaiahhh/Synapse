import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createMemorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().nullable().optional(),
  contentType: z.string().default("LINK"),
  sourceUrl: z.string().url().nullable().optional(),
  rawContent: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const json = await request.json();
  const parsed = createMemorySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tags = [], ...input } = parsed.data;

  const memory = await prisma.memory.create({
    data: {
      userId: session.user.id,
      ...input,
      tags: {
        create: tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { slug: tagName.toLowerCase() },
              create: {
                name: tagName,
                slug: tagName.toLowerCase(),
              },
            },
          },
        })),
      },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      memory,
      tags: memory.tags.map((memoryTag) => memoryTag.tag),
    },
    { status: 201 },
  );
}

