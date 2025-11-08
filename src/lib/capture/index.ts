import { detectCaptureKind } from "@/lib/capture/detect-kind";
import {
  processArticleCapture,
  processLinkCapture,
  processProductCapture,
  processTodoCapture,
} from "@/lib/capture/processors";
import {
  type CaptureKind,
  type CapturePayload,
  type ProcessedCapture,
} from "@/lib/capture/types";

type ProcessorResult = Promise<{
  capture: ProcessedCapture;
  needsRetry: boolean;
}>;

const processors: Record<
  CaptureKind,
  (payload: CapturePayload) => ProcessorResult
> = {
  ARTICLE: processArticleCapture,
  PRODUCT: processProductCapture,
  TODO: processTodoCapture,
  LINK: processLinkCapture,
};

export const processIncomingCapture = async (payload: CapturePayload) => {
  const explicitKind = payload.kind
    ? (payload.kind.toString().toUpperCase() as CaptureKind)
    : undefined;
  const kind = explicitKind ?? detectCaptureKind(payload);
  const processor = processors[kind];
  const { capture, needsRetry } = await processor(payload);

  return {
    kind,
    processed: capture,
    needsRetry,
  };
};

