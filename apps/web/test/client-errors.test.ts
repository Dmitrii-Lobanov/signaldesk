import { afterEach, beforeEach, expect, it, vi } from "vitest";

let POST: typeof import("../src/app/api/client-errors/route").POST;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-13T12:00:00Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  ({ POST } = await import("../src/app/api/client-errors/route"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function report(origin = "http://localhost:3300") {
  return new Request("http://localhost:3300/api/client-errors", {
    method: "POST",
    headers: {
      origin,
      host: "localhost:3300",
      cookie: "private-cookie",
    },
    body: "private-feedback",
  });
}

it("returns a reference matching a fixed, privacy-safe log", async () => {
  const response = await POST(report());
  const result = await response.json();

  expect(response.status).toBe(202);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(result.requestId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );

  expect(console.error).toHaveBeenCalledOnce();
  expect(JSON.parse(vi.mocked(console.error).mock.calls[0][0])).toEqual({
    event: "frontend_render_failed",
    requestId: result.requestId,
  });
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
    "private",
  );
});

it.each(["http://other.example", "invalid-origin"])(
  "rejects an unacceptable origin without logging",
  async (origin) => {
    expect((await POST(report(origin))).status).toBe(403);
    expect(console.error).not.toHaveBeenCalled();
  },
);

it("rejects a missing origin", async () => {
  const request = report();
  request.headers.delete("origin");

  expect((await POST(request)).status).toBe(403);
  expect(console.error).not.toHaveBeenCalled();
});

it("limits reports and allows them again after the window expires", async () => {
  for (let index = 0; index < 30; index += 1) {
    expect((await POST(report())).status).toBe(202);
  }

  vi.advanceTimersByTime(15000);
  const limited = await POST(report());

  expect(limited.status).toBe(429);
  expect(limited.headers.get("retry-after")).toBe("45");
  expect(console.error).toHaveBeenCalledTimes(30);

  vi.advanceTimersByTime(45000);
  expect((await POST(report())).status).toBe(202);
});
