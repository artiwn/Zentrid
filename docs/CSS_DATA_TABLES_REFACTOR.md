# Data tables refactor

This patch consolidates the shared Zentrid table foundation without renaming HTML classes or changing page-specific column layouts.

## Shared modules

- `assets/css/src/components/data-table-content.css` owns the common `.data-head` / `.data-row` grid alignment, header typography, row surface and row text styles.
- `assets/css/src/components/data-table-layout.css` owns the final `.data-table` width, horizontal scrolling, grid gap and direct-child head/row layout.

The two modules intentionally load at different positions in `manifest.json`. The early content module preserves existing page overrides. The later layout module replaces the old `!important` repair block after the production/tenant table layer.

## Kept page-specific

The following remain in page layers:

- every `grid-template-columns` definition;
- wide-table and compact-table minimum widths;
- mobile stacking and hidden headers;
- row actions and clickable states;
- tenant, device, production, commercial, alert and governance table refinements;
- final standalone-row and button-row compatibility rules whose cascade position is significant.

## Validation

- Existing source HTML plus synthetic standalone/button table rows were checked at 1440 px, 1000 px and 700 px.
- 2,496 computed CSS values were compared with v96.
- Computed-style differences: `0`.
- All 172 generated runtime files remain present; only `assets/css/styles.css` changes.
- CSS rules decrease from 3,061 to 3,058.
- CSS declarations decrease from 9,047 to 9,042.
- Generated CSS decreases from 403,867 to 403,803 bytes.

`npm run verify` now validates both table modules, their manifest order and ownership of the shared properties.
