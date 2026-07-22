# Shared badge primitives refactor

## Scope

This patch centralizes only the existing Zentrid badge shell and semantic tones. It does not add new colors, rename HTML classes or change page-specific sizing and spacing.

The shared sources are:

```text
assets/css/src/components/badge-base.css
assets/css/src/components/badge-tones.css
```

## Ownership

`badge-base.css` owns:

- the global `.badge` flex shell;
- minimum width, padding, radius and typography;
- the base translucent surface;
- spacing for supporting `small` and `.muted` siblings.

`badge-tones.css` owns the existing aliases:

- `.badge.success` and `.badge.good`;
- `.badge.warning` and `.badge.warn`;
- `.badge.danger` and `.badge.bad`;
- `.badge.muted`.

The tone module intentionally loads after `05-platform-core-patches.css`, preserving the final values of the old patch cascade. The base module loads immediately after `00-foundation.css`.

## Intentionally unchanged

The source currently uses `.badge.info`, `.badge.neutral` and `.badge.ok`, but v99 did not define distinct global tone colors for these classes. This refactor preserves that base-only appearance instead of introducing a visual change.

Context-specific rules remain page-owned, including:

- table badge width and margins;
- Incident and Work Order badge sizing;
- Payment and RBAC badge spacing;
- wizard nowrap behavior;
- archive and integration alignment.

## Deduplication

The original foundation contained early success/warning/danger borders, followed by later platform rules that replaced them with the final border and background values. The early overwritten declarations were removed.

```text
Global badge rules:        9 → 6
Global badge declarations: 31 → 25
Generated CSS bytes:       403,373 → 403,313
```

## Verification

The CSS source check now enforces module order, required properties and exclusive ownership of global badge declarations.

A static cascade comparison covered base, semantic aliases, supporting siblings and scoped table/detail contexts at 1440 px, 1000 px and 700 px. It compared 1,682 winning declaration values and found no differences.
