import type { Prisma } from "@/generated/prisma/client";

export type CaptureKind = "ARTICLE" | "PRODUCT" | "TODO" | "LINK";

export type CapturePayload = {
  url?: string | null;
  title?: string | null;
  html?: string | null;
  selectedText?: string | null;
  metadata?: Record<string, unknown> | null;
  tags?: string[];
  kind?: CaptureKind | Lowercase<CaptureKind> | null;
  context?: Record<string, unknown> | null;
};

export type ProcessedCapture = {
  title: string;
  summary?: string | null;
  contentType: CaptureKind;
  sourceUrl?: string | null;
  rawContent: Prisma.JsonValue;
  tags?: string[];
};

