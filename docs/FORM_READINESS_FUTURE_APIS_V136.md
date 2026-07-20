# Form Readiness for Future APIs v136

Zentrid forms now expose a declarative contract layer without introducing unconfirmed backend requests.

## Runtime

`assets/js/form-readiness.ts` enhances forms marked with `data-fleet-form-readiness` and provides:

- dirty-state tracking and `beforeunload` protection;
- explicit `api`, `local`, `unavailable`, and `readonly` modes;
- DTO serialization with nested keys and type coercion;
- nullable/omit/empty policies;
- enum validation;
- file metadata separation;
- validation summary;
- safe DTO preview with credential redaction;
- `markCommitted()` after a successful save;
- runtime diagnostics through `FleetFormReadiness.snapshot()`.

## Declarative attributes

```html
<form
  data-fleet-form-readiness="unavailable"
  data-fleet-form-contract="ClientUpdateDraft"
  data-fleet-form-endpoint=""
  data-fleet-form-method="PATCH"
  data-fleet-form-api-note="Client update endpoint is not available.">
```

`unavailable` disables submit controls but keeps validation and DTO preview available. Existing Zentrid create wizards remain in `local` mode, so their current localStorage behavior is preserved.

Field-level attributes:

```html
<input name="capacityKw" data-dto-type="number">
<input name="expiresAt" data-nullable="true">
<input name="metadata" data-dto-type="json" data-dto-key="extensions.metadata">
<input name="note" data-empty-policy="omit">
<select name="status" data-enum="Draft,Active,Archived"></select>
```

## Public API

```js
FleetFormReadiness.serialize(form)
FleetFormReadiness.validate(form)
FleetFormReadiness.updatePreview(form)
FleetFormReadiness.isDirty(form)
FleetFormReadiness.markCommitted(form)
FleetFormReadiness.setMode(form, 'unavailable', 'Endpoint not confirmed')
FleetFormReadiness.snapshot()
```

## Verification

```bash
npm run check:form-readiness-future-apis
npm run verify
npm run verify:vercel
```
