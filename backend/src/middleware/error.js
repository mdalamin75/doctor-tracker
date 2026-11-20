import { ZodError } from "zod";
import mongoose from "mongoose";
import { HttpError } from "../utils/http.js";
import { config } from "../config.js";

export const notFound = (req, _res, next) => next(new HttpError(404, `Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = "Something went wrong";
  let details;

  if (err instanceof HttpError) {
    ({ status, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    details = Object.fromEntries(err.issues.map((i) => [i.path.join(".") || "_", i.message]));
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with this ${field} already exists`;
    details = { [field]: message };
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: { message, ...(details && { details }), ...(status >= 500 && !config.isProd && { stack: err.stack }) } });
}
