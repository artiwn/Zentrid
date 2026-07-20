# Zentrid build pipeline

Zentrid keeps browser runtime and the local Node proxy as separate targets.

## TypeScript

- `npm run typecheck` validates all TypeScript with the authoritative strict `tsconfig.json`.
- `npm run build:browser` emits 93 classic browser scripts through the TypeScript Compiler API.
- `npm run build:server` compiles only `proxy-server.ts` as Node CommonJS.
- `npm run check:runtime-references` rejects browser runtime files that are not connected to a source HTML page.
- `npm run check:build-boundaries` prevents Node dependencies from leaking into browser output.

The browser compiler intentionally emits classic scripts because existing pages rely on ordered global `<script>` tags. Type-only `export {};` scope markers are removed before emit. The local proxy remains a separate Node artifact.

## Static assets

`npm run copy:static` copies source HTML and runtime data to `dist/`. TypeScript, tooling JavaScript, CSS source fragments and backup files are not copied as public assets.

## CSS

`assets/css/src/manifest.json` is the ordered stylesheet source of truth. `npm run build:css` concatenates its fragments into `dist/assets/css/styles.css`. Source fragments are not published inside `dist/`.

## Local build

```powershell
npm.cmd run build
```

This produces 97 browser scripts, `proxy-server.js`, 76 HTML pages and the generated stylesheet.

## Vercel build

```powershell
npm.cmd run build:vercel
```

This produces the static frontend only. `proxy-server.js` is intentionally excluded because Vercel API rewrites replace the local Express proxy.

## Verification

```powershell
npm.cmd run verify
npm.cmd run verify:vercel
```

Both commands recreate `dist/` from source and validate generated references and JavaScript syntax.
