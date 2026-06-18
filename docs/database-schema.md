# MongoDB Schema Architecture

## Collections

### `words`

Primary dictionary entry collection. Each document stores one English to Somali lexical mapping.

Required fields:

- `englishWord`
- `somaliWord`
- `partOfSpeech`
- `englishDefinition`
- `somaliDefinition`
- `englishExample`
- `somaliExample`
- `category`
- `searchKeywords`
- `createdAt`
- `updatedAt`

Future-ready fields:

- `aiTranslation`: provider/model/confidence/review state for AI-assisted translation.
- `voiceTranslation`: audio URLs and phonetic values for voice translation and pronunciation.
- `popularity`: embedded counters for ranking common terms without joining event data.
- `sync`: version, tombstone, sync hash, and last sync timestamp for offline clients.

Indexes:

- `{ normalizedEnglish: 1, status: 1, "sync.isDeleted": 1 }`
- `{ normalizedSomali: 1, status: 1, "sync.isDeleted": 1 }`
- `{ category: 1, partOfSpeech: 1, status: 1 }`
- `{ "popularity.score": -1, status: 1 }`
- `{ updatedAt: -1, "sync.version": 1 }`
- Unique `{ normalizedEnglish: 1, normalizedSomali: 1, partOfSpeech: 1 }`
- Weighted text index on words, definitions, and keywords

### `categories`

Vocabulary grouping collection. Words reference a single category for fast filtered listing.

Indexes:

- Unique `name`
- Unique `slug`

### `favorites`

User favorite words. Kept separate from `words` so favorite data scales by user without bloating public dictionary documents.

Indexes:

- Unique `{ user: 1, word: 1 }`
- `{ user: 1, updatedAt: -1 }`

### `wordstats`

Append-friendly event collection for analytics such as views, searches, favorites, voice plays, and AI suggestions.

Indexes:

- `{ word: 1, eventType: 1, occurredAt: -1 }`
- `{ eventType: 1, occurredAt: -1 }`

## Search Strategy

The API uses normalized prefix indexes for fast dictionary-style lookup:

- English to Somali: `normalizedEnglish`
- Somali to English: `normalizedSomali`
- Auto search: normalized English, normalized Somali, and `searchKeywords`

The weighted text index is available for richer full-text search and future Atlas Search migration.

## Offline Sync Strategy

Offline clients should request words changed since their last sync using:

- `updatedAt`
- `sync.version`
- `sync.isDeleted`

Deletes should be soft-deleted by setting `sync.isDeleted = true` and `sync.deletedAt`, then hard-deleted only after all supported clients have passed the retention window.
