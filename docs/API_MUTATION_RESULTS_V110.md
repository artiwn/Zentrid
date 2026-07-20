# API Mutation Results — v110

Zentrid now exposes a non-throwing mutation facade for active Global Admin write operations.

## Runtime API

`ZentridAPIMutations` wraps the existing `ZentridPlatformAPI` write methods. The Platform API remains backward-compatible and continues to return raw backend payloads. Forms may opt into the normalized facade when they are connected to real backend operations.

Every call resolves to a discriminated result:

```ts
const result = await ZentridAPIMutations.clients.create(payload);
if (result.ok) {
  console.log(result.data, result.meta);
} else {
  console.log(result.error.kind, result.error.retriable);
}
```

## Error categories

- `timeout`
- `cancelled`
- `unauthorized`
- `forbidden`
- `validation`
- `conflict`
- `rate-limit`
- `server`
- `network`
- `unknown`

Errors are normalized without changing the existing request/auth lifecycle. Successful Platform API writes still emit `zentrid:data-mutated`, so repository cache invalidation remains centralized in the repository layer.

## Events

Every normalized result emits `zentrid:mutation-result`. The event is informational and does not invalidate cache by itself.

## Scope

The facade is loaded only on the eight active mutation-capable pages for Clients, Tenants, Plants and Integrations. Planning pages remain unchanged.
