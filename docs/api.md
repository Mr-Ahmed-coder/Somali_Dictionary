# REST API

Base URL: `http://localhost:5000/api`

## Public

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/words` | List dictionary entries |
| GET | `/words/:id` | Get one dictionary entry |
| GET | `/words/search?q=word&direction=english-to-somali` | Search words |
| POST | `/words` | Create a dictionary entry |
| PUT | `/words/:id` | Replace a dictionary entry |
| DELETE | `/words/:id` | Soft delete a dictionary entry |
| GET | `/categories` | List categories |
| GET | `/categories/:slug` | Get category with words |

## Protected Writes

Write endpoints require `x-admin-key`.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/words` | Create word entry |
| PUT | `/words/:id` | Replace word entry |
| PATCH | `/words/:id` | Partially update word entry |
| DELETE | `/words/:id` | Soft delete word entry |
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
