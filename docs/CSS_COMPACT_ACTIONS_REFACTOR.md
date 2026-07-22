# Compact actions refactor — v90

This patch starts the real CSS consolidation phase without changing HTML classes or page structure.

## Shared module

`assets/css/src/components/compact-actions.css` is the source of truth for:

- `.small-btn`;
- `.small-btn:hover`;
- `.small-btn:active`;
- `.small-btn.primary`;
- `.small-btn.ghost`;
- `.small-btn.success`.

The manifest places the module at the exact location previously occupied by these rules, preserving cascade order.

## Removed duplication

Integration Detail previously repeated the complete compact-button implementation under `.detail-tab-actions .small-btn`. Those declarations were identical to the shared component and were removed. Only context-specific primary, ghost and success hover refinements remain.

Two additional exact legacy duplicates were removed:

- the later global `.hero-actions` declaration;
- an earlier mobile Platform Audit table/action block fully superseded by the later v105 block.

## Build protection

CSS discovery now scans nested folders recursively. Every component CSS file must be listed in `assets/css/src/manifest.json`, and unlisted nested modules fail `npm run verify`.

## Result

- 8 redundant rule blocks removed;
- 56 CSS lines removed;
- 1,842 generated CSS bytes removed;
- no HTML or TypeScript runtime changes.
