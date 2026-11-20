import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/http.js";

function readToken(req) {
  const header = req.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[config.cookieName];
}

/** Verifies the JWT (cookie or Bearer header) and loads the user. */
export async function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, "Authentication required"));
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    return next(new HttpError(401, "Session expired, please sign in again"));
  }
  // A lean lookup on _id keeps revoked/deleted users out without much cost.
  const user = await User.findById(payload.sub, { name: 1, email: 1, role: 1 }).lean();
  if (!user) return next(new HttpError(401, "Account no longer exists"));
  req.user = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  next();
}

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, "You do not have access to this resource"));
