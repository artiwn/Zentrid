# Zentrid API Contract Layer

`assets/js/api-contracts.ts` is the single compatibility boundary between backend DTOs and Zentrid UI view models.

## Scope

The layer currently owns six active entities:

- Clients
- Tenants
- Plants
- Devices
- Alerts
- Integrations

Each entity contract exposes:

- `parse(value)` — accepts only object DTO payloads;
- `map(value, index, context)` — converts one DTO into the existing normalized UI model;
- `mapList(values, context)` — maps a collection while preserving order.

## Ownership rule

Backend field aliases belong in `api-contracts.ts`. Page renderers and `live-api-ui.ts` must not add new DTO aliases directly. For example, Plant naming compatibility such as `plantName`, `sourcePlantName`, `stationName`, and `siteName` is resolved by the Plant contract before the record reaches the page renderer.

The live API bridge still owns request orchestration, relation enrichment, pagination, loading states, and mock fallback. It delegates entity mapping to `FleetAPIContracts`.

## Migration rule

When backend DTOs become final:

1. narrow the corresponding DTO interface;
2. remove obsolete aliases from its mapper;
3. update `scripts/check-api-contracts.js` fixtures;
4. keep the normalized UI view model stable unless the UI itself is intentionally changed.

Planning pages are outside this layer and remain unchanged.
