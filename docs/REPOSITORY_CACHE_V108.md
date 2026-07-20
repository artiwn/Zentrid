# Repository cache and request deduplication — v108

Zentrid active read repositories now share a short-lived in-memory cache and one in-flight request per entity.

## Scope

Caching applies to:

- Clients — 30 seconds
- Tenants — 30 seconds
- Plants — 15 seconds
- Devices — 15 seconds
- Alerts — 10 seconds
- Integrations — 20 seconds

The cache is browser-memory only. It is never persisted to `localStorage` and is cleared when the page is closed.

## In-flight request deduplication

If Overview, a list page and a detail workflow request the same repository while its first request is still pending, only one backend read is sent. All consumers await that request and receive independent result copies.

```ts
await Promise.all([
  FleetAPIRepositories.devices.list(),
  FleetAPIRepositories.devices.list(),
  FleetAPIRepositories.devices.get(deviceId)
]);
```

The example above uses one Device repository request rather than three.

## Safe result isolation

Cached mapped records and raw payloads are cloned before they are returned. Relation enrichment or local UI changes on one page cannot mutate the cached copy or another consumer's result.

Failed requests are not cached. A later call retries the backend normally.

## Read controls

Repositories accept optional read controls:

```ts
FleetAPIRepositories.devices.list({ forceRefresh: true });
FleetAPIRepositories.alerts.list({ maxAgeMs: 2_000 });
FleetAPIRepositories.plants.get(id, { maxAgeMs: 0 });
```

- `forceRefresh` ignores a completed cache entry.
- `maxAgeMs` overrides the entity default for that call.
- An already running fresh request is still shared to prevent duplicate traffic.

## Cache lifecycle

The complete cache is invalidated when Zentrid emits:

- `zentrid:auth`
- `zentrid:session-expired`

Invalidation also detaches old in-flight reads. A response started before an auth change cannot repopulate the new session cache.

Manual controls are available:

```ts
FleetAPIRepositories.cache.invalidate('devices');
FleetAPIRepositories.cache.invalidate();
FleetAPIRepositories.cache.snapshot();
```

`snapshot()` reports cache presence, in-flight state, age, TTL, hits, misses, deduplicated reads and invalidations.

## Verification

Run:

```powershell
npm.cmd run check:repository-cache
```

The test verifies TTL reuse, concurrent request deduplication, result clone isolation, forced refresh, max-age expiry, entity invalidation, failure retry and auth/session reset behavior.
