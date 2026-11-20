import { config } from "./config.js";
import { connectDB, disconnectDB } from "./db.js";
import { createApp } from "./app.js";

async function start() {
  await connectDB();
  console.log("✓ MongoDB connected, indexes in sync");

  const server = createApp().listen(config.port, () => console.log(`✓ API listening on http://localhost:${config.port}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
