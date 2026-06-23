# REST API

Base URL: `http://localhost:5000/api`

## Public Routes

These routes do not require admin authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/words` | List published dictionary entries |
| GET | `/words/:id` | Get one dictionary entry |
| GET | `/words/search?q=word&direction=auto` | Search published words |
| GET | `/words/suggestions?q=word` | Get autocomplete suggestions |
| GET | `/words/category/:category` | List published words in one category |
| GET | `/categories` | List categories |
| GET | `/categories/:slug` | Get category with words |

## Admin Authentication

Admin login uses email and password credentials. The API returns a JWT that must be sent with protected requests.

```http
Authorization: Bearer <admin-jwt>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/admin/login` | Sign in and receive an admin JWT |
| GET | `/admin/me` | Validate the current admin session |
| GET | `/admin/stats` | Get dashboard statistics |

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
