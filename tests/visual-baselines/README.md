# Zentrid visual baselines

Visual baselines are platform-specific because Chromium text rasterization differs between Windows, Linux and macOS.

Create or refresh baselines on the same platform used for comparison:

```bash
npm run visual:update
```

Baselines are stored under `tests/visual-baselines/<platform>/<scenario>/` as a PNG and a JSON layout fingerprint. Normal `npm run visual:browser` always performs responsive overflow and clipping audits. When a matching JSON baseline exists it also compares element geometry with a small tolerance.

CI uploads `artifacts/visual-regression/` for every run, so screenshots and the JSON report can be inspected even before platform baselines are committed.
