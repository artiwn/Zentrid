# KPI / metric card refactor

## Scope

The shared KPI content rules were previously split across foundation, platform patch and device/alert patch layers. They are now owned by two ordered components:

- `assets/css/src/components/metric-card-content.css` — flex layout, label/value/supporting-text typography and stacking;
- `assets/css/src/components/metric-card-overflow.css` — direct-child ellipsis, nowrap and two-line supporting-text truncation.

The modules intentionally occupy different manifest positions. The content module loads before platform-specific patches, while the overflow module stays after `30-devices-alerts-and-groups.css`. This preserves Alert Detail and other scoped overrides exactly.

## Validation

- 99 KPI element contexts were checked at 1440 px, 1000 px and 700 px.
- 2,772 computed CSS values were compared with the previous version.
- Differences: 0.
- All generated runtime files remain byte-identical except `assets/css/styles.css`.
