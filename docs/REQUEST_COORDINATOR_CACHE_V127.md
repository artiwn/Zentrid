# Zentrid Request Coordinator & Cache v127

## Scope

This frontend-only layer improves perceived loading speed and request safety without changing backend endpoints or DTOs.

## Behavior

- Repository pages are cached by entity, variant, page and page size.
- Successful bounded list responses are stored in `sessionStorage` when small enough.
- A reload can render the last successful page immediately.
- Persistent and stale pages use stale-while-revalidate and refresh silently in the background.
- Successful background refreshes emit `zentrid:repository-updated`.
- Registry listeners rerender only when the refreshed page still matches the current URL query state.
- Requests in the same registry group supersede and abort older page requests.
- Identical in-flight requests remain deduplicated.
- Aborted requests never fall through to an uncancelled direct request.
- Cache invalidation clears both memory and session storage after auth changes or successful mutations.

## Default freshness windows

| Entity | Fresh TTL | Maximum stale age |
|---|---:|---:|
| Clients | 30 sec | 10 min |
| Tenants | 30 sec | 10 min |
| Plants | 15 sec | 5 min |
| Devices | 15 sec | 5 min |
| Alerts | 10 sec | 2 min |
| Integrations | 20 sec | 5 min |

## Verification

```bash
npm run check:request-coordinator-cache
npm run verify
npm run verify:vercel
```
