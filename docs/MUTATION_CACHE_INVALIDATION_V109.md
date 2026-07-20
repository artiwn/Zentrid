# Mutation cache invalidation — v109

Zentrid read repositories use short-lived in-memory cache. Successful platform write actions now emit a typed `zentrid:data-mutated` event after the backend confirms the mutation. The repository layer listens for that event and invalidates only affected entity caches.

## Event contract

```ts
interface ZentridDataMutationDetail {
  action: string;
  path: string;
  method: string;
  entities: ZentridContractEntity[];
  completedAt: string;
}
```

No event is emitted when a write request fails, so valid cached data remains available.

## Current invalidation map

- Tenant create/activate/deactivate/archive → `tenants`
- Client create → `clients`
- Plant create → `plants`
- Integration create/validate/test actions → `integrations`
- Integration activate/suspend/archive/failed → `integrations`, `plants`, `devices`, `alerts`

Integration lifecycle actions clear dependent live caches because provider availability can change normalized plants, devices and alerts.

## Repository API

```ts
ZentridAPIRepositories.cache.invalidate('devices');
ZentridAPIRepositories.cache.invalidateMany(['plants', 'devices', 'alerts']);
```

## Verification

```powershell
npm.cmd run check:mutation-invalidation
npm.cmd run verify
```
