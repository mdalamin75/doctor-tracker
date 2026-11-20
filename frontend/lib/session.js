import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const COOKIE_NAME = process.env.COOKIE_NAME || "dt_token";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

/** Verifies a JWT locally (no network). Returns the payload or null. */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/** Current session for server components / route handlers. */
export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const payload = await verifyToken(token);
  return payload ? { token, user: { id: payload.sub, name: payload.name, role: payload.role } } : null;
}
