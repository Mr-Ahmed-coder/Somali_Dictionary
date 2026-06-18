import mongoose from "mongoose";

const supportedPartOfSpeech = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
  "phrase",
  "other"
];

const aiTranslationSchema = new mongoose.Schema(
  {
    provider: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: null },
    confidence: { type: Number, min: 0, max: 1, default: null },
    reviewedByHuman: { type: Boolean, default: false },
    suggestedEnglish: { type: String, trim: true, default: "" },
    suggestedSomali: { type: String, trim: true, default: "" },
    generatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const voiceTranslationSchema = new mongoose.Schema(
  {
    englishAudioUrl: { type: String, trim: true, default: "" },
    somaliAudioUrl: { type: String, trim: true, default: "" },
    englishPhonetic: { type: String, trim: true, default: "" },
    somaliPhonetic: { type: String, trim: true, default: "" },
    voiceProvider: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const popularitySchema = new mongoose.Schema(
  {
    viewCount: { type: Number, min: 0, default: 0 },
    searchCount: { type: Number, min: 0, default: 0 },
    favoriteCount: { type: Number, min: 0, default: 0 },
    lastViewedAt: { type: Date, default: null },
    score: { type: Number, default: 0, index: true }
  },
  { _id: false }
);

const syncSchema = new mongoose.Schema(
  {
    version: { type: Number, min: 1, default: 1, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null },
    syncHash: { type: String, trim: true, default: "", index: true }
  },
  { _id: false }
);

const wordSchema = new mongoose.Schema(
  {
    englishWord: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    somaliWord: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    normalizedEnglish: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    normalizedSomali: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    partOfSpeech: {
      type: String,
      required: true,
      trim: true,
      enum: supportedPartOfSpeech,
      default: "other",
      index: true
    },
    englishDefinition: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000
    },
    somaliDefinition: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000
    },
    englishExample: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },
    somaliExample: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true
    },
    letter: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    searchKeywords: {
      type: [String],
      default: [],
      set: (keywords) => [...new Set((keywords || []).map((keyword) => keyword.trim().toLowerCase()).filter(Boolean))]
    },
    aiTranslation: {
      type: aiTranslationSchema,
      default: () => ({})
    },
    voiceTranslation: {
      type: voiceTranslationSchema,
      default: () => ({})
    },
    popularity: {
      type: popularitySchema,
      default: () => ({})
    },
    sync: {
      type: syncSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true
    },
    source: {
      type: String,
      enum: ["human", "import", "ai-assisted"],
      default: "human",
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

wordSchema.virtual("english").get(function getEnglishAlias() {
  return this.englishWord;
});

wordSchema.virtual("somali").get(function getSomaliAlias() {
  return this.somaliWord;
});

wordSchema.virtual("definitions").get(function getDefinitionsAlias() {
  return {
    english: [this.englishDefinition].filter(Boolean),
    somali: [this.somaliDefinition].filter(Boolean)
  };
});

wordSchema.virtual("examples").get(function getExamplesAlias() {
  if (!this.englishExample && !this.somaliExample) return [];
  return [{ english: this.englishExample, somali: this.somaliExample }];
});

wordSchema.virtual("categories").get(function getCategoriesAlias() {
  return this.category ? [this.category] : [];
});

wordSchema.pre("validate", function normalizeWord(next) {
  if (this.englishWord) this.normalizedEnglish = normalizeText(this.englishWord);
  if (this.somaliWord) this.normalizedSomali = normalizeText(this.somaliWord);
  if (!this.letter && this.normalizedEnglish) this.letter = this.normalizedEnglish.charAt(0);

  const keywordSource = [
    this.englishWord,
    this.somaliWord,
    this.partOfSpeech,
    ...(this.searchKeywords || [])
  ];

  this.searchKeywords = [...new Set(keywordSource.map(normalizeText).filter(Boolean))];
  next();
});

wordSchema.pre("save", function incrementSyncVersion(next) {
  if (!this.isNew && this.isModified()) {
    this.sync.version += 1;
  }
  next();
});

wordSchema.index({ normalizedEnglish: 1, status: 1, "sync.isDeleted": 1 });
wordSchema.index({ normalizedSomali: 1, status: 1, "sync.isDeleted": 1 });
wordSchema.index({ searchKeywords: 1, status: 1, "sync.isDeleted": 1 });
wordSchema.index({ partOfSpeech: 1, normalizedEnglish: 1, status: 1 });
wordSchema.index({ category: 1, partOfSpeech: 1, status: 1 });
wordSchema.index({ "popularity.score": -1, status: 1 });
wordSchema.index({ updatedAt: -1, "sync.version": 1 });
wordSchema.index({ normalizedEnglish: 1, normalizedSomali: 1, partOfSpeech: 1 }, { unique: true });
wordSchema.index(
  {
    englishWord: "text",
    somaliWord: "text",
    englishDefinition: "text",
    somaliDefinition: "text",
    searchKeywords: "text"
  },
  {
    name: "dictionary_text_search",
    weights: {
      englishWord: 10,
      somaliWord: 10,
      searchKeywords: 7,
      englishDefinition: 3,
      somaliDefinition: 3
    }
  }
);

function normalizeText(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const Word = mongoose.model("Word", wordSchema);
