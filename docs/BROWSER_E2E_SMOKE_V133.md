# Browser E2E Smoke Tests v133

Zentrid now includes a deterministic browser E2E suite driven through the Chrome DevTools Protocol. It uses the generated `dist/` application and intercepts API requests with read-only fixtures, so it does not depend on backend availability and never performs real mutation requests.

## Covered journeys

1. Login with the Global Admin role and navigation to Clients.
2. Clients registry rows, create-modal open/close, server pagination, URL query state, and browser Back navigation.
3. Plant Detail lazy loading of Devices.
4. Device Detail lazy loading of Alerts.
5. Integration Detail lazy loading of the operational synchronization summary.
6. Platform API Console safe diagnostics and mapping panel rendering.

Every journey fails on uncaught JavaScript exceptions, `console.error`, failed local scripts/stylesheets, protected-route redirects, missing runtime scripts, missing selectors, or unexpected API call order.

## Commands

```bash
npm run check:browser-e2e-smoke
npm run e2e:browser
```

`check:browser-e2e-smoke` is deterministic and runs as part of `npm run verify` and `npm run verify:vercel`. It validates the route/action manifest and confirms that every selector and lazy-loading hook still exists in its source-of-truth file.

`e2e:browser` builds Zentrid, starts the local proxy, launches Chrome/Edge/Chromium headlessly, and runs all browser journeys. Set `ZENTRID_BROWSER_PATH` when the browser executable is not in a standard location.

Run selected scenarios with:

```bash
ZENTRID_E2E_SCENARIOS=clients-query-state-and-modal,api-console-diagnostics npm run e2e:browser
```

On Windows PowerShell:

```powershell
$env:ZENTRID_E2E_SCENARIOS='clients-query-state-and-modal,api-console-diagnostics'
npm.cmd run e2e:browser
```

## Test isolation

The browser profile is temporary. The suite resets `localStorage` and `sessionStorage` for every scenario, injects a Global Admin session only when needed, and closes every test tab after completion. API responses use synthetic IDs and `.invalid` email addresses.
