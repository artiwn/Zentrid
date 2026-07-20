# Performance & Runtime Stability v132

Zentrid v132 adds a shared browser runtime coordinator without changing backend endpoints or visible product workflows.

## Runtime scheduling

`assets/js/runtime-stability.ts` centralizes keyed debounce, animation-frame batching, idle work and page lifecycle cleanup. Registry searches use one shared 220 ms debounce rather than independent unmanaged timers.

## DOM render stability

High-frequency registry renders use `FleetRuntimeStability.replaceHtml(...)`. It preserves container scroll, restorable focus/selection and expanded UI state where an element has a stable identity.

## Observer lifecycle

Global UX and responsive-accessibility mutation observers batch all DOM changes into a single animation frame. Both observers disconnect on `pagehide` through the shared cleanup registry.

## Request lifecycle

The repository coordinator exposes `cancelAll()` and aborts all active grouped requests when the page is left. Lazy detail tab observer state is also disposed on page exit.

## Diagnostics

`FleetRuntimeStability.snapshot()` reports active timers, animation frames, idle jobs, cleanup registrations, detected long tasks and aggregate long-task duration.

Run:

```bash
npm run check:performance-runtime-stability
npm run verify
npm run verify:vercel
```
