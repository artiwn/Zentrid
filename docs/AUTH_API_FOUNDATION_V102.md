# Auth and API foundation — v102

This patch strengthens the shared authentication and HTTP request layer without changing Zentrid business pages or planned placeholder workspaces.

## Request lifecycle

All requests through `ZentridAuth.request` and `FleetAPI.request` now use a shared 15-second timeout by default. Callers may override it with `timeoutMs`.

The client exposes normalized error information through `ZentridRequestError`:

- `status` — HTTP status when available;
- `code` — `HTTP_*`, `TIMEOUT`, `NETWORK_ERROR`, `ABORTED` or `SESSION_EXPIRED`;
- `path` — requested API path.

Every normalized request failure emits `zentrid:request-error`.

## 401 and refresh behavior

An authenticated request that receives HTTP 401 now:

1. uses the stored refresh token;
2. calls `/api/Auth/refresh` once;
3. stores the refreshed access token;
4. retries the original request once with the new token.

Concurrent 401 responses share one refresh promise. Refresh is never recursively retried.

If refresh is unavailable or fails, the client clears the invalid session and emits `zentrid:session-expired`. The auth guard redirects to login and preserves the current route in the `next` query parameter.

## Token expiration and role enforcement

The client reads expiration from, in order:

1. `expiresAt` / `expires_at`;
2. `expiresIn` / `expires_in`;
3. JWT `exp`.

`isAuthenticated()` now rejects expired tokens using a 30-second safety window.

Global Admin pages require the `GlobalAdmin` role. Roles are read case-insensitively from JWT claims or the stored user profile. If role information is missing, `ensureSession()` attempts `/api/Auth/me` before rejecting access.

## Login hardening

The login page no longer contains or pre-fills test credentials. Username and password are required user inputs.

The `next` route is normalized to prevent absolute, root-relative or parent-directory navigation.

## Verification

`scripts/check-auth-foundation.js` verifies:

- test credentials are absent;
- role and expiry helpers are present;
- a valid JWT is accepted;
- an expired JWT is rejected;
- HTTP 401 triggers exactly one refresh and one retry;
- the retried request uses the new Bearer token;
- timeout cancellation returns the `TIMEOUT` error code.

The check runs in both `npm run verify` and `npm run verify:vercel`.

## Explicitly untouched planned pages

No HTML or page-specific TypeScript changes were made to:

- Admin Console
- Analytics
- Asset Registry
- Asset Topology
- Client Onboarding
- Command Center
- CRM Service
- Finance
- Platform Operations
- Reports
- Service Desk
- Settings
- Tasks & Work Orders
- Telemetry
- Tenant Provisioning
