import express, { Router } from "express";
import { submitWordSuggestion } from "../controllers/wordSuggestion.controller.js";
import { wordSuggestionLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/",
  wordSuggestionLimiter,
  express.json({ limit: "12kb", strict: true }),
  asyncHandler(submitWordSuggestion)
);

export default router;
