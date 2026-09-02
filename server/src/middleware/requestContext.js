import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{8,100}$/;

export function requestContext(req, res, next) {
  const incomingRequestId = req.header("x-request-id") || "";
  const requestId = REQUEST_ID_PATTERN.test(incomingRequestId) ? incomingRequestId : randomUUID();
  const startedAt = process.hrtime.bigint();

  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const context = {
      requestId,
      method: req.method,
      path: getRequestPath(req),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1))
    };

    if (res.statusCode >= 500) {
      logger.error("http.request.completed", context);
    } else if (res.statusCode >= 400) {
      logger.warn("http.request.completed", context);
    } else {
      logger.info("http.request.completed", context);
    }
  });

  next();
}

function getRequestPath(req) {
  return (req.originalUrl || req.path || "/").split("?")[0];
}
