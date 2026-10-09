import type { components } from "./schema";

export type FeedbackItem = components["schemas"]["FeedbackResponseDto"];

export type ClassificationOption =
  components["schemas"]["ClassificationOptionResponseDto"];

export type FeedbackClassification =
  components["schemas"]["FeedbackClassificationResponseDto"];

export type UpdateFeedbackClassification =
  components["schemas"]["UpdateFeedbackClassificationDto"];

export type ClassificationSuggestion = Pick<
  FeedbackClassification,
  "productAreaId" | "tagIds"
> & {
  feedbackVersion: number;
  model: string;
  promptVersion: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};

export type FeedbackPage = components["schemas"]["FeedbackPageResponseDto"];

export type AuditEvent = components["schemas"]["AuditEventResponseDto"];
