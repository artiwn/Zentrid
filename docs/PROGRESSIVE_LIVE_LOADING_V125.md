# Progressive Live Loading v125

Zentrid renders fast administrative and normalized collection responses before optional slow relations.

## Critical path

- Clients, Tenants, Plants, Devices and Provider Integration Registry render from the first bounded page.
- Collection previews request at most 100 records and do not fan out across thousands of pages.
- Provider names and templates remain fast supporting requests.

## Background enrichment

- Alerts use a dedicated 90-second background request and never block Plants, Devices, Overview or detail screens.
- `/api/integrations` is treated as an operational summary. `/api/admin/provider-integrations` remains the fast registry and lifecycle source.
- Plant/Device relations are attached and rerendered as each request completes.

## Mapping alignment

The contract layer now recognizes the current backend field names for Clients, Tenants, Plants, Devices, Alerts and Provider Integrations while preserving raw payloads.
