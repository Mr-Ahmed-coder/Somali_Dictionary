const SENSITIVE_KEY = /(authorization|cookie|password|secret|token|mongodb_uri|connection[_-]?string|^uri$|api[_-]?key)/i;

export const logger = {
  info(event, context = {}) {
    write("info", event, context);
  },
  warn(event, context = {}) {
    write("warn", event, context);
  },
  error(event, context = {}) {
    write("error", event, context);
  }
};

export function serializeError(error) {
  if (!(error instanceof Error)) {
    return { message: sanitizeString(String(error)) };
  }

  return {
    name: error.name,
    message: sanitizeString(error.message),
    code: error.code,
    syscall: error.syscall,
    ...(error.stack ? { stack: sanitizeString(error.stack, 4000) } : {})
  };
}

function write(level, event, context) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeContext(context)
  };

  const output = JSON.stringify(payload);
  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  writer(output);
}

function sanitizeContext(context) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[redacted]" : sanitizeValue(value)
    ])
  );
}

function sanitizeValue(value) {
  if (value instanceof Error) return serializeError(value);
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeContext(value);
  return value;
}

function sanitizeString(value, maxLength = 1000) {
  return value
    .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[redacted-mongodb-uri]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .slice(0, maxLength);
}
