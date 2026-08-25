import { Router } from "express";
import { getStats, login, logout, me } from "../controllers/admin.controller.js";
import { commitImport, previewImport } from "../controllers/import.controller.js";
import {
  createCategory,
  deleteCategory,
  updateCategory
} from "../controllers/category.controller.js";
import { createWord, deleteWord, putWord, updateWord } from "../controllers/word.controller.js";
import {
  getMissingSearches,
  reopenMissingSearch,
  resolveMissingSearch
} from "../controllers/missingSearch.controller.js";
import { getPopularSearches } from "../controllers/popularSearch.controller.js";
import {
  createWordFromSuggestion,
  getAdminWordSuggestion,
  getAdminWordSuggestions,
  updateAdminWordSuggestionStatus
} from "../controllers/wordSuggestionAdmin.controller.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { importUpload } from "../middleware/fileUpload.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", loginLimiter, asyncHandler(login));

router.use(requireAdmin);

router.post("/logout", asyncHandler(logout));
router.get("/me", asyncHandler(me));
router.get("/stats", asyncHandler(getStats));
router.get("/missing-searches", asyncHandler(getMissingSearches));
router.get("/popular-searches", asyncHandler(getPopularSearches));
router.patch("/missing-searches/:id/resolve", validateObjectId("id"), asyncHandler(resolveMissingSearch));
router.patch("/missing-searches/:id/reopen", validateObjectId("id"), asyncHandler(reopenMissingSearch));
router.get("/suggestions", asyncHandler(getAdminWordSuggestions));
router.get("/suggestions/:id", validateObjectId("id"), asyncHandler(getAdminWordSuggestion));
router.patch(
  "/suggestions/:id/status",
  validateObjectId("id"),
  asyncHandler(updateAdminWordSuggestionStatus)
);
router.post(
  "/suggestions/:id/create-word",
  validateObjectId("id"),
  asyncHandler(createWordFromSuggestion)
);

router.post("/imports/preview", importUpload.single("file"), asyncHandler(previewImport));
router.post("/imports/commit", asyncHandler(commitImport));

router.post("/words", asyncHandler(createWord));
router.put("/words/:id", validateObjectId("id"), asyncHandler(putWord));
router.patch("/words/:id", validateObjectId("id"), asyncHandler(updateWord));
router.delete("/words/:id", validateObjectId("id"), asyncHandler(deleteWord));

router.post("/categories", asyncHandler(createCategory));
router.patch("/categories/:id", validateObjectId("id"), asyncHandler(updateCategory));
router.delete("/categories/:id", validateObjectId("id"), asyncHandler(deleteCategory));

export default router;
