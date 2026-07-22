# Zentrid CSS architecture

The Zentrid stylesheet contains 12,994 ordered lines. It is maintained as smaller source fragments while preserving the original selector order and cascade.

## Source of truth

```text
assets/css/src/
├── 00-foundation.css
├── 05-platform-core-patches.css
├── 10-client-plant-device.css
├── components/
│   ├── badge-base.css
│   ├── badge-tones.css
│   ├── card-surfaces.css
│   ├── action-layouts.css
│   ├── compact-actions.css
│   ├── actions.css
│   ├── detail-card-shells.css
│   ├── information-grid-content.css
│   ├── information-cell-overflow.css
│   ├── metric-card-content.css
│   ├── metric-card-overflow.css
│   ├── data-table-content.css
│   ├── data-table-layout.css
│   ├── form-primitives.css
│   └── modal-drawer-shells.css
├── 11-client-plant-device-details.css
├── 20-governance-and-client-flows.css
├── 30-devices-alerts-and-groups.css
├── 40-commercial-data-access-audit.css
├── 50-production-normalization-tenant-tables.css
├── 60-licensing-billing-payments-rbac.css
├── 70-incidents-work-orders-sop.css
├── 80-auth-and-api-console.css
└── manifest.json
```

`manifest.json` defines the exact concatenation order. During build, `scripts/build-css.js` generates:

```text
dist/assets/css/styles.css
```

## Rules

1. Edit CSS fragments under `assets/css/src/`.
2. Do not create or edit `assets/css/styles.css` in the source tree.
3. Do not reorder manifest entries without checking the complete interface.
4. Preserve page-specific selectors until their visual equivalence has been verified.
5. Run `npm.cmd run verify` and `npm.cmd run smoke:browser` after CSS changes.

## Current refactoring boundary

Reusable UI foundations are now split into sixteen component modules:

- `components/badge-base.css` owns the shared badge shell and adjacent supporting-text spacing;
- `components/badge-tones.css` owns the existing success/good, warning/warn, danger/bad and muted semantic tones;
- `components/card-surfaces.css` owns the shared surface primitives for panels, lightweight panels, KPI cards and module cards;
- `components/action-layouts.css` owns shared action-container flex/grid layouts;
- `components/compact-actions.css` owns `.small-btn` and its compact variants;
- `components/actions.css` owns the global primary, secondary and danger action states;
- `components/detail-card-shells.css` owns shared Client, Plant and Production detail workspace shells;
- `components/metric-card-content.css` owns the base KPI content layout and typography;
- `components/metric-card-overflow.css` owns the later KPI truncation behavior while preserving page-specific cascade overrides;
- `components/information-grid-content.css` owns the base `.info-grid` and `.discovery-grid` layout, cell surface and label/value typography;
- `components/information-cell-overflow.css` owns the later truncation behavior shared by information cells and compact placeholder cards.
- `components/data-table-content.css` owns the common data-head/data-row grid, row surface and table typography;
- `components/data-table-layout.css` owns the final `.data-table` grid and horizontal scrolling behavior while page-specific column templates remain separate.
- `components/form-primitives.css` owns the shared toolbar/label controls, textarea baseline, full-width field span and checkbox-label primitive.
- `components/modal-drawer-shells.css` owns the shared modal overlay/card shell, the default right-side detail drawer and the shared close-control baseline.

Context-specific sizing, alignment, table columns and modal refinements remain in their page layers. Page-specific metric sizing, colors and contextual overrides remain separate. Page-specific form grids, field variants and focus colors remain separate. Page-specific modal/drawer dimensions and behavior remain scoped in page layers. Badge sizes, table spacing and context-specific variants remain page-owned. Existing `info`, `neutral` and `ok` badges intentionally keep their prior base-only appearance.
