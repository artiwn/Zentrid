# Data source provenance v104

Zentrid active API screens now identify where each displayed record came from instead of treating all visible data as equivalent.

## Supported origins

- **Live API** — the record was mapped from a successful backend response.
- **Mock data** — the record is part of the prototype fallback dataset.
- **Local changes** — the record was created or changed in this browser and has not been written to the backend.
- **Mixed sources** — a live record has local unsaved changes, or a page combines records from more than one origin.

The shared runtime helper is `window.FleetDataSource` in `assets/js/data.ts`. It owns origin classification, labels, record chips, collection summaries and local-change transitions.

## Active screens

Record-level source chips are rendered for:

- Clients and Client Detail;
- Tenants and Tenant Detail;
- Plants and Plant Detail;
- Devices and Device Detail;
- Alerts and Alert Detail;
- Integrations and Integration Detail.

The live-data bridge also adds a page-level **Displayed data** summary after the live-state banner. It includes the resolved origin, endpoint/record metadata and a legend for all four origins.

## Storage isolation

Live tenant and integration responses are held in memory:

- `window.ZentridLiveTenants`;
- `window.ZentridLiveIntegrations`.

They no longer overwrite mock or locally created records in `localStorage`.

Until backend write endpoints are connected, changing a live record marks it as **Mixed sources** and keeps that change in the current browser session only. Creating a new prototype record marks it as **Local changes**.

## Verification

`npm run check:data-sources` verifies:

- all four origins and their styles;
- live mapper markers;
- record chips on six active entity renderers;
- page-level source summaries;
- tenant/integration live-storage isolation;
- runtime classification and transition behavior.

The check runs as part of both `npm run verify` and `npm run verify:vercel`.
