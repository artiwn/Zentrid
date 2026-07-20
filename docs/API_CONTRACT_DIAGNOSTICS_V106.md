# API Contract Diagnostics — v106

Zentrid keeps backend compatibility aliases in `assets/js/api-contracts.ts`, but no longer applies silent fallbacks without recording why they were needed.

## Validation model

Each active entity contract exposes:

```ts
parse(value)
validate(value, index)
map(value, index, context)
mapList(values, context)
```

Validation is non-destructive. A malformed or incomplete record is still mapped with the existing safe fallback values so the prototype remains usable. The normalized record receives:

```ts
contractEntity
contractValid
contractIssues
raw
```

The original backend payload remains available as `raw`.

## Diagnostic severities

- `error`: an identity or display field required to identify the record is absent or invalid.
- `warning`: an important relationship, provider, status, or optional numeric field is missing or malformed.

Issue codes:

```text
INVALID_RECORD
MISSING_REQUIRED_FIELD
INVALID_FIELD_TYPE
```

## Runtime API

```ts
FleetAPIContracts.diagnostics.clear()
FleetAPIContracts.diagnostics.clear('devices')
FleetAPIContracts.diagnostics.list()
FleetAPIContracts.diagnostics.list('plants')
FleetAPIContracts.diagnostics.summary()
```

Identical issues are deduplicated by entity, record index, issue code, field, and message.

## UI behavior

Active API pages show a contract diagnostic panel only when live or partially live records contain contract issues. The panel:

- distinguishes required-field errors from warnings;
- reports affected entity types;
- lists up to twelve concrete field issues;
- keeps the page operational with safe fallback values;
- uses `role="alert"` when errors exist and `role="status"` for warnings only.

Empty, unavailable, unauthorized, and mock-only states do not show stale contract diagnostics.

## Verification

`npm run check:contract-diagnostics` verifies validation, fallback metadata, raw payload preservation, deduplication, scoped clearing, summary behavior, and UI/CSS hooks. It is part of both `verify` and `verify:vercel`.
