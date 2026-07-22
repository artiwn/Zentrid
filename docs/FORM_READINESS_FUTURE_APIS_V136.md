# Form Readiness for Future APIs v136

Zentrid forms now expose a declarative contract layer without introducing unconfirmed backend requests.

## Runtime

`assets/js/form-readiness.ts` enhances forms marked with `data-zentrid-form-readiness` and provides:

- dirty-state tracking and `beforeunload` protection;
- explicit `api`, `local`, `unavailable`, and `readonly` modes;
- DTO serialization with nested keys and type coercion;
- nullable/omit/empty policies;
- enum validation;
- file metadata separation;
- validation summary;
- safe DTO preview with credential redaction;
- `markCommitted()` after a successful save;
- runtime diagnostics through `ZentridFormReadiness.snapshot()`.

## Declarative attributes

```html
<form
  data-zentrid-form-readiness="unavailable"
  data-zentrid-form-contract="ClientUpdateDraft"
  data-zentrid-form-endpoint=""
  data-zentrid-form-method="PATCH"
  data-zentrid-form-api-note="Client update endpoint is not available.">
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
ZentridFormReadiness.serialize(form)
ZentridFormReadiness.validate(form)
ZentridFormReadiness.updatePreview(form)
ZentridFormReadiness.isDirty(form)
ZentridFormReadiness.markCommitted(form)
ZentridFormReadiness.setMode(form, 'unavailable', 'Endpoint not confirmed')
ZentridFormReadiness.snapshot()
```

## Verification

```bash
npm run check:form-readiness-future-apis
npm run verify
npm run verify:vercel
```
