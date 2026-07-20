# Repository cleanup

The GitHub-ready cleanup removed only files confirmed to be outside the active application graph:

- 14 browser TypeScript files with no source HTML script reference;
- 7 historical normalization report JSON files never loaded at runtime;
- the obsolete `tsconfig.browser.build.json` configuration;
- generated `dist/` output;
- superseded patch-history notes.

Current architecture, CI, CSS and Vercel documentation remains under `docs/`.

Pages with uncertain product status were intentionally preserved, including the legacy audit route, root client-onboarding route, revenue analytics, tariff management and vendor API console. They should be handled only in a separate route/navigation review.

`scripts/check-runtime-references.js` now prevents new unused classic browser runtime files from entering the repository unnoticed.
