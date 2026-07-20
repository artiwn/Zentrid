# Information grids refactor

## Scope

The base `.info-grid` and `.discovery-grid` rules were previously embedded in the platform patch layer, while their overflow behavior was embedded in the device and alert patch layer. They are now owned by two ordered components:

- `assets/css/src/components/information-grid-content.css` — base grid layout, cell surface, label typography and value typography;
- `assets/css/src/components/information-cell-overflow.css` — min-width protection, ellipsis and two-line supporting-text truncation shared with compact placeholder cards.

The modules intentionally occupy different manifest positions. Responsive column changes remain in the original platform patch location, and Client, RBAC, Commercial, Alert and Incident selectors remain in their page layers. This preserves their existing specificity and source-order behavior.

## Validation

- 50 information-grid element contexts were checked at 1440 px, 1000 px and 700 px.
- 1,512 cascaded CSS values were compared with v95.
- Differences: 0.
- CSS rule and declaration counts remain unchanged.
- The generated stylesheet is 110 bytes and 24 lines smaller.
- All generated runtime files remain byte-identical except `assets/css/styles.css`.
