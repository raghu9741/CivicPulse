export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid identifier" });
  if (error.code === 11000) return res.status(409).json({ message: "A record with that value already exists" });
  const statusCode = error.statusCode ?? error.status ?? 500;
  if (statusCode >= 500) console.error(error);
  const message = statusCode >= 500
    ? "An unexpected server error occurred"
    : error.type === "entity.parse.failed"
      ? "Request body contains invalid JSON"
      : error.message;
  res.status(statusCode).json({ message });
}
