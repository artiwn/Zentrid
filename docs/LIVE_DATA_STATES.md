# Live Data States

Active API-backed Zentrid pages use one shared status surface from `assets/js/live-api-ui.ts` and `assets/css/src/components/live-data-states.css`.

## States

- `loading`: a live request is in progress.
- `live`: live records were loaded and applied.
- `partial`: some live records were applied while one or more supporting requests failed.
- `empty`: the backend responded successfully but returned no records.
- `timeout`: the request exceeded the configured API timeout.
- `unauthorized`: the session expired or refresh was unavailable.
- `forbidden`: the authenticated account cannot access the endpoint.
- `unavailable`: network, proxy, or backend request failure.
- `fallback`: live data could not be applied and the existing mock/local state remains visible.

A successful empty response must never be presented as a network failure. Likewise, request failures must not be presented as an empty dataset.

## Active scope

The shared state surface is used only by the current API-backed Overview, Tenant, Client, Plant, Device, Alert, and Integration list/detail screens. Planning pages are intentionally outside this layer.

## Accessibility

The component uses `role=status` for informational states, `role=alert` for request failures, `aria-live`, and `aria-busy` while loading.
