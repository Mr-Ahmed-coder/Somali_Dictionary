import { Router } from "express";
import {
  getCategoryV1,
  getEntryV1,
  listCategoriesV1,
  listEntriesV1,
  listTermEntriesV1,
  searchV1
} from "../controllers/v1.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/search", asyncHandler(searchV1));
router.get("/entries", asyncHandler(listEntriesV1));
router.get("/entries/:id", asyncHandler(getEntryV1));
router.get("/terms/:term/entries", asyncHandler(listTermEntriesV1));
router.get("/categories", asyncHandler(listCategoriesV1));
router.get("/categories/:slug", asyncHandler(getCategoryV1));

export default router;
