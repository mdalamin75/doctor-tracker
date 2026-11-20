// Forwards every /api/* request from the browser to the Express API.
//
// Why a route handler instead of a `rewrites()` entry in next.config.mjs:
// - Next's built-in rewrite proxy can fail with "socket hang up" / ECONNRESET
//   on some setups (notably Windows + newer Node), with no useful message.
// - Here we use plain fetch, read API_URL at runtime (no rebuild needed when it
//   changes), and return a clear JSON error the login screen can display.
//
// The browser still only talks to this origin, so the httpOnly session cookie
// stays first-party and no CORS setup is needed.

const API_URL = (process.env.API_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");
const TIMEOUT_MS = 20_000;

// Hop-by-hop headers must not be forwarded; content-length is recomputed.
const SKIP_REQUEST = new Set(["host", "connection", "keep-alive", "content-length", "transfer-encoding", "upgrade", "expect"]);
const SKIP_RESPONSE = new Set(["connection", "keep-alive", "transfer-encoding", "content-encoding", "content-length", "set-cookie"]);

export const dynamic = "force-dynamic";

async function forward(request, { params }) {
  const { path = [] } = await params;
  const target = `${API_URL}/api/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err?.cause?.code || err?.name || err?.message;
    console.error(`[api proxy] ${request.method} ${target} failed: ${reason}`);
    const message =
      err?.name === "TimeoutError"
        ? `The API at ${API_URL} took too long to respond.`
        : `Can't reach the API at ${API_URL}. Is the backend running, and does API_URL in frontend/.env.local match its port?`;
    return Response.json({ error: { message, code: reason } }, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  // Pass the session cookie(s) through unchanged.
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);

  const body = upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
