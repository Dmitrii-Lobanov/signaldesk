import assert from 'node:assert/strict';
import test from 'node:test';
import { GET, POST } from '../src/app/api/auth/[...path]/route.ts';

test('sign-in proxy forwards the request and returns session cookies', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.API_BASE_URL;
  process.env.API_BASE_URL = 'http://api.test:3001';

  try {
    let forwarded;

    globalThis.fetch = async (url, options) => {
      forwarded = { url, options };

      const headers = new Headers({
        'content-type': 'application/json',
      });
      headers.append('set-cookie', 'session=one; HttpOnly; Path=/');
      headers.append('set-cookie', 'other=two; Path=/');

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers,
      });
    };

    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          email: 'editor@example.invalid',
          password: 'test-password',
        }),
      }),
      { params: Promise.resolve({ path: ['sign-in', 'email'] }) },
    );

    assert.equal(response.status, 200);
    assert.equal(
      forwarded.url,
      'http://api.test:3001/api/auth/sign-in/email',
    );
    assert.equal(
      forwarded.options.headers.get('origin'),
      'http://localhost:3000',
    );
    assert.deepEqual(
      JSON.parse(new TextDecoder().decode(forwarded.options.body)),
      {
        email: 'editor@example.invalid',
        password: 'test-password',
      },
    );
    assert.equal(response.headers.getSetCookie().length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiBaseUrl === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalApiBaseUrl;
    }
  }
});

test('session proxy forwards the cookie and preserves an unauthorized response', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.API_BASE_URL;
  process.env.API_BASE_URL = 'http://api.test:3001';

  try {
    let forwarded;

    globalThis.fetch = async (url, options) => {
      forwarded = { url, options };
      return Response.json(
        { code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    };

    const response = await GET(
      new Request('http://localhost:3000/api/auth/get-session', {
        headers: {
          cookie: 'session=old',
        },
      }),
      { params: Promise.resolve({ path: ['get-session'] }) },
    );

    assert.equal(
      forwarded.url,
      'http://api.test:3001/api/auth/get-session',
    );
    assert.equal(forwarded.options.headers.get('cookie'), 'session=old');
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { code: 'UNAUTHORIZED' });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiBaseUrl === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalApiBaseUrl;
    }
  }
});