# Visual Regression & Responsive Audit v134

Zentrid captures eight critical surfaces at 1440, 1280, 1024, 768 and 390 CSS pixels. The runner uses deterministic API fixtures, a fixed clock, disabled animation and a device scale factor of 1.

Every capture performs automated checks for document-level horizontal overflow, visible elements outside the viewport, unexpected clipped text, undersized mobile controls, narrow UX-state text columns and sidebar/main overlap. It also records a DOM layout fingerprint and a PNG screenshot.

Commands:

```bash
npm run check:visual-responsive-audit
npm run visual:browser
npm run visual:update
```

Use `ZENTRID_VISUAL_SCENARIOS` and `ZENTRID_VISUAL_VIEWPORTS` to run a subset. Set `ZENTRID_VISUAL_REQUIRE_BASELINES=1` when the selected platform must have committed baselines.

Generated review artifacts are written to `artifacts/visual-regression/`. They are intentionally not included in production `dist`.
