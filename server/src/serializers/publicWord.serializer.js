function toPlainObject(value) {
  if (!value) return null;
  return typeof value.toObject === "function"
    ? value.toObject({ getters: false, virtuals: false })
    : value;
}

function stringifyId(value) {
  if (value === undefined || value === null) return undefined;
  return String(value);
}

export function toPublicCategorySummary(category) {
  const source = toPlainObject(category);
  if (!source) return null;

  const id = stringifyId(source._id || source.id);
  return compactObject({
    _id: id,
    id,
    name: source.name,
    slug: source.slug
  });
}

export function toPublicCategoryDto(category, overrides = {}) {
  const source = toPlainObject(category) || {};
  const id = stringifyId(source._id || source.id);

  return compactObject({
    _id: id,
    id,
    name: source.name,
    slug: source.slug,
    description: source.description || "",
    wordCount: overrides.wordCount ?? source.wordCount ?? 0,
    virtual: source.virtual === true || undefined
  });
}

export function toPublicWordDto(word) {
  const source = toPlainObject(word) || {};
  const id = stringifyId(source._id || source.id);
  const category = toPublicCategorySummary(source.category);
  const englishDefinition = source.englishDefinition || "";
  const somaliDefinition = source.somaliDefinition || "";
  const englishExample = source.englishExample || "";
  const somaliExample = source.somaliExample || "";

  return compactObject({
    _id: id,
    id,
    englishWord: source.englishWord,
    somaliWord: source.somaliWord,
    english: source.englishWord,
    somali: source.somaliWord,
    partOfSpeech: source.partOfSpeech,
    englishDefinition,
    somaliDefinition,
    englishExample,
    somaliExample,
    definitions: {
      english: englishDefinition ? [englishDefinition] : [],
      somali: somaliDefinition ? [somaliDefinition] : []
    },
    examples:
      englishExample || somaliExample
        ? [{ english: englishExample, somali: somaliExample }]
        : [],
    category,
    categories: category ? [category] : [],
    letter: source.letter || "",
    status: source.status,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  });
}

export function toPublicWordDtos(words = []) {
  return words.map(toPublicWordDto);
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
