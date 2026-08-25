import { Router } from "express";
import { trackMissingSearch } from "../controllers/missingSearch.controller.js";
import { trackPopularSearch } from "../controllers/popularSearch.controller.js";
import { missingSearchLimiter, popularSearchLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/missing-search", missingSearchLimiter, asyncHandler(trackMissingSearch));
router.post("/popular-search", popularSearchLimiter, asyncHandler(trackPopularSearch));

export default router;
