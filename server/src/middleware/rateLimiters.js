import rateLimit from "express-rate-limit";

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, _next, options) {
    return res.status(options.statusCode).json({
      ...options.message,
      requestId: req.id
    });
  }
};

export const loginLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: "Too many login attempts. Please try again later."
  }
});

export const missingSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    message: "Too many missing-search submissions. Please try again later."
  }
});

export const popularSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: {
    message: "Too many search analytics submissions. Please try again later."
  }
});

export const wordSuggestionLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: {
    message: "Too many word suggestions. Please try again later."
  }
});

export const searchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 5 * 60 * 1000,
  limit: 120,
  message: {
    message: "Too many searches. Please wait a moment and try again."
  }
});

export const searchSuggestionsLimiter = rateLimit({
  ...commonOptions,
  windowMs: 5 * 60 * 1000,
  limit: 300,
  message: {
    message: "Too many suggestion requests. Please wait a moment and try again."
  }
});
