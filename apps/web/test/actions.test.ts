import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createFeedback,
  editFeedback,
  saveFeedbackClassification,
} from "../src/app/actions";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "test-session-only" }),
}));

const requestId = "11111111-1111-4111-8111-111111111111";
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

function rateLimited(retryAfter?: string, reference = requestId) {
  const headers = new Headers({ "x-request-id": reference });
  if (retryAfter !== undefined) headers.set("retry-after", retryAfter);

  fetchMock.mockResolvedValue(new Response(null, { status: 429, headers }));
}

it("explains a rate-limited creation and sends the supplied retry key", async () => {
  rateLimited("45");

  const result = await createFeedback("Synthetic feedback", requestId);

  expect(result).toEqual({
    ok: false,
    message:
      "Too many requests. Your input is still here. Wait 45 seconds, then try again.",
  });

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    content: "Synthetic feedback",
    requestKey: requestId,
  });
});

it("preserves the API reference on a rate-limited edit", async () => {
  rateLimited("12");

  const result = await editFeedback(requestId, "Synthetic edit", 1);

  expect(result).toEqual({
    ok: false,
    kind: "error",
    requestId,
    message:
      "Too many requests. Your input is still here. Wait 12 seconds, then try again.",
  });
});

it("explains a rate-limited classification save", async () => {
  rateLimited("30");

  const result = await saveFeedbackClassification(requestId, {
    productAreaId: null,
    tagIds: [],
    expectedVersion: 1,
  });

  expect(result).toEqual({
    ok: false,
    message:
      "Too many requests. Your input is still here. Wait 30 seconds, then try again.",
  });
});

it.each([undefined, "0", "61", "-1", "private-header"])(
  "uses a safe fallback for Retry-After %s",
  async (value) => {
    rateLimited(value);

    const result = await createFeedback("Synthetic feedback", requestId);

    expect(result).toEqual({
      ok: false,
      message:
        "Too many requests. Your input is still here. Wait 60 seconds, then try again.",
    });
  },
);

it("excludes an invalid request reference from the result and log", async () => {
  rateLimited("10", "private-header");

  const result = await editFeedback(requestId, "Synthetic edit", 1);

  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain("private-header");
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
    "private-header",
  );
});
