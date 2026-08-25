import mongoose from "mongoose";

const missingSearchSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, trim: true, maxlength: 120 },
    normalizedQuery: { type: String, required: true, trim: true },
    count: { type: Number, min: 1, default: 1 },
    firstSearchedAt: { type: Date, required: true, default: Date.now },
    lastSearchedAt: { type: Date, required: true, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

missingSearchSchema.index({ normalizedQuery: 1 }, { unique: true });
missingSearchSchema.index({ resolved: 1 });
missingSearchSchema.index({ count: -1 });
missingSearchSchema.index({ lastSearchedAt: -1 });

export const MissingSearch = mongoose.model("MissingSearch", missingSearchSchema);
