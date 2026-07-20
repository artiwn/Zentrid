# Typed API repositories — v107

Zentrid active live screens read normalized entities through `assets/js/api-repositories.ts`.

## Scope

The repository layer covers:

- Clients
- Tenants
- Plants
- Devices
- Alerts
- Integrations

Each repository exposes:

```ts
list(): Promise<FleetRepositoryListResult>
get(id: string): Promise<FleetRepositoryItemResult>
```

A list result contains normalized `items`, original `rawItems`, source metadata and non-blocking supporting request errors.

## Responsibilities

The repository layer owns:

- active Swagger endpoint selection;
- collection envelope extraction;
- paged collection loading for Plants and Devices;
- identity-based deduplication;
- live/admin Plant source merging;
- live/admin Integration fallback selection;
- DTO mapping through `FleetAPIContracts`;
- normalized item lookup by Zentrid or external identity.

`live-api-ui.ts` now owns only page orchestration, relation enrichment, render calls and live-data state presentation. It no longer calls the six entity APIs or contract mappers directly.

## Script order

Active live pages load:

```html
<script src=".../platform-api.js"></script>
<script src=".../api-contracts.js"></script>
<script src=".../api-repositories.js"></script>
<script src=".../live-api-ui.js"></script>
```

The live bridge configures the mapper context before repositories are used.

## Verification

Run:

```powershell
npm.cmd run check:api-repositories
```

The check verifies all six repositories, pagination, Plant source merging, Integration fallback, external-ID lookup, source metadata, absence of direct entity API access in the live bridge, and script order on all 13 active live pages.
