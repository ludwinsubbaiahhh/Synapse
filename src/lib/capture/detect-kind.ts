import { CaptureKind, CapturePayload } from "@/lib/capture/types";

const TODO_PATTERNS = [
  /^\s*[-*•\u2022\[\]]\s+/m,
  /\b(todo|task|checklist|action item)s?\b/i,
];

const PRICE_PATTERN =
  /(?:\$|€|£|₹|¥)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s?(?:USD|EUR|GBP|INR|JPY|CAD|AUD)/i;

const ARTICLE_HINTS = [
  /\b(read time|table of contents|published)\b/i,
  /\bchapter\b/i,
  /\bperplexity|medium\.com|substack\.com|blog\b/i,
];

export const normalizeKind = (kind?: CapturePayload["kind"]) => {
  if (!kind) return undefined;
  const upper = kind.toString().toUpperCase() as CaptureKind;
  if (["ARTICLE", "PRODUCT", "TODO", "LINK"].includes(upper)) {
    return upper;
  }
  return undefined;
};

export const detectCaptureKind = (
  payload: CapturePayload,
): CaptureKind => {
  const normalized = normalizeKind(payload.kind);
  if (normalized) {
    return normalized;
  }

  const haystack = [
    payload.selectedText ?? "",
    payload.html ?? "",
    payload.title ?? "",
  ].join("\n");

  if (
    TODO_PATTERNS.some((pattern) => pattern.test(haystack)) ||
    (payload.metadata &&
      "type" in payload.metadata &&
      String(payload.metadata.type).toLowerCase().includes("todo"))
  ) {
    return "TODO";
  }

  if (
    PRICE_PATTERN.test(haystack) ||
    (payload.metadata &&
      ("price" in payload.metadata || "currency" in payload.metadata)) ||
    (payload.url &&
      /\b(amazon|bestbuy|flipkart|ebay|shopify)\b/i.test(payload.url))
  ) {
    return "PRODUCT";
  }

  if (
    ARTICLE_HINTS.some((pattern) => pattern.test(haystack)) ||
    (payload.url &&
      /\b(perplexity\.ai|medium\.com|substack|blog|news)\b/i.test(
        payload.url,
      ))
  ) {
    return "ARTICLE";
  }

  if (
    (payload.metadata &&
      "contentType" in payload.metadata &&
      String(payload.metadata.contentType)
        .toLowerCase()
        .includes("article")) ||
    (payload.selectedText && payload.selectedText.split(/\s+/).length > 120)
  ) {
    return "ARTICLE";
  }

  return "LINK";
};

