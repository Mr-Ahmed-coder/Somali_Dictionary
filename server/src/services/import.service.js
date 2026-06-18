import * as XLSX from "xlsx";
import slugify from "slugify";
import { Category } from "../models/category.model.js";
import { Word } from "../models/word.model.js";
import { ApiError } from "../utils/apiError.js";

const requiredColumns = ["english", "somali"];

const importColumns = [
  ...requiredColumns,
  "type",
  "definitionEnglish",
  "definitionSomali",
  "exampleEnglish",
  "exampleSomali",
  "category",
  "letter"
];

const headerAliases = {
  english: "english",
  en: "english",
  englishword: "english",
  somali: "somali",
  so: "somali",
  somaliword: "somali",
  type: "type",
  partofspeech: "type",
  definitionenglish: "definitionEnglish",
  englishdefinition: "definitionEnglish",
  definitionsomali: "definitionSomali",
  somalidefinition: "definitionSomali",
  exampleenglish: "exampleEnglish",
  englishexample: "exampleEnglish",
  examplesomali: "exampleSomali",
  somaliexample: "exampleSomali",
  category: "category",
  letter: "letter"
};

const supportedPartsOfSpeech = new Set([
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
]);

export async function previewWordImport(file) {
  if (!file) {
    throw new ApiError(400, "Import file is required");
  }

  const rawRows = parseImportFile(file);
  const preview = await validateImportRows(rawRows);

  console.info("Valid rows count:", preview.summary.validRows);
  console.info("Skipped rows count:", preview.summary.skippedRows);

  return preview;
}

export async function commitWordImport(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(400, "No import rows were provided");
  }

  console.info("Parsed rows count:", rows.length);
  console.info("First parsed row:", rows[0] || null);

  const preview = await validateImportRows(rows);
  const validRows = preview.rows.filter((row) => row.status === "valid");
  const validWords = validRows.map((row) => row.payload);

  console.info("Valid rows count:", validWords.length);
  console.info("Duplicate rows count:", preview.summary.duplicateRows);
  console.info("Import using MongoDB database:", Word.db.name);

  const insertedWords = validWords.length > 0 ? await Word.insertMany(validWords, { ordered: false }) : [];
  const insertedCount = insertedWords.length;
  const skippedCount = preview.summary.totalRows - insertedCount;

  console.info("Inserted rows count:", insertedCount);
  console.info("Skipped rows count:", skippedCount);

  if (insertedCount > 0) {
    const confirmedInsertedCount = await Word.countDocuments({
      _id: { $in: insertedWords.map((word) => word._id) }
    });
    console.info("Confirmed MongoDB inserted count:", confirmedInsertedCount);
  }

  const invalidRows = preview.rows.filter((row) => row.status === "invalid");

  return {
    success: true,
    parsedRows: preview.summary.totalRows,
    validRows: validWords.length,
    insertedCount,
    skippedCount,
    insertedWords,
    importedCount: insertedCount,
    duplicateCount: preview.summary.duplicateRows,
    invalidRows,
    words: insertedWords,
    summary: {
      ...preview.summary,
      importedRows: insertedCount,
      skippedRows: skippedCount
    }
  };
}

function parseImportFile(file) {
  const lowerName = file.originalname.toLowerCase();
  const isSupportedFile = lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx");

  if (!isSupportedFile) {
    throw new ApiError(400, "Unsupported import file type");
  }

  console.info("Uploaded import file:", file.originalname);

  const workbook = XLSX.read(file.buffer, {
    type: "buffer",
    raw: false
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new ApiError(400, "Import file does not contain a worksheet");
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false,
    blankrows: false
  });
  const parsedRows = rows.map(normalizeRawRow).filter((row) => Object.values(row).some(Boolean));

  console.info("Parsed rows count:", parsedRows.length);
  console.info("First parsed row:", parsedRows[0] || null);

  return parsedRows;
}

async function validateImportRows(rawRows) {
  const cleanedRows = rawRows.map(cleanRow);

  if (cleanedRows.length === 0) {
    return {
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        importedRows: 0,
        skippedRows: 0,
        duplicateRows: 0,
        invalidRows: 0
      }
    };
  }

  const categories = await Category.find({ isActive: true }).select("name slug");
  const categoryByKey = new Map();

  categories.forEach((category) => {
    categoryByKey.set(normalize(category.name), category);
    categoryByKey.set(normalize(category.slug), category);
    categoryByKey.set(slugify(category.name, { lower: true, strict: true }), category);
  });

  const normalizedPairs = cleanedRows.map((row) => ({
    english: normalize(row.english),
    somali: normalize(row.somali)
  }));
  const duplicateQueries = normalizedPairs
    .filter((pair) => pair.english && pair.somali)
    .map((pair) => ({
      normalizedEnglish: pair.english,
      normalizedSomali: pair.somali
    }));

  const existingWords =
    duplicateQueries.length > 0
      ? await Word.find({
          "sync.isDeleted": false,
          $or: duplicateQueries
        }).select("normalizedEnglish normalizedSomali")
      : [];
  const existingPairs = new Set(
    existingWords.map((word) => pairKey(word.normalizedEnglish, word.normalizedSomali))
  );
  const filePairs = new Set();

  const rows = cleanedRows.map((rawRow, index) => {
    const rowNumber = index + 2;
    const normalizedEnglish = normalize(rawRow.english);
    const normalizedSomali = normalize(rawRow.somali);
    const currentPairKey = pairKey(normalizedEnglish, normalizedSomali);
    const errors = [];

    requiredColumns.forEach((column) => {
      if (!rawRow[column]) errors.push(`${column} is required`);
    });

    if (normalizedEnglish && normalizedSomali && existingPairs.has(currentPairKey)) {
      errors.push("duplicate English/Somali pair already exists");
    }

    if (normalizedEnglish && normalizedSomali && filePairs.has(currentPairKey)) {
      errors.push("duplicate English/Somali pair in file");
    }

    if (normalizedEnglish && normalizedSomali) {
      filePairs.add(currentPairKey);
    }

    const hasDuplicateError = errors.some((error) => error.includes("duplicate"));
    const hasValidationError = errors.some((error) => !error.includes("duplicate"));
    const status = errors.length === 0 ? "valid" : hasDuplicateError && !hasValidationError ? "duplicate" : "invalid";
    const category = categoryByKey.get(normalize(rawRow.category));

    return {
      rowNumber,
      status,
      errors,
      raw: rawRow,
      payload:
        errors.length === 0
          ? {
              englishWord: rawRow.english,
              somaliWord: rawRow.somali,
              normalizedEnglish,
              normalizedSomali,
              partOfSpeech: normalizePartOfSpeech(rawRow.type),
              englishDefinition: rawRow.definitionEnglish,
              somaliDefinition: rawRow.definitionSomali,
              englishExample: rawRow.exampleEnglish,
              somaliExample: rawRow.exampleSomali,
              ...(category ? { category: category._id } : {}),
              letter: rawRow.letter || normalizedEnglish.charAt(0),
              searchKeywords: buildSearchKeywords(rawRow),
              status: "published",
              source: "import"
            }
          : null
    };
  });

  const invalidRows = rows.filter((row) => row.status === "invalid").length;
  const duplicateRows = rows.filter((row) => row.status === "duplicate").length;
  const validRows = rows.filter((row) => row.status === "valid").length;

  return {
    rows,
    summary: {
      totalRows: rows.length,
      validRows,
      importedRows: 0,
      skippedRows: invalidRows + duplicateRows,
      duplicateRows,
      invalidRows
    }
  };
}

function normalizeRawRow(row) {
  return Object.entries(row).reduce((result, [header, value]) => {
    const column = mapHeader(header);
    if (importColumns.includes(column)) {
      result[column] = stringify(value);
    }
    return result;
  }, defaultImportRow());
}

function mapHeader(header = "") {
  return headerAliases[normalizeHeader(header)] || header.toString().trim();
}

function cleanRow(row) {
  const cleaned = defaultImportRow();

  importColumns.forEach((column) => {
    cleaned[column] = stringify(row[column]);
  });

  cleaned.type = normalizePartOfSpeech(cleaned.type);
  cleaned.letter = cleaned.letter || normalize(cleaned.english).charAt(0);

  return cleaned;
}

function defaultImportRow() {
  return {
    english: "",
    somali: "",
    type: "other",
    definitionEnglish: "",
    definitionSomali: "",
    exampleEnglish: "",
    exampleSomali: "",
    category: "",
    letter: ""
  };
}

function normalizePartOfSpeech(value = "") {
  const partOfSpeech = normalize(value) || "other";
  return supportedPartsOfSpeech.has(partOfSpeech) ? partOfSpeech : "other";
}

function buildSearchKeywords(row) {
  return [
    row.english,
    row.somali,
    row.type,
    row.category,
    row.letter,
    row.definitionEnglish,
    row.definitionSomali
  ].filter(Boolean);
}

function stringify(value) {
  return value == null ? "" : value.toString().trim();
}

function normalizeHeader(value = "") {
  return value.toString().replace(/^\uFEFF/, "").trim().replace(/[\s_-]/g, "").toLowerCase();
}

function normalize(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pairKey(english, somali) {
  return `${english}::${somali}`;
}
