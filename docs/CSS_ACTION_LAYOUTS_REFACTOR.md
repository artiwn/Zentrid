# Shared action-container layouts refactor — v92

This patch consolidates repeated flex/grid layout declarations used by Zentrid action containers. It does not rename HTML classes or change TypeScript render functions.

## Shared module

`assets/css/src/components/action-layouts.css` owns the base layout for:

- `.page-actions`;
- `.inline-actions`;
- `.integration-page-actions`;
- `.hero-actions`;
- `.drawer-actions`;
- `.modal-actions`;
- `.row-actions`;
- `.vertical-actions`;
- `.inline-form-actions`.

The module loads immediately after `00-foundation.css`. All page layers load after it and keep their scoped positioning, sticky footer, sizing, alignment and responsive overrides.

## Removed duplication

The previous cascade repeated the same base declarations in platform, client, device, alert and API-console layers. The refactor removes superseded global blocks and trims scoped rules so they contain only properties that differ from the shared component.

Examples preserved as page-specific behavior include:

- sticky modal and drawer footers;
- compact table row actions;
- billing and payment alignment;
- single-action row positioning;
- alert table action alignment;
- mobile hero alignment.

## Verification

Computed styles were compared between v91 and v92 for 22 action-container contexts at desktop and mobile widths. All 44 context/viewport combinations matched, including element geometry.

The generated application differs from v91 only in `assets/css/styles.css`. HTML, TypeScript, JSON and all other runtime files remain byte-for-byte identical.

`check-css-source.js` now rejects global action-layout selectors outside `components/action-layouts.css`, preventing these base declarations from being scattered again.
