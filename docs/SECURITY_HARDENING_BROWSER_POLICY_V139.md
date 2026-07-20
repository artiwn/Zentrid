# Zentrid v139 — Security Hardening & Browser Policy

## Enforced browser policy

Zentrid ships compatible production security headers for Vercel and the local proxy:

- Content-Security-Policy with self-hosted script/style elements
- frame-ancestors none and X-Frame-Options DENY
- object-src none and base-uri self
- same-origin form actions
- strict referrer policy
- no MIME sniffing
- restricted browser permissions
- HTTPS HSTS on Vercel

Inline script elements are prohibited. Legacy dynamic `onclick` and inline style attributes remain explicitly allowed by `script-src-attr` and `style-src-attr` until those prototype renderers are migrated. A stricter report-only policy measures this remaining debt.

## Auth storage

Access token, refresh token, user metadata and token expiry are now tab-scoped in `sessionStorage`. Existing v138 `localStorage` sessions are migrated once and removed from persistent storage. Logout is still synchronized between Zentrid tabs through message-only BroadcastChannel/storage events; token values are never broadcast.

## Navigation hardening

`security-policy.ts` audits initial and dynamically rendered DOM:

- blocks javascript/vbscript/file and HTML data URLs
- blocks cross-origin form actions
- adds `noopener noreferrer` to `_blank` links
- removes the opener from `window.open` results
- hardens password and credential-like inputs
- records CSP violations without including sensitive values

## Diagnostics

`FleetBrowserSecurity.snapshot()` exposes counts and storage key names only. It never reads or exports token values. The snapshot is included in the v138 safe release report.
