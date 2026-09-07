import {
  toPublicCategoryDto,
  toPublicWordDto
} from "./publicWord.serializer.js";

export function toV1EntryDto(word) {
  const publicWord = toPublicWordDto(word);
  const definitions = compactObject({
    english: publicWord.englishDefinition || undefined,
    somali: publicWord.somaliDefinition || undefined
  });
  const examples = (publicWord.examples || [])
    .map((example) =>
      compactObject({
        english: example.english || undefined,
        somali: example.somali || undefined
      })
    )
    .filter((example) => Object.keys(example).length > 0);

  return compactObject({
    id: publicWord.id,
    languages: {
      english: publicWord.englishWord,
      somali: publicWord.somaliWord
    },
    partOfSpeech: publicWord.partOfSpeech,
    category: publicWord.category
      ? compactObject({
          id: publicWord.category.id,
          name: publicWord.category.name,
          slug: publicWord.category.slug
        })
      : undefined,
    definitions: Object.keys(definitions).length > 0 ? definitions : undefined,
    examples: examples.length > 0 ? examples : undefined,
    createdAt: publicWord.createdAt,
    updatedAt: publicWord.updatedAt
  });
}

export function toV1EntryDtos(words = []) {
  return words.map(toV1EntryDto);
}

export function toV1CategoryDto(category, { wordCount } = {}) {
  const publicCategory = toPublicCategoryDto(category, { wordCount });

  return compactObject({
    id: publicCategory.id,
    name: publicCategory.name,
    slug: publicCategory.slug,
    description: publicCategory.description || undefined,
    wordCount: publicCategory.wordCount
  });
}

export function toV1Pagination(pagination) {
  const page = Number(pagination.page);
  const limit = Number(pagination.limit);
  const total = Number(pagination.total);
  const totalPages = Number(pagination.pages ?? pagination.totalPages ?? 0);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0
  };
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
