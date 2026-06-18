import { Router } from "express";
import { getCategories, getCategory } from "../controllers/category.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getCategories));
router.get("/:slug", asyncHandler(getCategory));

export default router;
