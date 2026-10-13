import { randomUUID } from "node:crypto";

type AuthContext = {
  params: Promise<{ path: string[] }>;
};

async function forwardAuth(
  request: Request,
  context: AuthContext,
): Promise<Response> {
  const requestId = randomUUID();
  const { path } = await context.params;
  const apiBaseUrl = (
    process.env.API_BASE_URL ?? "http://localhost:3001"
  ).replace(/\/$/, "");
  const query = new URL(request.url).search;
  const url = `${apiBaseUrl}/api/auth/${path.map(encodeURIComponent).join("/")}${query}`;

  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const candidate = upstream.headers.get("x-request-id");
    const apiRequestId =
      candidate &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        candidate,
      )
        ? candidate
        : null;

    if (!upstream.ok) {
      console.warn(
        JSON.stringify({
          event: "auth_proxy_failed",
          requestId,
          apiRequestId,
          statusCode: upstream.status,
          failureKind: "http",
        }),
      );
    }

    const responseHeaders = new Headers({ "x-request-id": requestId });
    for (const name of [
      "content-type",
      "cache-control",
      "location",
      "retry-after",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    console.error(
      JSON.stringify({
        event: "auth_proxy_failed",
        requestId,
        apiRequestId: null,
        statusCode: 502,
        failureKind: "transport",
      }),
    );

    return Response.json(
      { message: "Authentication service is unavailable" },
      {
        status: 502,
        headers: { "x-request-id": requestId },
      },
    );
  }
}

export const GET = forwardAuth;
export const POST = forwardAuth;
