# Dictionary API v1

The versioned API is an additive, read-only interface for published English-Somali dictionary data. It does not replace the first-party `/api/words` or `/api/categories` routes.

Production base URL:

```text
https://somali-dictionary.onrender.com/api/v1
```

OpenAPI 3.1 specification: [`docs/openapi.v1.yaml`](./openapi.v1.yaml)

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/search` | Search English and Somali text with bounded pagination. |
| GET | `/entries` | Browse published entries with filters and deterministic sorting. |
| GET | `/entries/{id}` | Retrieve one published entry by its stable MongoDB ID. |
| GET | `/terms/{term}/entries` | Return all exact English or Somali matches for an ambiguous term. |
| GET | `/categories` | List active database-backed categories with published word counts. |
| GET | `/categories/{slug}` | Retrieve one active category and its published word count. |

The exact-term endpoint returns a collection instead of selecting one arbitrary translation. For example, the current published dataset contains both `doctor -> dhakhtar` and `doctor -> takhtar` as distinct entries.

## Success Envelopes

Single resource:

```json
{
  "success": true,
  "data": {
    "id": "6a33e425f881968cca93dd19",
    "languages": {
      "english": "doctor",
      "somali": "dhakhtar"
    },
    "partOfSpeech": "noun"
  },
  "meta": {
    "requestId": "request-id"
  }
}
```

Collection:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "meta": {
    "requestId": "request-id"
  }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "Dictionary entry not found"
  },
  "meta": {
    "requestId": "request-id"
  }
}
```

## Public Entry Fields

An entry may contain:

- Stable `id`.
- `languages.english` and `languages.somali`.
- `partOfSpeech`.
- Active category ID, name, and slug.
- English and Somali definitions when recorded.
- Paired English and Somali examples when recorded.
- Creation and update timestamps.

Missing definitions, examples, and categories are omitted. The API does not infer or fabricate them.

Internal normalized fields, search keywords, synchronization state, popularity analytics, ingestion source, AI metadata, Mongoose version fields, and deletion state are never part of the v1 DTO.

## Pagination and Limits

- Pages are one-based.
- Ranked search and entry browsing use stable ID tie-breakers so equal values keep a deterministic order.
- Search and exact-term lookup default to 20 entries and allow at most 50.
- Entry browsing defaults to 20 entries and allows at most 100.
- Category listing defaults to 50 categories and allows at most 100.
- Requests above a limit return `400 invalid_request` rather than an unbounded response.
- Missing exact terms return a successful empty collection. Missing entry IDs and category slugs return `404 not_found`.

## Dataset Limitations

At the Phase 2 audit date, the production sitemap represented approximately 18,971 published dictionary entries. Coverage and field completeness vary. Many imported records contain a word pair and part of speech but no definition, example, or category.

The schema's internal `source` field records an ingestion path only. It is not evidence of independent linguistic review, even when its value is `human`. The current word schema does not record sufficiently detailed per-entry provenance, ownership, citation, or license terms for external training or bulk redistribution.

API availability does not grant training, redistribution, or commercial licensing rights. Those policies require a separate provenance and licensing review.

## Security

- Every query enforces `status: published` and `sync.isDeleted: false` in the database layer.
- Responses are built through explicit public DTO serializers, never raw Mongoose documents.
- The API is read-only and has no admin authentication or write routes.
- Requests use bounded validation, request IDs, duration logging, global JSON limits, and an IP-based read rate limit.
- API consumers never receive MongoDB credentials or direct database access.
- Phase 2 does not introduce API keys, commercial quotas, bulk exports, training access, or licensing agreements.

## Phase 2 Release Risk Review

The previous Render production audit reported four affected packages. The
parser dependency chain has been remediated without moving Express to a new
major version:

| Package | Previous finding | Production reachability | Phase 2 action |
| --- | --- | --- | --- |
| `express@4.22.2` | Moderate through vulnerable `qs` | Every route that accepts query parameters reaches the parser | Kept Express 4 for compatibility and overrode its parser dependencies safely. |
| `body-parser@1.20.5` | Low invalid configured limit and moderate through `qs` | JSON parsing is public, but limits are fixed by application code rather than request input | Updated to `1.20.6`; existing `1mb` and `12kb` limits remain. |
| `qs@6.15.2` | Two moderate denial-of-service advisories | Public query parsing is remotely reachable | Updated to `6.16.0` through scoped package overrides. |
| `xlsx@0.18.5` | High prototype-pollution and regular-expression denial-of-service advisories | Parsing requires an authenticated admin and a file below the existing 5 MB upload limit | No compatible npm fix exists. Excel import remains available; replacing the parser requires a separately tested migration. |

After the scoped dependency update, the server production audit reports only
the high-severity `xlsx` advisory. No forceful dependency upgrade was used.

Operational risks intentionally left unchanged in Phase 2:

- The apex domain `somali-dictionary.com` still needs its DNS record corrected; `www.somali-dictionary.com` is the working canonical host.
- The deployed Render service should have `/api/health` configured as its dashboard health-check path. The repository cannot prove that dashboard-only setting.
- No mobile source is present in this repository. Older mobile builds that assume unbounded legacy category responses may display only the first page and require a coordinated client update. The new `/api/v1` contract is additive and does not alter that legacy response.
