import mongoose from "mongoose";

const wordStatSchema = new mongoose.Schema(
  {
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ["view", "search", "favorite", "voice-play", "ai-suggestion"],
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ["english-to-somali", "somali-to-english", "auto"],
      default: "auto",
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    anonymousClientId: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

wordStatSchema.index({ word: 1, eventType: 1, occurredAt: -1 });
wordStatSchema.index({ eventType: 1, occurredAt: -1 });

export const WordStat = mongoose.model("WordStat", wordStatSchema);
