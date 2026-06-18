import { Router } from "express";
import {
  createWord,
  deleteWord,
  getWord,
  getWords,
  getWordsByCategory,
  putWord,
  search,
  suggestions,
  updateWord
} from "../controllers/word.controller.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/search", asyncHandler(search));
router.get("/suggestions", asyncHandler(suggestions));
router.get("/category/:category", asyncHandler(getWordsByCategory));
router.get("/", asyncHandler(getWords));
router.post("/", requireAdmin, asyncHandler(createWord));
router.get("/:id", validateObjectId("id"), asyncHandler(getWord));
router.put("/:id", requireAdmin, validateObjectId("id"), asyncHandler(putWord));
router.patch("/:id", requireAdmin, validateObjectId("id"), asyncHandler(updateWord));
router.delete("/:id", requireAdmin, validateObjectId("id"), asyncHandler(deleteWord));

export default router;
