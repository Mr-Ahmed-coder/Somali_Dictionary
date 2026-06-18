import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const allowedMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

export const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const lowerName = file.originalname.toLowerCase();
    const validExtension = lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx");

    if (!validExtension && !allowedMimeTypes.has(file.mimetype)) {
      return callback(new ApiError(400, "Only CSV and XLSX files are supported"));
    }

    return callback(null, true);
  }
});
