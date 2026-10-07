"use server";

import { headers } from "next/headers";
import type { UpdateFeedbackClassification } from "../api/feedback";

const workspaceId = "11111111-1111-4111-8111-111111111111";

export async function createFeedback(
  content: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, message: "Feedback must not be empty." };
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > 5000) {
    return { ok: false, message: "Feedback must be 5000 characters or fewer." };
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
        body: JSON.stringify({ content: trimmedContent }),
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
              : "Couldn’t save feedback. Please try again.";

      return { ok: false, message };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn’t save feedback. Please try again." };
  }
}

export async function saveFeedbackClassification(
  feedbackId: string,
  selection: UpdateFeedbackClassification,
): Promise<{ ok: true } | { ok: false; message: string }> {
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
              : response.status === 400
                ? "Check the selected area and tags, then try again."
                : "Couldn’t save classification. Please try again.";

      return { ok: false, message };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Couldn’t save classification. Please try again.",
    };
  }
}
