# API Field Mapping Audit — v128

Zentrid now keeps an explicit field-level mapping manifest for the six live entities used by Global Admin:

- Clients
- Tenants
- Plants
- Devices
- Alerts
- Integrations

## Mapping manifest

Each canonical field records:

```ts
{
  canonicalField: 'ratedPowerKw',
  aliases: ['vendorExtensions.ratedPowerKw', 'ratedPowerKw'],
  uiTargets: ['Device Registry capacity', 'Device Detail rated power'],
  format: 'power',
  fallback: '—'
}
```

The manifest is available at runtime:

```ts
ZentridAPIContracts.fieldAudit.manifest()
ZentridAPIContracts.fieldAudit.manifest('devices')
```

## Runtime audit

Every mapped backend record receives a `fieldAudit` object with:

```text
mappedFields
fallbackFields
missingExpectedFields
unmappedFields
sourceByCanonical
rawFieldCount
```

Known aliases are recorded in `sourceByCanonical`, so Zentrid can show whether a value came from a top-level DTO field or from `vendorExtensions`.

New fields returned by backend but not represented in the manifest are reported as `unmappedFields`. They are not deleted; the original payload remains available in `raw`.

Required canonical fields that cannot be resolved are reported as `missingExpectedFields`. Existing safe UI fallbacks continue to work.

## API Console

The Platform API Console now runs the field audit after safe endpoint diagnostics. It displays:

- records audited;
- mapped canonical fields;
- fallback usage;
- missing expected fields;
- unmapped source fields;
- entity-level totals;
- canonical field → backend alias → UI target mapping tables.

This allows frontend verification without changing backend behavior or invoking unsafe write endpoints.

## Mapping corrections included in v128

The audit confirmed and formalized the current DTO names, including:

- Client: `managingTenant`, `accountActivation`, `phoneNumber1`, `username`, document flags;
- Tenant: `tenantCode`, `tenantName`, `legalName`, `tenantStatus`, `tenantType`;
- Plant: `recordStatus`, `plantTimeZone`, `currentPowerKw`, `installedPowerKw`, `dataQualityStatus`;
- Device: `vendorModel`, `productModel`, `ratedPowerKw`, `firmwareVersion`, `parentDeviceId`, `dataFreshness`;
- Alert: `alarmCode`, `alarmType`, `reason`, `solution`, `acknowledgedAtUtc`;
- Integration: registry fields plus `plantsWithoutDataCount`, `stalePlantsCount`, `errorRatePct`, and `activeAlertsCount`.

## Verification

```bash
npm run check:api-field-mapping-audit
npm run verify
npm run verify:vercel
```

The field-audit regression test uses representative current backend DTOs and verifies that known response fields produce no unmapped-field warnings. It also injects a new unknown backend field to confirm that schema drift is detected.
