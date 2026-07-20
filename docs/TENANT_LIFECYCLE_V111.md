# Tenant lifecycle actions v111

Zentrid Tenant Detail now connects the existing typed mutation foundation to the first real backend lifecycle workflow.

## Supported actions

Live or mixed-source Tenant records can call:

- `POST /api/admin/tenants/{id}/activate`
- `POST /api/admin/tenants/{id}/deactivate`
- `POST /api/admin/tenants/{id}/archive`

The available buttons depend on the current normalized status:

- Active: Deactivate, Archive
- Suspended, Inactive, Draft or another non-active state: Activate, Archive
- Archived: read-only

Mock and local records never send lifecycle requests. The detail page displays a `Live API required` marker instead.

## Safety behavior

- Deactivate and Archive require confirmation.
- Buttons are disabled while a request is in flight.
- Normalized mutation errors are shown inline.
- Retriable timeout, network, rate-limit and server failures provide Retry.
- Successful operations use the existing `zentrid:data-mutated` event, so Tenant repository cache is invalidated.
- The page reloads after success and reads the resulting state from the backend instead of locally pretending that the mutation succeeded.

## Files

- `assets/js/tenant-lifecycle.ts`
- `assets/css/src/components/tenant-lifecycle.css`
- `scripts/check-tenant-lifecycle.js`
- `pages/tenant-detail.html`
- `assets/js/tenants.ts`

## Verification

```powershell
npm.cmd run check:tenant-lifecycle
npm.cmd run verify
npm.cmd run verify:vercel
```
