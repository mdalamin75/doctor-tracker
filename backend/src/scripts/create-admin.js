// Creates (or resets the password of) the admin account from ADMIN_* env vars.
// Usage: npm run create-admin
import { connectDB, disconnectDB } from "../db.js";
import { User } from "../models/User.js";

export async function upsertAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  let user = await User.findOne({ email });
  if (!user) user = new User({ email, name: process.env.ADMIN_NAME || "Admin", role: "admin" });
  user.password = password;
  user.role = "admin";
  await user.save();
  return user;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await connectDB();
  const user = await upsertAdmin();
  console.log(`✓ Admin ready: ${user.email}`);
  await disconnectDB();
}
