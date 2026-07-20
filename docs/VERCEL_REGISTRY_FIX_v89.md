# Vercel registry fix v89

Vercel deployment no longer requires a project `.npmrc` file.

The install step remains explicit:

```text
node scripts/check-package-registry.js && npm ci --registry=https://registry.npmjs.org/
```

`scripts/check-package-registry.js` now validates only `package-lock.json`. This keeps the protection against private/internal registry URLs while allowing deployments from repositories created through interfaces that omit hidden files.
