# Shared action components refactor — v91

This patch consolidates the final global styles for Zentrid primary, secondary and danger actions without changing their HTML classes.

## Shared module

`assets/css/src/components/actions.css` owns:

- `.primary-action` and its hover state;
- `.secondary-action` and its hover state;
- `.danger-action` and its hover state.

The module is loaded immediately before the commercial/billing layer. This preserves the previous final cascade position of the primary action style while allowing scoped form, modal, table and billing selectors to keep their higher-specificity refinements.

## Removed legacy layers

The previous stylesheet contained several superseded global definitions dating from early prototype versions. The refactor removes those dead declarations and keeps only the final computed styles. It does not alter:

- action class names;
- page-specific sizes and widths;
- modal and drawer layouts;
- compact actions;
- TypeScript render functions.

## Verification

A computed-style regression check compared baseline and refactored action elements across standalone, drawer, row, tenant form, document wizard, commercial modal and billing contexts. Base and forced-hover values matched for all checked properties.

`check-css-source.js` now rejects global primary, secondary or danger action selectors outside the shared module, preventing the same duplication from returning.
