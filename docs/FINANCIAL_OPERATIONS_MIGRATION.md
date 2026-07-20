# Financial Operations migration

The former **Commercial Governance** sidebar group was replaced by **Financial Operations**.

Active routes:

- `pages/tariff-plans.html`
- `pages/billing-management.html`
- `pages/invoice-center.html`
- `pages/payment-settings.html`
- `pages/revenue-settlements.html`

The tariff builder, invoice center and settlement workspace were migrated from the earlier Zentrid prototype into strict TypeScript. Billing Management and Payment Settings keep the richer implementations already present in the current codebase. Existing commercial pages and the `billing-payments.html` URL remain available for compatibility, but they are no longer exposed in the primary sidebar.
