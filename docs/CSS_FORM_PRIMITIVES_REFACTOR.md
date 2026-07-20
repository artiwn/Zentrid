# Shared form primitives refactor

## Scope

This patch centralizes only the stable Zentrid form baseline. It does not change page-specific field grids, responsive columns, conditional fields, modal layouts or contextual focus colors.

The shared source is:

```text
assets/css/src/components/form-primitives.css
```

It owns:

- toolbar inputs and selects;
- controls nested directly in labels;
- the global textarea baseline;
- `.form-grid`;
- the base label typography;
- `.full` field spanning;
- `label.check` and its checkbox sizing.

## Operational form deduplication

Incident form controls and Work Order filter controls used the same nine declarations. They now share one grouped rule in `70-incidents-work-orders-sop.css`. Their grid layouts and labels remain separate.

## Intentionally separate

The following remain in their owning page layers because they differ in dimensions, colors, typography or focus behavior:

- Client Registry forms;
- Asset/Vendor wizard forms;
- Tenant and Integration setup forms;
- CPA assignment forms;
- editing grids;
- Commercial modal forms;
- Incident labels and layout;
- Work Order layout;
- SOP forms;
- Login form.

## Verification

The CSS source check enforces ownership of the shared primitive properties. Responsive toolbar width overrides remain allowed.

A cascade comparison covered 50 form elements at 1440 px, 1000 px and 700 px. It compared 1,656 winning CSS values and found no differences.

The generated stylesheet changed only through consolidation:

```text
v97: 12,935 lines / 403,803 bytes / 3,058 rules / 9,042 declarations
v98: 12,926 lines / 403,705 bytes / 3,057 rules / 9,033 declarations
```
