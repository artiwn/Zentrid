# Plant Wizard UX v114

## Scope

This patch completes the frontend-only Plant create flow without introducing or guessing backend write contracts.

## Unified entry point

Plant Registry, Tenant Detail and Client Detail now open the same vendor-driven Plant wizard. Tenant/client context is carried in the URL and preselected in the wizard. Legacy duplicate builder functions remain dormant for compatibility but are no longer the user entry point.

## UX behavior

- Step-by-step validation and forward-navigation gating.
- Dynamic vendor steps and conditional required fields remain supported.
- Duplicate plant-name prevention against the current local/live registry.
- Inline field errors, accessible validation summary and focus management.
- Completed/error step states and step progress.
- Dirty-form close confirmation, Escape handling and double-submit protection.
- Successful local creation opens Plant Detail with the new record selected.
- API mutations and backend DTO assumptions are unchanged.

## Verification

`npm run check:plant-wizard-ux` is included in `npm run verify`.
