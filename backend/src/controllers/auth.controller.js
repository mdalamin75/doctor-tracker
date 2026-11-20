import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/http.js";

const cookieOptions = () => ({
  httpOnly: true,                 // not readable from JS → XSS can't steal the session
  secure: config.isProd,          // HTTPS only in production
  sameSite: "lax",                // not sent on cross-site POSTs → CSRF protection
  path: "/",
});

const sign = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, name: user.name }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtExpiresIn,
  });

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+password");
  // Same message for unknown email and wrong password → no account enumeration.
  if (!user || !(await user.comparePassword(password))) throw new HttpError(401, "Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();

  const token = sign(user);
  const { exp } = jwt.decode(token);
  res.cookie(config.cookieName, token, { ...cookieOptions(), expires: new Date(exp * 1000) });
  // The token is also returned for non-browser REST clients (Postman, curl, mobile).
  res.json({ user: user.toPublic(), token, expiresAt: new Date(exp * 1000).toISOString() });
}

// POST /api/auth/logout
export function logout(_req, res) {
  res.clearCookie(config.cookieName, cookieOptions());
  res.status(204).end();
}

// GET /api/auth/me
export const me = (req, res) => res.json({ user: req.user });
