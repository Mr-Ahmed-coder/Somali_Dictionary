import mongoose from "mongoose";
import { MissingSearch } from "../models/missingSearch.model.js";
import { Word } from "../models/word.model.js";
import { WordSuggestion } from "../models/wordSuggestion.model.js";
import { ApiError } from "../utils/apiError.js";
import { createWord } from "./word.service.js";
import {
  escapeSuggestionRegExp,
  normalizeSuggestionText
} from "../utils/wordSuggestion.js";

export async function createWordSuggestion(payload) {
  const normalizedEnglish = normalizeSuggestionText(payload.english);
  const normalizedSomali = normalizeSuggestionText(payload.somali);
  const pair = { normalizedEnglish, normalizedSomali };

  const existingWord = await Word.exists({
    ...pair,
    "sync.isDeleted": { $ne: true }
  });

  if (existingWord) {
    throw new ApiError(409, "This English and Somali translation already exists in the dictionary.");
  }

  try {
    await WordSuggestion.create({
      english: payload.english,
      somali: payload.somali,
      normalizedEnglish,
      normalizedSomali,
      type: payload.type,
      note: payload.note,
      status: "pending",
      submittedAt: new Date()
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "This suggestion has already been submitted for review.");
    }
    throw error;
  }
}

export async function listWordSuggestions({ page, limit, q, status, type, sort }) {
  const filter = {};
  if (status !== "all") filter.status = status;
  if (type !== "all") filter.type = type;

  if (q) {
    const normalized = normalizeSuggestionText(q);
    const prefix = new RegExp(`^${escapeSuggestionRegExp(normalized)}`);
    filter.$or = [{ normalizedEnglish: prefix }, { normalizedSomali: prefix }];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sort === "oldest" ? 1 : -1;
  const [suggestions, totalRecords] = await Promise.all([
    WordSuggestion.find(filter)
      .sort({ submittedAt: sortDirection, _id: sortDirection })
      .skip(skip)
      .limit(limit)
      .select(
        "english somali type note status submittedAt reviewedAt reviewedBy convertedToWord convertedAt convertedBy wordId createdAt updatedAt"
      )
      .lean(),
    WordSuggestion.countDocuments(filter)
  ]);

  return {
    suggestions,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    totalRecords,
    limit
  };
}

export async function getWordSuggestionById(id) {
  const suggestion = await WordSuggestion.findById(id)
    .select(
      "english somali type note status submittedAt reviewedAt reviewedBy convertedToWord convertedAt convertedBy wordId missingSearchId createdAt updatedAt"
    )
    .populate("reviewedBy", "name email")
    .populate("convertedBy", "name email")
    .populate("wordId", "englishWord somaliWord partOfSpeech category")
    .lean();

  if (!suggestion) throw new ApiError(404, "Suggestion not found");
  return suggestion;
}

export async function moderateWordSuggestion({ id, status, adminId }) {
  const suggestion = await WordSuggestion.findOneAndUpdate(
    { _id: id, status: "pending" },
    {
      $set: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    },
    { new: true, runValidators: true }
  )
    .select("english somali type note status submittedAt reviewedAt reviewedBy createdAt updatedAt")
    .lean();

  if (suggestion) return suggestion;

  const existing = await WordSuggestion.findById(id).select("status").lean();
  if (!existing) throw new ApiError(404, "Suggestion not found");
  throw new ApiError(409, `Suggestion has already been ${existing.status}.`);
}

export async function convertApprovedSuggestion({ id, wordPayload, adminId }) {
  const session = await mongoose.startSession();
  let conversion;

  try {
    await session.withTransaction(async () => {
      const suggestion = await WordSuggestion.findById(id)
        .select("status convertedToWord wordId missingSearchId")
        .session(session)
        .lean();

      if (!suggestion) throw new ApiError(404, "Suggestion not found");
      if (suggestion.status !== "approved") {
        throw new ApiError(409, "Only approved suggestions can be added to the dictionary.");
      }
      if (suggestion.convertedToWord || suggestion.wordId) {
        throw new ApiError(409, "Suggestion has already been added to the dictionary.");
      }

      const word = await createWord(wordPayload, { session });
      const now = new Date();
      const convertedSuggestion = await WordSuggestion.findOneAndUpdate(
        {
          _id: id,
          status: "approved",
          convertedToWord: { $ne: true },
          wordId: null
        },
        {
          $set: {
            convertedToWord: true,
            convertedAt: now,
            convertedBy: adminId,
            wordId: word._id
          }
        },
        { new: true, runValidators: true, session }
      ).lean();

      if (!convertedSuggestion) {
        throw new ApiError(409, "Suggestion has already been added to the dictionary.");
      }

      conversion = {
        word,
        suggestion: convertedSuggestion,
        missingSearchId: suggestion.missingSearchId || null
      };
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "This English and Somali word pair already exists in the dictionary.");
    }
    throw error;
  } finally {
    await session.endSession();
  }

  conversion.word.$session(null);
  await conversion.word.populate("category", "name slug");
  const analytics = await resolveLinkedMissingSearch(conversion.missingSearchId, id);

  return {
    word: conversion.word,
    suggestion: conversion.suggestion,
    ...analytics
  };
}

async function resolveLinkedMissingSearch(missingSearchId, suggestionId) {
  if (!missingSearchId) {
    return { missingSearchResolved: false, analyticsWarning: null };
  }

  try {
    const record = await MissingSearch.findByIdAndUpdate(
      missingSearchId,
      { $set: { resolved: true, resolvedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();

    if (!record) throw new Error("Linked missing search was not found");
    return { missingSearchResolved: true, analyticsWarning: null };
  } catch (error) {
    console.error("Suggestion conversion analytics cleanup failed", {
      suggestionId: String(suggestionId),
      missingSearchId: String(missingSearchId),
      error: error.message
    });
    return {
      missingSearchResolved: false,
      analyticsWarning: "The word was created, but its linked missing-search record could not be resolved."
    };
  }
}
