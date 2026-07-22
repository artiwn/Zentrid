# Zentrid Data Freshness & Refresh Controls v135

Zentrid now exposes a consistent freshness contract on API-backed screens without changing backend endpoints.

## States

- Live
- Cached
- Refreshing
- Stale
- Partial
- Unavailable

The last successful response timestamp is preserved while a refresh is running or an endpoint is temporarily unavailable.

## Refresh behavior

- `Refresh` performs a forced repository read for the active screen.
- `Retry failed section` is shown for partial, stale, and unavailable states.
- Auto-refresh is disabled by default and can be set to 30 seconds, 1 minute, or 5 minutes.
- Auto-refresh pauses while the tab is hidden, the browser is offline, or a refresh is already active.
- Existing visible data remains on screen during background refresh.

## Supported screens

Overview, Client/Tenant/Plant/Device/Alert/Integration registries and their live detail pages.

## Diagnostics

`ZentridDataFreshness.snapshot()` returns the active resource, freshness state, last update, age, auto-refresh interval, network state, and visibility state.
