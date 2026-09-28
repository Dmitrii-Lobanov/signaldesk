type AuthContext = {
  params: Promise<{ path: string[] }>;
};

async function forwardAuth(
  request: Request,
  context: AuthContext,
): Promise<Response> {
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
    });

    const responseHeaders = new Headers();
    for (const name of ["content-type", "cache-control", "location"]) {
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
    return Response.json(
      { message: "Authentication service is unavailable" },
      { status: 502 },
    );
  }
}

export const GET = forwardAuth;
export const POST = forwardAuth;
