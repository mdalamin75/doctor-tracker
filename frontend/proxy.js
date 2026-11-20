// Next.js 16 "proxy" (formerly middleware): runs before every page render.
// It verifies the session JWT locally (no DB/API round trip) and redirects
// anonymous users to /login, and signed-in users away from /login.
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = process.env.COOKIE_NAME || "dt_token";
const PUBLIC_PATHS = ["/login"];

async function isValid(token) {
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const authed = await isValid(request.cookies.get(COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!authed && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    res.cookies.delete(COOKIE); // drop expired/tampered cookies
    return res;
  }
  if (authed && isPublic) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = {
  // Everything except the API proxy, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|svg|webp)$).*)"],
};
