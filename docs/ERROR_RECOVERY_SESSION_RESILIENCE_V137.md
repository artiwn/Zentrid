# Error Recovery & Session Resilience v137

Zentrid v137 strengthens runtime recovery without changing backend routes or inventing write endpoints.

## Safe request retries

`assets/js/api-client.ts` retries only safe `GET`, `HEAD`, and `OPTIONS` requests. The default policy allows two retries for transient HTTP statuses `408`, `425`, `429`, `500`, `502`, `503`, and `504`, plus network errors and timeouts. `Retry-After` is honored up to 30 seconds. `POST` and other mutations are never retried automatically.

The runtime emits:

- `zentrid:request-retry` before a retry;
- `zentrid:request-success` after a successful response;
- the existing `zentrid:request-error` only when recovery is exhausted.

Offline requests fail before `fetch` with code `OFFLINE`, allowing repository stale-cache fallback to remain visible.

## Cross-tab refresh coordination

Refresh-token requests use a short-lived localStorage lock. When two Zentrid tabs receive `401` simultaneously, one tab refreshes while the other waits for the updated access token and expiry. This reduces duplicate refresh traffic and redirect races.

No access or refresh token is placed inside BroadcastChannel messages.

## Session synchronization

`assets/js/session-resilience.ts` synchronizes these signals across Zentrid tabs:

- session updated;
- session cleared/logout;
- repository cache invalidation after successful mutations.

BroadcastChannel is preferred. Native storage events provide a fallback. Auth Guard revalidates synchronized state and pages restored from browser back-forward cache.

## Cache recovery

Persisted repository entries are validated before hydration. Invalid JSON, invalid result shapes, and expired entries are removed safely and reported through `zentrid:cache-recovered`. Invalid stored user JSON is also removed through `zentrid:storage-recovered`.

## Connectivity UX

A small global recovery banner reports:

- offline mode and stale-data fallback;
- transient API retry;
- restored connection;
- renewed or synchronized session;
- recovered browser storage.

When connectivity returns, Zentrid refreshes the current live resource without reloading the page.

## Verification

Run:

```bash
npm run check:error-recovery-session-resilience
npm run verify
npm run verify:vercel
```
