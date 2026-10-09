"use server";

import { headers } from "next/headers";
import type {
  ClassificationSuggestion,
  UpdateFeedbackClassification,
} from "../api/feedback";

const workspaceId = "11111111-1111-4111-8111-111111111111";

export async function createFeedback(
  content: string,
  requestKey: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, message: "Feedback must not be empty." };
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > 5000) {
    return { ok: false, message: "Feedback must be 5000 characters or fewer." };
  }

  if (
    typeof requestKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestKey,
    )
  ) {
    return { ok: false, message: "Invalid submission. Please try again." };
  }

  const cookie = (await headers()).get("cookie") ?? "";
  if (!cookie) {
    return {
      ok: false,
      message: "Your session expired. Please sign in again.",
    };
  }

  try {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
    const response = await fetch(
      `${apiBaseUrl}/workspaces/${workspaceId}/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ content: trimmedContent, requestKey }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      const message =
        response.status === 401
          ? "Your session expired. Please sign in again."
          : response.status === 403
            ? "You cannot add feedback in this workspace."
            : response.status === 400
              ? "Please check your feedback and try again."
              : response.status === 409
                ? "This submission key was used for different feedback. Start a new submission."
                : "Couldn’t confirm whether feedback was saved. Try again.";

      return { ok: false, message };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Couldn’t confirm whether feedback was saved. Try again.",
    };
  }
}

export async function editFeedback(
  feedbackId: string,
  content: string,
  expectedVersion: number,
): Promise<
  | { ok: true; version: number }
  | { ok: false; kind: "conflict" | "error"; message: string }
> {
  if (
    typeof content !== "string" ||
    !content.trim() ||
    content.trim().length > 5000 ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    return {
      ok: false,
      kind: "error",
      message: "Enter feedback of 1–5000 characters and try again.",
    };
  }

  const cookie = (await headers()).get("cookie") ?? "";
  if (!cookie) {
    return {
      ok: false,
      kind: "error",
      message: "Your session expired. Please sign in again.",
    };
  }

  try {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
    const response = await fetch(
      `${apiBaseUrl}/workspaces/${workspaceId}/feedback/${encodeURIComponent(feedbackId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          content: content.trim(),
          expectedVersion,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (response.status === 409) {
      return {
        ok: false,
        kind: "conflict",
        message:
          "Someone changed this feedback after you opened it. Your text is still here. Copy it, then reload to review the latest version.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        kind: "error",
        message:
          response.status === 401
            ? "Your session expired. Please sign in again."
            : response.status === 403
              ? "You cannot edit feedback in this workspace."
              : response.status === 404
                ? "This feedback item is unavailable."
                : response.status === 400
                  ? "Check the feedback text and try again."
                  : "Couldn’t save the edit. Your text is still here; try again.",
      };
    }

    const saved = (await response.json()) as { version: number };
    return { ok: true, version: saved.version };
  } catch {
    return {
      ok: false,
      kind: "error",
      message: "Couldn’t confirm the edit. Your text is still here; try again.",
    };
  }
}

export async function saveFeedbackClassification(
  feedbackId: string,
  selection: UpdateFeedbackClassification,
): Promise<{ ok: true; version: number } | { ok: false; message: string }> {
  const cookie = (await headers()).get("cookie") ?? "";

  if (!cookie) {
    return {
      ok: false,
      message: "Your session expired. Please sign in again.",
    };
  }

  try {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";

    const response = await fetch(
      `${apiBaseUrl}/workspaces/${workspaceId}/feedback/${encodeURIComponent(feedbackId)}/classification`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(selection),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      const message =
        response.status === 401
          ? "Your session expired. Please sign in again."
          : response.status === 403
            ? "You cannot classify feedback in this workspace."
            : response.status === 404
              ? "This feedback or one of its classification choices is unavailable."
              : response.status === 409
                ? "Someone changed this feedback after you opened it. Your choices are still here. Review the latest version before saving."
                : response.status === 400
                  ? "Check the selected area and tags, then try again."
                  : "Couldn’t save classification. Your choices are still here; try again.";

      return { ok: false, message };
    }

    const saved = (await response.json()) as { version: number };
    return { ok: true, version: saved.version };
  } catch {
    return {
      ok: false,
      message:
        "Couldn’t confirm the classification. Your choices are still here; try again.",
    };
  }
}

export async function requestClassificationSuggestion(
  feedbackId: string,
): Promise<
  | { ok: true; suggestion: ClassificationSuggestion }
  | { ok: false; message: string }
> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      feedbackId,
    )
  ) {
    return { ok: false, message: "Invalid feedback item." };
  }

  const cookie = (await headers()).get("cookie") ?? "";
  if (!cookie) {
    return {
      ok: false,
      message: "Your session expired. Please sign in again.",
    };
  }

  try {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
    const response = await fetch(
      `${apiBaseUrl}/workspaces/${workspaceId}/feedback/${feedbackId}/classification-suggestion`,
      {
        method: "POST",
        headers: { Cookie: cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        message:
          response.status === 401
            ? "Your session expired. Please sign in again."
            : response.status === 403
              ? "You cannot request suggestions in this workspace."
              : response.status === 404
                ? "This feedback item is unavailable."
                : response.status === 429
                  ? "Suggestion limit reached. Classify manually or try later."
                  : "Suggestions are unavailable. You can classify manually.",
      };
    }

    const suggestion = (await response.json()) as ClassificationSuggestion;
    return { ok: true, suggestion };
  } catch {
    return {
      ok: false,
      message: "Suggestions are unavailable. You can classify manually.",
    };
  }
}
