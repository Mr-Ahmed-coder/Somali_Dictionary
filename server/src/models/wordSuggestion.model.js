import mongoose from "mongoose";
import { cleanSuggestionText, normalizeSuggestionText } from "../utils/wordSuggestion.js";

const suggestionTypes = ["noun", "verb", "adjective", "adverb", "phrase", "other"];

const wordSuggestionSchema = new mongoose.Schema(
  {
    english: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    somali: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    normalizedEnglish: { type: String, required: true, trim: true },
    normalizedSomali: { type: String, required: true, trim: true },
    type: { type: String, enum: suggestionTypes, default: "other" },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    convertedToWord: { type: Boolean, default: false },
    convertedAt: { type: Date, default: null },
    convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word", default: null },
    missingSearchId: { type: mongoose.Schema.Types.ObjectId, ref: "MissingSearch", default: null }
  },
  { timestamps: true }
);

wordSuggestionSchema.pre("validate", function normalizeSuggestion(next) {
  this.english = cleanSuggestionText(this.english);
  this.somali = cleanSuggestionText(this.somali);
  this.note = cleanSuggestionText(this.note || "");
  this.normalizedEnglish = normalizeSuggestionText(this.english);
  this.normalizedSomali = normalizeSuggestionText(this.somali);
  next();
});

wordSuggestionSchema.index(
  { normalizedEnglish: 1, normalizedSomali: 1 },
  {
    name: "unique_pending_word_suggestion",
    unique: true,
    partialFilterExpression: { status: "pending" }
  }
);
wordSuggestionSchema.index({ status: 1, type: 1, submittedAt: -1 });
wordSuggestionSchema.index({ status: 1, convertedToWord: 1, submittedAt: -1 });
wordSuggestionSchema.index({ normalizedEnglish: 1 });
wordSuggestionSchema.index({ normalizedSomali: 1 });
wordSuggestionSchema.index(
  { wordId: 1 },
  {
    name: "unique_converted_suggestion_word",
    unique: true,
    partialFilterExpression: { wordId: { $type: "objectId" } }
  }
);

export const WordSuggestion = mongoose.model("WordSuggestion", wordSuggestionSchema);
