# Shared modal and drawer shells refactor

## Scope

This patch centralizes only the stable Zentrid overlay and shell baseline. It does not change modal form content, page-specific widths, sticky footers, animations or specialized drawer layouts.

The shared source is:

```text
assets/css/src/components/modal-drawer-shells.css
```

It owns:

- `.modal` and `.modal.open`;
- `.modal-card`;
- `.detail-drawer` and `.detail-drawer.open`;
- `.modal-close` and `.drawer-close`.

## Deduplication

`05-platform-core-patches.css` contained two generations of the global detail drawer shell and two generations of the drawer close control. The later generation supplied the final visual values while the first generation still supplied `bottom` and `overflow`. The shared component preserves the complete winning cascade in one rule.

## Intentionally separate

The following remain in their owning page layers because they have different dimensions, stacking, positioning or interaction behavior:

- CPA assignment modal and backdrop;
- Plant creation modal;
- Connector Operations drawer;
- Commercial drawer;
- Incident and Work Order drawers;
- Audit and RBAC drawers;
- sticky modal/drawer action footers;
- Commercial `.modal-close-btn`.

## Verification

The CSS source check enforces ownership of all global modal/drawer shell properties. Scoped selectors remain allowed.

A cascade comparison covered 28 modal/drawer elements at 1440 px, 1000 px and 700 px. It compared 1,236 winning CSS values and found no differences.

The generated stylesheet changed only through consolidation:

```text
v98: 12,926 lines / 403,705 bytes / 3,057 rules / 9,033 declarations
v99: 12,980 lines / 403,373 bytes / 3,054 rules / 9,011 declarations
```
