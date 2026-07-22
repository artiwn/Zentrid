# Zentrid continuous integration

The project now has an automated GitHub Actions workflow at `.github/workflows/ci.yml`.

## What it checks

- `npm ci` and `npm run verify` on Node.js 22 and Node.js 24.
- Six deterministic browser E2E smoke scenarios on a Windows runner with Microsoft Edge or Google Chrome.
- Full strict TypeScript, source-of-truth rules, browser/server build boundaries, generated asset references, and JavaScript syntax.

## Local equivalent

```powershell
npm.cmd ci
npm.cmd run verify
npm.cmd run e2e:browser
```

## Supported runtime

`package.json` requires Node.js 22 through 24 and npm 10 or newer. `.nvmrc` and `.node-version` select Node.js 24 for local version managers.

The workflow does not deploy Zentrid and does not change application data. It only builds and verifies the existing project.

## Vercel deployment verification

The CI workflow now includes a Node 24 job that runs `npm run verify:vercel`. It validates `vercel.json`, produces the static Vercel `dist/`, confirms that the local Express proxy is not published, and checks all generated JavaScript. The Windows browser E2E job waits for both the regular TypeScript verification and the Vercel build verification. API calls are intercepted with read-only synthetic fixtures.
