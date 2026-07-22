# Shared card surfaces refactor — v94

## Scope

`assets/css/src/components/card-surfaces.css` now owns the common base declarations used by:

- `.glass-card`;
- `.panel`;
- `.panel-lite`;
- `.kpi-card`;
- `.module-card`.

Only shared surface and shell properties were consolidated: padding, base radius, positioning/overflow, border, shadow, background and minimum height. Page-specific layouts, hover behavior, compact variants, telemetry overrides, incident styles and detail-page overrides remain in their original source files.

## Cascade safety

The module loads immediately after `00-foundation.css` and before `05-platform-core-patches.css`. This preserves later overrides such as the interactive KPI button border reset, compact telemetry cards, detail KPI dimensions, Client/Plant panel backgrounds and incident module borders.

A cascade regression comparison checked base, combined and scoped card contexts at 1440px, 1000px and 700px. The winning values for the affected surface and layout properties matched v93 with zero differences.

## Guardrail

`scripts/check-css-source.js` validates the component position in `manifest.json`, confirms that every owned base property exists, and rejects the same base properties when they are reintroduced on the corresponding global selectors outside the shared module. Intentional scoped page overrides remain allowed.

## Runtime impact

No HTML, TypeScript, API route or application data changed. The generated application differs from v93 only in `assets/css/styles.css`.
