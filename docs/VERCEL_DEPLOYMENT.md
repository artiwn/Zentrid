# Zentrid deployment: GitHub → Vercel

This project supports two independent runtime modes:

- **Local development:** `npm run dev` builds the complete application and starts `dist/proxy-server.js` on port `5050`.
- **Vercel:** `npm run build:vercel` creates a static `dist/` without the local Express proxy. `vercel.json` forwards Zentrid API requests to the existing Auth and Data API origins.

The UI, HTML paths and browser API URLs stay unchanged in both modes.

## 1. Validate before publishing

```powershell
npm.cmd run check:registry
npm.cmd ci --registry=https://registry.npmjs.org/
npm.cmd run verify
npm.cmd run smoke:browser
npm.cmd run verify:vercel
```

Expected Vercel build summary:

```text
Vercel configuration OK
Generated vercel application OK: 97 emitted runtime scripts, 76 HTML files
JS syntax OK: 93 files
```

## 2. Push the project to GitHub

Create an empty repository on GitHub. Do not initialize it with another README or `.gitignore`.

Run these commands from the folder containing `package.json`:

```powershell
git init
git add .
git commit -m "Prepare Zentrid for GitHub and Vercel"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USER>/<YOUR_REPOSITORY>.git
git push -u origin main
```

Replace the URL with the URL of your empty GitHub repository.

The following folders are intentionally not committed:

```text
node_modules/
dist/
.ts-build/
```

Vercel and local commands generate `dist/` from source.

## 3. Import the repository into Vercel

1. Open the Vercel dashboard.
2. Select **Add New → Project**.
3. Import the GitHub repository.
4. Keep **Root Directory** set to the repository root.
5. Do not override the build fields unless Vercel shows different values.
6. Deploy.

The repository already contains:

```text
Framework Preset: Other
Install Command: node scripts/check-package-registry.js && npm ci --registry=https://registry.npmjs.org/
Build Command: npm run build:vercel
Output Directory: dist
Node.js: 24.x-compatible
```

No Vercel environment variables are required for the current public Zentrid API origins.

## 4. API routing on Vercel

`vercel.json` applies these external rewrites in this exact order:

```text
/api/Auth/*   → https://fleetosauth.unisys.am/api/Auth/*
/.well-known/* → https://fleetosauth.unisys.am/.well-known/*
/api/*        → https://fleetosapi.unisys.am/api/*
```

The browser continues to call same-origin URLs such as `/api/Auth/login`. Vercel performs the external request as a reverse proxy.

API rewrite caching is explicitly disabled and API responses use `Cache-Control: no-store` so authentication and tenant-specific data are not cached by the Vercel CDN.

## 5. Validate the deployed URL

Check these routes after the deployment finishes:

```text
https://<PROJECT>.vercel.app/login.html
https://<PROJECT>.vercel.app/
https://<PROJECT>.vercel.app/pages/clients.html
https://<PROJECT>.vercel.app/pages/plants.html
```

Then sign in and verify that Overview, Clients, Tenants, Plants and Integrations receive API data.

## 6. Automatic deployments

After GitHub is connected:

- every push to `main` creates a production deployment according to the Vercel project settings;
- pull requests and other branches can create preview deployments;
- GitHub Actions independently checks Node 22/24, the local build, the Vercel static build and the Windows browser smoke test.

## 7. Rollback

If a deployment introduces a problem, use Vercel's deployment history to promote a previous successful deployment. The deployment configuration keeps application routes and API behavior unchanged. Generated output is rebuilt from the clean TypeScript source tree.

## Package registry safety

The repository uses a pre-install registry check. `package-lock.json` must reference only `registry.npmjs.org`, and the Vercel install command passes the public registry explicitly. Deployment therefore does not depend on a hidden `.npmrc` file being present in GitHub.
