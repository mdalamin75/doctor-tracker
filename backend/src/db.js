import mongoose from "mongoose";
import { config } from "./config.js";

mongoose.set("strictQuery", true);

export async function connectDB(uri = config.mongoUri) {
  await mongoose.connect(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 10_000 });
  // Make sure every index declared on the schemas exists in the database.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  return mongoose.connection;
}

export const disconnectDB = () => mongoose.disconnect();
