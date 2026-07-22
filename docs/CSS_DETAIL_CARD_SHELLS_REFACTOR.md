# Shared detail card shells refactor — v93

This patch consolidates the repeated outer shell used by Zentrid detail workspaces without renaming HTML classes or changing TypeScript render functions.

## Shared module

`assets/css/src/components/detail-card-shells.css` owns the common base for:

- Client, Plant and Production side navigation cards;
- their section headings;
- their navigation buttons and active state;
- Client, Plant and Production main detail cards;
- the shared responsive side-navigation transformation below 1180px.

The module loads after `10-client-plant-device.css` and before `11-client-plant-device-details.css`. This lets later page layers retain their existing Plant compact sizing, Production hover behavior, Incident/Work Order refinements and mobile exceptions.

## Preserved page-specific behavior

The refactor intentionally leaves these rules in their page layers:

- Plant side navigation typography and larger buttons;
- Client navigation icon layout;
- Production hover state and scroll behavior;
- Production normalization overrides;
- Incident, Work Order and SOP side navigation layouts;
- page-specific main-card backgrounds, padding and overflow fixes.

## Verification

A cascade regression check compared v92 and v93 for Client, Plant, Production, Incident and Work Order card contexts at widths 1440px, 1000px and 700px. All winning declaration values matched.

The patch removes eight repeated rule blocks and 29 duplicate declarations. HTML, TypeScript, JSON and runtime routes are unchanged.
