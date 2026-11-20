/**
 * Validates req.body / req.query / req.params with zod schemas.
 * Parsed (coerced, defaulted, trimmed) values land on `req.valid.<part>`.
 * Express 5 makes req.query a read-only getter, so we never overwrite it.
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid ??= {};
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) return next(result.error);
    req.valid[part] = result.data;
  }
  next();
};
