import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true
    },
    offlineClientId: {
      type: String,
      trim: true,
      default: ""
    },
    sync: {
      version: { type: Number, min: 1, default: 1 },
      isDeleted: { type: Boolean, default: false, index: true },
      lastSyncedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, word: 1 }, { unique: true });
favoriteSchema.index({ user: 1, updatedAt: -1 });

export const Favorite = mongoose.model("Favorite", favoriteSchema);
