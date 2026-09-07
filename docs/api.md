# REST API

Base URL: `http://localhost:5000/api`

## Public Routes

These routes do not require admin authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/words` | List published dictionary entries |
| GET | `/words/:id` | Get one published dictionary entry by ID |
| GET | `/words/lookup/:identifier` | Get one published entry by English/Somali alias or canonical identifier |
| GET | `/words/search?q=word&direction=auto` | Search published words |
| GET | `/words/suggestions?q=word` | Get autocomplete suggestions |
| GET | `/words/word-of-the-day?date=YYYY-MM-DD` | Get the deterministic public word for a local calendar date |
| GET | `/words/category/:category?page=1&limit=50` | List a bounded page of published words in one category |
| GET | `/categories` | List categories |
| GET | `/categories/:slug?page=1&limit=50` | Get a category with a bounded page of words |

Public list and category endpoints preserve their existing `items`/`words` envelopes and include pagination metadata. Public word objects intentionally exclude normalized search fields, synchronization state, private AI metadata, popularity internals, search keywords, source labels, and Mongoose version fields.

## Internal Sitemap Route

`GET /words/seo-index` is a server-to-server route used only by the Next.js sitemap handlers. It requires the `X-SEO-Index-Token` header, accepts at most 1,000 records per page, and returns only canonical word paths and update timestamps. Never expose `SEO_INDEX_TOKEN` in browser code.

## Admin Authentication

Admin login uses email and password credentials. The first-party web client receives the JWT in an HttpOnly session cookie. Bearer tokens remain supported for trusted non-browser administration clients.

```http
Authorization: Bearer <admin-jwt>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/admin/login` | Sign in and receive an admin JWT |
| GET | `/admin/me` | Validate the current admin session |
| GET | `/admin/stats` | Get dashboard statistics |
| GET | `/admin/words/:id` | Get one word for authenticated draft/archive management |

## Protected Admin Routes

These routes require a valid admin JWT with role `admin`.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/words` | Create word entry |
| PUT | `/words/:id` | Replace word entry |
| PATCH | `/words/:id` | Partially update word entry |
| DELETE | `/words/:id` | Soft delete word entry |
| POST | `/admin/imports/preview` | Preview CSV/XLSX import rows |
| POST | `/admin/imports/commit` | Save valid CSV/XLSX import rows |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Delete category |

## Search Query

`direction` can be:

- `english-to-somali`
- `somali-to-english`
- `auto`

`auto` searches both English and Somali terms.

## Word Payload

```json
{
  "englishWord": "book",
  "somaliWord": "buug",
  "partOfSpeech": "noun",
  "englishDefinition": "A written or printed work consisting of pages.",
  "somaliDefinition": "Qoraal bogag ka kooban oo la akhriyo.",
  "englishExample": "I read a book.",
  "somaliExample": "Waxaan akhriyey buug.",
  "category": "mongo-category-id",
  "searchKeywords": ["education", "reading"],
  "status": "published",
  "source": "human"
}
```

`source` records an ingestion path only. A value such as `human` must not be presented as proof that an entry was independently reviewed or human-verified.
