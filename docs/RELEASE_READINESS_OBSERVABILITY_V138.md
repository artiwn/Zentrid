# Zentrid Release Readiness & Production Observability v138

Zentrid now publishes a generated `dist/assets/release-manifest.json` for every local or Vercel build. The browser runtime exposes safe release diagnostics through `window.FleetReleaseObservability` and a small version/health chip in the top bar.

## Runtime API

- `FleetReleaseObservability.snapshot()` — safe runtime health report.
- `FleetReleaseObservability.copySafeReport()` — copy redacted JSON diagnostics.
- `FleetReleaseObservability.downloadReport()` — download the same report.
- `FleetReleaseObservability.checkForUpdate(true)` — compare the current build with the deployed manifest.
- `FleetReleaseObservability.openPanel()` — open the release and diagnostics panel.

The report never includes access tokens, refresh tokens, passwords, API keys, authorization headers, cookies or credentials. Authentication is represented only by an authenticated flag, expiration state and roles.

## Build metadata

`npm run build` and `npm run build:vercel` generate release metadata using package version, release name, deployment environment, commit SHA when available and a unique build ID. `SOURCE_DATE_EPOCH` is supported for reproducible builds.
