import { randomUUID } from "node:crypto";

let windowEndsAt = 0;
let reports = 0;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    if (!origin || new URL(origin).host !== request.headers.get("host")) {
      return new Response(null, { status: 403 });
    }
  } catch {
    return new Response(null, { status: 403 });
  }

  const now = Date.now();
  if (now >= windowEndsAt) {
    windowEndsAt = now + 60000;
    reports = 0;
  }

  if (reports >= 30) {
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((windowEndsAt - now) / 1000)),
      },
    });
  }

  reports += 1;
  const requestId = randomUUID();

  // Do not read or log the request body, cookies, URL, or exception details.
  console.error(
    JSON.stringify({
      event: "frontend_render_failed",
      requestId,
    }),
  );

  return Response.json(
    { requestId },
    {
      status: 202,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
