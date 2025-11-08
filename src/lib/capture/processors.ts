import { load } from "cheerio";

import { type CapturePayload, type ProcessedCapture } from "@/lib/capture/types";

const DEFAULT_SUMMARY_LENGTH = 260;

const trim = (value?: string | null) =>
  value?.trim().replace(/\s+/g, " ") ?? "";

const summarize = (text: string, maxLength = DEFAULT_SUMMARY_LENGTH) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
};

const parseHtml = (html: string) => load(html);

type FetchResult = {
  html: string;
  attempted: boolean;
  success: boolean;
};

const safeFetchHtml = async (payload: CapturePayload): Promise<FetchResult> => {
  if (payload.html) {
    return {
      html: payload.html,
      attempted: Boolean(payload.html),
      success: true,
    };
  }

  if (!payload.url) {
    return { html: "", attempted: false, success: false };
  }

  try {
    const response = await fetch(payload.url, {
      headers: {
        "User-Agent":
          "SynapseBot/1.0 (https://synapse.local; contact: capture@synapse.local)",
      },
    });

    if (response.ok) {
      return {
        html: await response.text(),
        attempted: true,
        success: true,
      };
    }
  } catch (error) {
    console.error("[capture] failed to fetch url", error);
  }

  return { html: "", attempted: true, success: false };
};

const cleanTextFromHtml = ($: ReturnType<typeof load>) => {
  const article = $("article").text();
  if (article) {
    return trim(article);
  }

  const main = $("main").text();
  if (main) {
    return trim(main);
  }

  return trim($("body").text());
};

const extractMeta = ($: ReturnType<typeof load>, key: string) =>
  $('meta[property="' + key + '"]').attr("content") ??
  $('meta[name="' + key + '"]').attr("content");

const extractPriceFromText = (text: string) => {
  const match = text.match(
    /(?<currency>[$€£₹¥]|USD|EUR|GBP|INR|JPY|CAD|AUD)\s?(?<amount>\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)/i,
  );
  if (!match || !match.groups) return null;
  const amount = match.groups.amount.replace(/[^\d.,]/g, "");
  const currency = match.groups.currency.toUpperCase();
  return { amount, currency };
};

const asRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

type ProcessResult = {
  capture: ProcessedCapture;
  needsRetry: boolean;
};

export const processArticleCapture = async (
  payload: CapturePayload,
): Promise<ProcessResult> => {
  const fetchResult = await safeFetchHtml(payload);
  const metadata = asRecord(payload.metadata);
  const articleMeta = metadata
    ? asRecord(metadata.article ?? metadata.content)
    : null;

  const html = fetchResult.html || articleMeta?.html?.toString() || "";
  const $ = parseHtml(html);
  const title =
    trim(payload.title) ||
    trim(extractMeta($, "og:title")) ||
    trim($("title").text()) ||
    trim(articleMeta?.title?.toString() ?? "") ||
    "New article";
  const description =
    trim(articleMeta?.description?.toString() ?? "") ||
    trim(extractMeta($, "og:description")) ||
    trim(extractMeta($, "description")) ||
    trim(payload.selectedText ?? "");
  const text =
    trim(articleMeta?.text?.toString() ?? "") ||
    trim(payload.selectedText ?? "") ||
    cleanTextFromHtml($) ||
    description;

  const image =
    articleMeta?.image?.toString() ||
    extractMeta($, "og:image") ||
    extractMeta($, "twitter:image") ||
    $("img").first().attr("src") ||
    null;
  const publishedAt =
    articleMeta?.publishedAt?.toString() ||
    extractMeta($, "article:published_time") ||
    extractMeta($, "og:updated_time") ||
    null;

  const rawContent: Record<string, unknown> = {
    text,
    html: html || null,
    image,
    publishedAt,
    metadata: metadata ?? null,
  };

  const needsRetry = fetchResult.attempted && !fetchResult.success;

  if (needsRetry) {
    rawContent.processing = { pending: true, reason: "html_fetch_failed" };
  }

  return {
    capture: {
      title,
      summary: summarize(description || text),
      contentType: "ARTICLE",
      sourceUrl: payload.url ?? null,
      rawContent,
      tags: payload.tags,
    },
    needsRetry,
  };
};

export const processProductCapture = async (
  payload: CapturePayload,
): Promise<ProcessResult> => {
  const fetchResult = await safeFetchHtml(payload);
  const metadata = asRecord(payload.metadata);
  const productMeta = metadata
    ? asRecord(metadata.product ?? metadata)
    : null;
  const html = fetchResult.html;
  const $ = parseHtml(html);
  const title =
    trim(payload.title) ||
    trim(productMeta?.title?.toString() ?? "") ||
    trim(extractMeta($, "og:title")) ||
    trim($("title").text()) ||
    "Saved product";

  const textBlock =
    trim(productMeta?.description?.toString() ?? "") ||
    trim(payload.selectedText ?? "") ||
    trim($("main").text()) ||
    trim($("body").text());

  const priceFromMeta =
    productMeta?.price?.toString() ||
    extractMeta($, "product:price:amount") ||
    extractMeta($, "og:price:amount") ||
    null;
  const currencyFromMeta =
    productMeta?.currency?.toString() ||
    extractMeta($, "product:price:currency") ||
    extractMeta($, "og:price:currency") ||
    null;

  const priceRecord =
    productMeta && typeof productMeta.price === "object"
      ? (productMeta.price as Record<string, unknown>)
      : undefined;
  const price =
    (priceRecord &&
      typeof priceRecord.amount === "string" && {
        amount: priceRecord.amount,
        currency:
          typeof priceRecord.currency === "string"
            ? priceRecord.currency
            : currencyFromMeta ?? "USD",
        display:
          typeof priceRecord.display === "string"
            ? priceRecord.display
            : undefined,
      }) ||
    priceFromMeta && !Number.isNaN(Number(priceFromMeta))
      ? {
          amount: priceFromMeta,
          currency: currencyFromMeta ?? "USD",
        }
      : extractPriceFromText(textBlock) ??
        (payload.metadata &&
        "price" in payload.metadata &&
        typeof payload.metadata.price === "string"
          ? extractPriceFromText(payload.metadata.price)
          : null);

  const description =
    trim(extractMeta($, "og:description")) ||
    summarize(textBlock, DEFAULT_SUMMARY_LENGTH);

  const image =
    (typeof productMeta?.image === "string" ? productMeta.image : undefined) ||
    extractMeta($, "og:image") ||
    $("img").first().attr("src") ||
    null;

  const rawContent: Record<string, unknown> = {
    price,
    image,
    text: textBlock,
    availability:
      typeof productMeta?.availability === "string"
        ? productMeta.availability
        : undefined,
    rating:
      productMeta && typeof productMeta.rating === "object"
        ? productMeta.rating
        : undefined,
    metadata: metadata ?? null,
  };

  const needsRetry = fetchResult.attempted && !fetchResult.success;

  if (needsRetry) {
    rawContent.processing = { pending: true, reason: "product_fetch_failed" };
  }

  return {
    capture: {
      title,
      summary: description,
      contentType: "PRODUCT",
      sourceUrl: payload.url ?? null,
      rawContent,
      tags: payload.tags,
    },
    needsRetry,
  };
};

export const processTodoCapture = async (
  payload: CapturePayload,
): Promise<ProcessResult> => {
  const metadata = asRecord(payload.metadata);
  const todoMeta =
    metadata && typeof metadata.todo === "object"
      ? (metadata.todo as Record<string, unknown>)
      : null;
  const source =
    payload.selectedText ??
    (todoMeta?.content?.toString() ?? "") ??
    payload.html ??
    (payload.metadata && "content" in payload.metadata
      ? String(payload.metadata.content)
      : "") ??
    "";

  const items = source
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•\u2022\[\]]\s*/, "").trim())
    .filter(Boolean);

  const title =
    trim(payload.title) ||
    trim(
      (payload.metadata && String(payload.metadata?.title)) ?? "",
    ) ||
    (items.length ? `To-do (${items.length} items)` : "New to-do list");

  return {
    capture: {
      title,
      summary:
        items.length > 0
          ? `Captured ${items.length} to-do ${items.length === 1 ? "item" : "items"}.`
          : "Captured to-do list.",
      contentType: "TODO",
      sourceUrl: payload.url ?? null,
      rawContent: {
        items: items.map((label) => ({
          label,
          done: false,
        })),
        metadata: payload.metadata ?? null,
      },
      tags: payload.tags,
    },
    needsRetry: false,
  };
};

export const processLinkCapture = async (
  payload: CapturePayload,
): Promise<ProcessResult> => {
  const fetchResult = await safeFetchHtml(payload);
  const metadata = asRecord(payload.metadata);
  const linkMeta =
    metadata && typeof metadata.link === "object"
      ? (metadata.link as Record<string, unknown>)
      : null;
  const html = fetchResult.html || linkMeta?.html?.toString() || "";
  const $ = parseHtml(html);
  const title =
    trim(payload.title) ||
    trim(extractMeta($, "og:title")) ||
    trim($("title").text()) ||
    "Saved link";

  const description =
    trim(linkMeta?.description?.toString() ?? "") ||
    trim(payload.selectedText ?? "") ||
    trim(extractMeta($, "og:description")) ||
    trim(extractMeta($, "description")) ||
    "";

  const rawContent: Record<string, unknown> = {
    description,
    metadata: metadata ?? null,
  };

  const needsRetry = fetchResult.attempted && !fetchResult.success;

  if (needsRetry) {
    rawContent.processing = { pending: true, reason: "link_fetch_failed" };
  }

  return {
    capture: {
      title,
      summary: description || null,
      contentType: "LINK",
      sourceUrl: payload.url ?? null,
      rawContent,
      tags: payload.tags,
    },
    needsRetry,
  };
};
