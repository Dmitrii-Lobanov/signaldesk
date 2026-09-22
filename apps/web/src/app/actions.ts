"use server";

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

  try {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
    const response = await fetch(`${apiBaseUrl}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmedContent }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        ok: false,
        message:
          response.status === 400
            ? "Please check your feedback and try again."
            : "Couldn’t save feedback. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn’t save feedback. Please try again." };
  }
}