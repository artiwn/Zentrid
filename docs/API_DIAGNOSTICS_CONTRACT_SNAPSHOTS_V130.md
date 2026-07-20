# API Diagnostics & Contract Snapshots v130

Zentrid Platform API Console now records response duration, size, pagination, content type, request/trace identifier and structural response hash. The current safe diagnostic run is compared with the previous browser-session run to expose status, latency, row-count, size and response-shape changes.

Six sanitized fixtures under `assets/fixtures/api-contracts/` lock the supported Client, Tenant, Plant, Device, Alert and Integration list shapes. They contain no access tokens, passwords, API keys, credentials or production payloads. The build validates each fixture through the canonical Zentrid contract mapper.

Per-endpoint actions copy the response, a concise diagnostic report, or a redacted safe snapshot. Sensitive key names are recursively replaced with `[redacted]`.

Verification:

```bash
npm run check:api-diagnostics-contract-snapshots
npm run verify
npm run verify:vercel
```
