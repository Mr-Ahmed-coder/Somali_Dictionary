import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/dictionary-test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.JWT_SECRET = "test-jwt-secret-that-is-longer-than-thirty-two-characters";
process.env.SEO_INDEX_TOKEN = "test-seo-index-token-that-is-longer-than-thirty-two-characters";
process.env.RATE_LIMIT_MAX = "10000";

const [{ createApp }, { Word }, { Category }, { Admin }, { MissingSearch }, { WordSuggestion }, jwtModule] =
  await Promise.all([
    import("../src/app.js"),
    import("../src/models/word.model.js"),
    import("../src/models/category.model.js"),
    import("../src/models/admin.model.js"),
    import("../src/models/missingSearch.model.js"),
    import("../src/models/wordSuggestion.model.js"),
    import("jsonwebtoken")
  ]);

const jwt = jwtModule.default;
const categoryId = "bbbbbbbbbbbbbbbbbbbbbbbb";
const adminId = "aaaaaaaaaaaaaaaaaaaaaaaa";
const fixtures = [
  wordFixture("111111111111111111111111", "published term", "erey la daabacay", "published", false),
  wordFixture("666666666666666666666666", "public second", "labaad", "published", false),
  wordFixture("777777777777777777777777", "public third", "saddexaad", "published", false),
  wordFixture("222222222222222222222222", "draft term", "erey qabyo", "draft", false),
  wordFixture("333333333333333333333333", "archived term", "erey kaydsan", "archived", false),
  wordFixture("444444444444444444444444", "deleted term", "erey tirtiran", "published", true)
];

let server;
let baseUrl;

before(async () => {
  installModelMocks();
  server = await new Promise((resolve) => {
    const listener = createApp().listen(0, "127.0.0.1", () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  mock.restoreAll();
});

test("public ID lookup returns published words and hides every unavailable state", async () => {
  const published = await request(`/words/${fixtures[0]._id}`);
  assert.equal(published.status, 200);
  assert.equal(published.body.item.status, "published");

  for (const id of [fixtures[3]._id, fixtures[4]._id, fixtures[5]._id, "555555555555555555555555"]) {
    const response = await request(`/words/${id}`);
    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Word not found");
  }
});

test("public aliases resolve published words and hide draft, archived, and deleted aliases", async () => {
  for (const identifier of ["published-term", "erey-la-daabacay"]) {
    const response = await request(`/words/lookup/${identifier}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.item._id, fixtures[0]._id);
  }

  for (const identifier of [
    "draft-term",
    "erey-kaydsan",
    "deleted-term",
    `draft-term--erey-qabyo--${fixtures[3]._id}`
  ]) {
    const response = await request(`/words/lookup/${identifier}`);
    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Word not found");
  }
});

test("public word DTO preserves compatibility fields and removes internal metadata", async () => {
  const response = await request("/words?page=1&limit=2&sort=alphabetical");
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ["count", "items", "pagination", "success", "words"]);
  assert.equal(response.body.items.length, 2);
  assert.deepEqual(response.body.items, response.body.words);

  const item = response.body.items[0];
  for (const required of [
    "_id",
    "id",
    "englishWord",
    "somaliWord",
    "english",
    "somali",
    "partOfSpeech",
    "definitions",
    "examples",
    "category",
    "categories",
    "status"
  ]) {
    assert.ok(Object.hasOwn(item, required), `missing compatibility field ${required}`);
  }

  for (const forbidden of [
    "__v",
    "normalizedEnglish",
    "normalizedSomali",
    "sync",
    "popularity",
    "searchKeywords",
    "source",
    "aiTranslation",
    "voiceTranslation"
  ]) {
    assert.equal(Object.hasOwn(item, forbidden), false, `exposed internal field ${forbidden}`);
  }
});

test("English and Somali search plus autocomplete keep their public envelopes", async () => {
  for (const query of ["published", "daabacay"]) {
    const response = await request(`/words/search?q=${query}&direction=auto&page=1&limit=5`);
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.items));
    assert.ok(response.body.pagination);
    assert.ok(response.body.items.every((word) => word.status === "published"));
    assert.equal(Object.hasOwn(response.body.items[0], "sync"), false);
  }

  const suggestions = await request("/words/suggestions?q=pub&limit=5");
  assert.equal(suggestions.status, 200);
  assert.ok(Array.isArray(suggestions.body.suggestions));
  assert.ok(
    suggestions.body.suggestions.every((suggestion) =>
      fixtures.filter(isPublicWord).some((word) => word._id === String(suggestion.id))
    )
  );
  assert.deepEqual(Object.keys(suggestions.body.suggestions[0]).sort(), [
    "category",
    "englishWord",
    "id",
    "label",
    "partOfSpeech",
    "somaliWord",
    "type"
  ]);
  assert.deepEqual(Object.keys(suggestions.body.suggestions[0].category).sort(), [
    "_id",
    "id",
    "name",
    "slug"
  ]);
});

test("category responses are bounded, paginated, and serialized", async () => {
  const firstPage = await request("/categories/test-category?page=1&limit=2");
  const secondPage = await request("/categories/test-category?page=2&limit=2");

  assert.equal(firstPage.status, 200);
  assert.equal(firstPage.body.words.length, 2);
  assert.equal(firstPage.body.pagination.total, 3);
  assert.equal(firstPage.body.pagination.pages, 2);
  assert.equal(secondPage.body.words.length, 1);
  assert.equal(Object.hasOwn(firstPage.body.words[0], "sync"), false);
  assert.equal(Object.hasOwn(firstPage.body.item, "__v"), false);

  const excessive = await request("/categories/test-category?page=1&limit=101");
  assert.equal(excessive.status, 400);

  const legacyCategory = await request("/words/category/test-category?page=1&limit=2");
  assert.equal(legacyCategory.status, 200);
  assert.equal(legacyCategory.body.words.length, 2);
  assert.equal(legacyCategory.body.pagination.total, 3);
});

test("A-Z listing and Word of the Day remain publication-scoped", async () => {
  const letterPage = await request("/words?page=1&limit=10&letter=p&sort=alphabetical");
  assert.equal(letterPage.status, 200);
  assert.equal(letterPage.body.items.length, 3);
  assert.ok(letterPage.body.items.every((word) => word.status === "published"));

  const dailyWord = await request("/words/word-of-the-day?date=2026-09-07");
  assert.equal(dailyWord.status, 200);
  assert.equal(dailyWord.body.success, true);
  assert.deepEqual(Object.keys(dailyWord.body.word).sort(), ["_id", "category", "english", "somali", "type"]);
});

test("SEO index requires its server token and returns only sitemap fields", async () => {
  assert.equal((await request("/words/seo-index?page=1&limit=1000")).status, 404);
  assert.equal(
    (await request("/words/seo-index?page=1&limit=1000", { "X-SEO-Index-Token": "incorrect" })).status,
    404
  );

  const response = await request("/words/seo-index?page=1&limit=1000", {
    "X-SEO-Index-Token": process.env.SEO_INDEX_TOKEN
  });
  assert.equal(response.status, 200);
  assert.equal(response.response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(Object.keys(response.body.items[0]).sort(), ["path", "updatedAt"]);
  assert.match(response.body.items[0].path, /^\/word\/published-term--erey-la-daabacay--/);

  const excessive = await request("/words/seo-index?page=1&limit=1001", {
    "X-SEO-Index-Token": process.env.SEO_INDEX_TOKEN
  });
  assert.equal(excessive.status, 400);
});

test("authenticated admins retain draft and archived reads and can edit a draft", async () => {
  const headers = { Authorization: `Bearer ${createAdminToken()}` };
  const adminList = await request("/words?page=1&limit=20&status=all", headers);
  assert.equal(adminList.status, 200);
  assert.ok(adminList.body.items.some((word) => word.status === "draft"));
  assert.ok(adminList.body.items.some((word) => word.status === "archived"));
  assert.ok(Object.hasOwn(adminList.body.items[0], "sync"));

  for (const id of [fixtures[0]._id, fixtures[3]._id, fixtures[4]._id]) {
    const response = await request(`/admin/words/${id}`, headers);
    assert.equal(response.status, 200);
    assert.equal(response.body.item._id, id);
  }

  for (const id of [fixtures[5]._id, "555555555555555555555555"]) {
    assert.equal((await request(`/admin/words/${id}`, headers)).status, 404);
  }

  const updated = await request(`/words/${fixtures[3]._id}`, headers, {
    method: "PUT",
    body: JSON.stringify({
      englishWord: "updated draft",
      somaliWord: "qabyo la cusbooneysiiyay",
      partOfSpeech: "noun",
      status: "draft",
      source: "human"
    })
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.item.status, "draft");
});

test("analytics and public suggestion workflows remain available", async () => {
  const missing = await request("/analytics/missing-search", {}, {
    method: "POST",
    body: JSON.stringify({ query: "controlled missing term" })
  });
  assert.equal(missing.status, 202);

  const popular = await request("/analytics/popular-search", {}, {
    method: "POST",
    body: JSON.stringify({ wordId: fixtures[0]._id })
  });
  assert.equal(popular.status, 204);

  const suggestion = await request("/suggestions", {}, {
    method: "POST",
    body: JSON.stringify({ english: "teacher", somali: "macallin", type: "noun", note: "controlled test" })
  });
  assert.equal(suggestion.status, 201);
});

function installModelMocks() {
  mock.method(Word, "findOne", (query) => makeQuery(findWord(query), { preserveValue: true }));
  mock.method(Word, "find", (query) => makeQuery(fixtures.filter((word) => matches(word, query))));
  mock.method(Word, "countDocuments", async (query) => fixtures.filter((word) => matches(word, query)).length);
  mock.method(Word, "aggregate", async (pipeline = []) => {
    const matchStage = pipeline.find((stage) => stage.$match)?.$match || {};
    const skip = pipeline.find((stage) => stage.$skip)?.$skip || 0;
    const limit = pipeline.find((stage) => stage.$limit)?.$limit;
    const results = fixtures.filter((word) => matches(word, matchStage)).slice(Number(skip));
    return results.slice(0, limit === undefined ? results.length : Number(limit)).map(clone);
  });
  mock.method(Word, "exists", async () => null);
  mock.method(Word, "updateOne", async () => ({ matchedCount: 1, modifiedCount: 1 }));

  const category = {
    _id: categoryId,
    name: "Test Category",
    slug: "test-category",
    description: "Controlled fixture category",
    isActive: true,
    __v: 4
  };
  mock.method(Category, "findOne", () => makeQuery(category));
  mock.method(Category, "find", () => makeQuery([category]));

  const admin = {
    _id: adminId,
    email: "admin@example.test",
    name: "Test Admin",
    role: "admin",
    isActive: true,
    tokenVersion: 0,
    passwordChangedAt: null
  };
  mock.method(Admin, "findOne", () => makeQuery(admin));
  mock.method(MissingSearch, "updateOne", async () => ({ acknowledged: true }));
  mock.method(WordSuggestion, "create", async (payload) => payload);
}

function wordFixture(id, englishWord, somaliWord, status, isDeleted) {
  return {
    _id: id,
    __v: 7,
    englishWord,
    somaliWord,
    normalizedEnglish: normalize(englishWord),
    normalizedSomali: normalize(somaliWord),
    partOfSpeech: "noun",
    englishDefinition: "Controlled English definition.",
    somaliDefinition: "Qeexitaan tijaabo ah.",
    englishExample: "Controlled example.",
    somaliExample: "Tusaale tijaabo ah.",
    category: { _id: categoryId, name: "Test Category", slug: "test-category", __v: 2 },
    letter: normalize(englishWord).charAt(0),
    searchKeywords: [normalize(englishWord)],
    aiTranslation: { provider: "private-provider", reviewedByHuman: false },
    voiceTranslation: { voiceProvider: "private-voice-provider" },
    popularity: { score: 99, searchCount: 10 },
    sync: { version: 3, isDeleted },
    status,
    source: "import",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z")
  };
}

function makeQuery(initialValue, { preserveValue = false } = {}) {
  let value = preserveValue
    ? initialValue
    : Array.isArray(initialValue)
      ? initialValue.map(clone)
      : clone(initialValue);
  const query = {
    populate() {
      return query;
    },
    select() {
      return query;
    },
    sort() {
      return query;
    },
    skip(amount) {
      if (Array.isArray(value)) value = value.slice(Number(amount));
      return query;
    },
    limit(amount) {
      if (Array.isArray(value)) value = value.slice(0, Number(amount));
      return query;
    },
    lean() {
      return Promise.resolve(preserveValue ? value : clone(value));
    },
    then(resolve, reject) {
      return Promise.resolve(preserveValue ? value : clone(value)).then(resolve, reject);
    }
  };
  return query;
}

function findWord(query) {
  const word = fixtures.find((fixture) => matches(fixture, query));
  if (!word) return null;

  return {
    ...clone(word),
    set(payload) {
      Object.assign(this, payload);
    },
    async save() {
      return this;
    },
    async populate() {
      return this;
    }
  };
}

function matches(word, query = {}) {
  if (query._id && String(query._id) !== word._id) return false;
  if (query.status && query.status !== word.status) return false;
  if (query["sync.isDeleted"] !== undefined && query["sync.isDeleted"] !== word.sync.isDeleted) return false;
  if (query.category && String(query.category) !== String(word.category?._id)) return false;
  if (query.partOfSpeech && query.partOfSpeech !== word.partOfSpeech) return false;
  if (query.letter && query.letter !== word.letter) return false;
  if (query.normalizedEnglish?.$in && !query.normalizedEnglish.$in.includes(word.normalizedEnglish)) return false;
  if (query.normalizedSomali?.$in && !query.normalizedSomali.$in.includes(word.normalizedSomali)) return false;
  if (query.$or && !query.$or.some((condition) => matches(word, condition))) return false;
  return true;
}

function isPublicWord(word) {
  return word.status === "published" && word.sync.isDeleted === false;
}

function normalize(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function clone(value) {
  if (value === undefined || value === null) return value;
  return structuredClone(value);
}

function createAdminToken() {
  return jwt.sign(
    { role: "admin", email: "admin@example.test", tokenVersion: 0 },
    process.env.JWT_SECRET,
    { subject: adminId, expiresIn: "1h" }
  );
}

async function request(path, headers = {}, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  return { response, status: response.status, body: text ? JSON.parse(text) : null };
}
