import "dotenv/config";

const required = ["MONGODB_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

export const config = Object.freeze({
  env: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  cookieName: process.env.COOKIE_NAME || "dt_token",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim()),
  timezone: process.env.APP_TIMEZONE || "UTC",
});
