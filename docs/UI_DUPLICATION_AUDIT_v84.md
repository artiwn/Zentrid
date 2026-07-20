> Historical audit: this report describes the v84 source tree. Confirmed unused runtime files identified here were removed in the GitHub cleanup version.

# Zentrid UI Duplication Audit — v84

## 1. Scope

This audit was performed against `Zentrid-API-main-ts-dev-windows-v84` without changing application code, HTML, CSS, TypeScript, API behavior, or generated runtime files.

Reviewed:

- `assets/css/styles.css`
- 72 source HTML files
- 109 TypeScript source files
- page render templates, class combinations, shared utilities, and build structure

The audit used static analysis. Any “unused” selector finding must be verified in the browser because some classes may be generated dynamically.

---

## 2. Executive conclusion

Zentrid already has a reusable UI foundation:

- `.glass-card`
- `.panel`
- `.data-table`, `.data-head`, `.data-row`
- `.primary-action`, `.secondary-action`, `.danger-action`
- `.badge`
- `.modal`, `.modal-card`
- `.detail-drawer`
- `.info-grid`
- `.kpi-card`

The main problem is not the absence of shared classes. The problem is that later page patches repeatedly redefine the same primitives and recreate nearly identical component-specific classes.

The safest direction is therefore:

1. consolidate existing primitives;
2. split CSS into maintainable source layers while continuing to emit one `styles.css`;
3. retain page-specific classes only for genuinely unique layout rules;
4. introduce small TypeScript render helpers;
5. only then consider ES modules or a bundler.

A full ES-module migration is not required for this cleanup and would add unnecessary runtime risk.

---

## 3. Measured state

| Area | Result |
|---|---:|
| Main CSS size | 13,032 lines / 407,266 bytes |
| Parsed CSS rules | 3,084 |
| Unique CSS class selectors | 1,136 |
| Exact duplicate declaration groups | 101 |
| Selectors defined repeatedly in the same context | 190 groups |
| Source HTML files | 72 |
| TypeScript source files | 109 |
| Static unused CSS-class candidates | 234 — do not delete automatically |
| Placeholder page scripts using the same template | 15 |
| HTML files sharing the standard application shell | 69 |
| Normalized HTML shell variants | 11 |

The CSS contains 593 distinct literal color spellings. Many are visually identical but differ only in spacing, for example:

- `rgba(148,163,184,.14)`
- `rgba(148, 163, 184, .14)`

Frequently repeated dimensions:

- gaps: `10px` 133 times, `12px` 123 times, `8px` 78 times;
- radii: `18px` 73 times, `16px` 59 times, `14px` 56 times, `12px` 37 times;
- surface background `rgba(255,255,255,.035)` appears 57 times as a declaration value.

This confirms that spacing, radius, surface, border, and text tokens can substantially reduce repetition.

---

## 4. High-confidence CSS consolidation candidates

### 4.1 Buttons and actions — highest priority

The global `.primary-action` selector is defined four times, around lines 326, 371, 904, and 9827. Each later definition changes the global result.

Several action containers have identical or almost identical layout declarations:

- `.toolbar`
- `.integration-page-actions`
- `.inline-actions`
- `.hero-actions`
- `.page-actions`
- `.commercial-toolbar-v78`
- `.section-actions-v28`
- `.hero-actions-v19`
- `.rbac-head-actions`
- `.billing-inline-actions`
- `.payment-actions`

Recommended model:

```css
.ui-actions { display: flex; align-items: center; gap: var(--space-10); flex-wrap: wrap; }
.ui-actions--end { justify-content: flex-end; }

.ui-button { /* shared shape, typography and interaction */ }
.ui-button--primary { /* primary tone only */ }
.ui-button--secondary { /* secondary tone only */ }
.ui-button--danger { /* danger tone only */ }
.ui-button--sm { /* compact sizing only */ }
```

Keep semantic classes such as `.payment-actions` only when they have page-specific positioning.

Risk if left unchanged: a late page patch can restyle primary buttons across unrelated pages.

---

### 4.2 Data tables — highest priority

The project already correctly separates common table structure from page-specific columns:

- `.data-table`
- `.data-head`
- `.data-row`

However, `.data-table` is globally redefined four times, around lines 360, 1090, 9249, and 9345. Later definitions introduce `!important` to restore earlier behavior.

Recommended shared responsibilities:

```css
.ui-table                 /* container, scrolling and row gap */
.ui-table__head           /* header typography */
.ui-table__row            /* common row surface and spacing */
.ui-table--compact        /* compact density */
.ui-table--clickable      /* cursor and hover */
.ui-table--stack-mobile   /* optional responsive behavior */
```

Page-specific classes must continue to own only `grid-template-columns`, for example:

```css
.clients-table .ui-table__head,
.clients-table .ui-table__row {
  grid-template-columns: ...;
}
```

Do **not** create one universal column definition. Zentrid tables represent different data models and need independent column layouts.

Specific duplication found:

- production tenant/client/plant table column rules are repeated 4–5 times in the same stylesheet;
- `.tenant-document-table` row definitions occur three times;
- `.wizard-contact-table` row definitions occur three times;
- governance and commercial tables contain exact matching cell-containment rules;
- many page classes repeat `display:grid`, `align-items:center`, `gap:12px`, `min-width:0`, and text overflow handling.

Expected benefit: the largest CSS reduction with low markup risk.

---

### 4.3 Surface cards and panels — high priority

Current reusable foundations:

- `.glass-card`
- `.panel`
- `.module-card`
- `.kpi-card`
- `.info-card`

Repeated page variants include:

- `.client-side-card-v17`
- `.plant-side-card-v17`
- `.production-side-card-v92`
- `.client-main-card-v17`
- `.plant-main-card-v17`
- `.incident-main-card-v92`
- `.billing-main-card`
- `.empty-state-card`
- `.normalization-empty-grid article`

Several groups have exactly identical declarations. For example, client/plant side cards and the production side card share the same six-rule foundation.

Recommended model:

```css
.ui-surface
.ui-surface--glass
.ui-surface--panel
.ui-surface--sidebar
.ui-surface--interactive
.ui-surface--empty
```

Do not merge every card into one class. A KPI card, side-navigation card, empty-state card, and information card have different semantics. Share only surface, border, radius, padding, and interaction primitives.

---

### 4.4 Section headings and action headers — high priority

Exact or near-exact declarations were found among:

- `.section-title-v17`
- `.incident-head`
- `.workorder-detail-panel .panel-head`
- `.chart-card-head-v20`
- `.client-bank-head`
- `.client-bank-actions`

Recommended model:

```css
.ui-section-head
.ui-section-head__copy
.ui-section-head__actions
.ui-section-head--compact
```

This is a low-risk first component because its behavior is mostly flex layout and text containment.

---

### 4.5 Form grids and fields — high priority

Repeated structures:

- `.client-form-grid.two-col` appears 27 times across 7 files;
- `.modal-form-grid.two-col` appears 18 times;
- `.info-grid` appears 77 times across 14 TypeScript files;
- telemetry labels and client-form labels have an exact seven-declaration match;
- incident inputs/selects/textareas and work-order filters share an exact nine-declaration style block.

Recommended model:

```css
.ui-form-grid
.ui-form-grid--2
.ui-form-grid--3
.ui-field
.ui-field--full
.ui-field-control
.ui-info-grid
.ui-info-grid--compact
```

Keep business-specific field wrappers only when conditional behavior or a unique layout requires them.

---

### 4.6 Drawers and modals — medium/high priority

`.detail-drawer` has two global definitions around lines 317 and 396 with different padding, background, height, z-index, transition, and overflow behavior.

Shared markup is already common:

- `.drawer-close` in 17 files;
- `.drawer-actions` in 12 files;
- `.drawer-body` in 10 files;
- `.modal-close` in 9 files;
- `.modal-actions` in 6 files;
- commercial modal head/body/footer in 6 files.

Recommended model:

```css
.ui-overlay
.ui-modal
.ui-modal__head
.ui-modal__body
.ui-modal__footer
.ui-drawer
.ui-drawer__head
.ui-drawer__body
.ui-drawer__footer
```

Modal and drawer should share buttons, typography, and surface tokens, but they should remain separate components because their positioning and opening behavior differ.

---

### 4.7 Badges and status tones — medium priority

The `.badge` foundation is used broadly, but TypeScript contains at least 12 separate functions named `badge`, plus other inline badge templates.

Tone aliases already overlap:

- success/good;
- warning/warn;
- danger/bad.

Recommended CSS:

```css
.ui-badge
.ui-badge--success
.ui-badge--warning
.ui-badge--danger
.ui-badge--neutral
```

Recommended TypeScript helper:

```ts
renderStatusBadge({ label, tone })
```

This removes duplicated tone-selection logic and ensures all statuses use the same escaping and visual mapping.

---

### 4.8 Empty states and placeholder cards — medium priority

Repeated structures include:

- `.placeholder-grid`
- `.normalization-empty-grid`
- `.empty-state-card`
- `.empty-state-panel`
- compact placeholder cards in RBAC and normalization workspaces.

Recommended model:

```css
.ui-empty-state
.ui-empty-state__grid
.ui-empty-state__item
```

The content remains page-specific; only presentation should be shared.

---

## 5. High-confidence TypeScript duplication

### 5.1 Exact duplicate files

These files are byte-for-byte identical:

- `assets/js/page-scripts/audit-center.ts`
- `assets/js/page-scripts/audit.ts`

Recommended action: use one shared renderer or make both tiny entry files call one implementation.

These two files are also identical, but contain only two calls:

- `assets/js/page-scripts/groups.ts`
- `assets/js/page-scripts/plants.ts`

They currently both execute:

```ts
ZentridLayout.mount(renderPlants());
wirePlants();
```

This may be intentional routing reuse, but naming should be clarified before consolidation.

### 5.2 Probable legacy root duplicates

Near-duplicate pairs:

- `payment_script.ts` and `assets/js/page-scripts/payment-settings.ts`
  - approximately 98.5% containment similarity;
- `tmp_billing_script.ts` and `assets/js/page-scripts/billing-payments.ts`
  - approximately 99.1% containment similarity.

The root generated files are compiled and checked, but no source HTML file references `payment_script.js` or `tmp_billing_script.js`.

Recommended action: mark these as legacy candidates, verify no external host references them, then remove them in a separate patch. Do not remove them during CSS cleanup.

### 5.3 Placeholder page scripts

Fifteen page scripts repeat the same complete placeholder template and differ mainly by eyebrow and title:

- admin-console
- analytics
- asset-registry
- asset-topology
- client-onboarding
- command-center
- crm-service
- finance
- platform-operations
- reports
- service-desk
- settings
- tasks-work-orders
- telemetry
- tenant-provisioning

Recommended helper:

```ts
mountPlaceholderPage({ eyebrow, title })
```

This is one of the safest TypeScript reductions because the repeated content is exact.

### 5.4 Repeated rendering utilities

Repeated utility concepts found across files:

- `badge` in 12 files;
- HTML escaping helpers such as `esc` in at least 5 files;
- modal open/close logic in at least 6 files;
- money formatting in at least 6 files;
- table construction helpers in several commercial/normalization files;
- repeated `<div><strong>…</strong><small>…</small></div>` table cell markup across 11 files.

Recommended shared globals before ES modules:

```ts
ZentridUI.escapeHtml(...)
ZentridUI.statusBadge(...)
ZentridUI.infoCell(...)
ZentridUI.money(...)
ZentridUI.openModal(...)
ZentridUI.closeModal(...)
```

These can be exposed through one classic browser script and loaded before page scripts, preserving the current runtime architecture.

---

## 6. HTML shell duplication

Sixty-nine page HTML files load the same core scripts:

- `data.js`
- `api-client.js`
- `platform-api.js`
- `auth-guard.js`
- `layout.js`
- `ui-normalization-binding.js`

Sixty-eight also load `zentrid-normalization.js`.

After normalizing page title and script paths, the 72 source HTML files reduce to only 11 structural shell variants. The three largest variants contain:

- 36 pages;
- 14 pages;
- 9 pages.

Recommended future approach:

- maintain a page manifest containing title and page scripts;
- generate the static HTML files during build;
- continue serving ordinary static HTML from `dist`.

This gives module-like maintainability without changing browser routing or requiring a framework.

Example manifest concept:

```ts
{
  route: "pages/clients.html",
  title: "Zentrid — Clients",
  scripts: ["client-hierarchy", "page-scripts/clients", "live-api-ui"]
}
```

This should be implemented only after CSS primitives are stable.

---

## 7. CSS source organization recommendation

Continue producing one runtime `assets/css/styles.css`, but maintain it from smaller source files:

```text
assets/css/src/
  00-tokens.css
  01-reset.css
  02-shell.css
  03-layout.css
  components/
    actions.css
    badges.css
    cards.css
    tables.css
    forms.css
    modals.css
    drawers.css
    tabs.css
    empty-states.css
  pages/
    clients.css
    tenants.css
    plants.css
    devices.css
    alerts.css
    integrations.css
    commercial.css
    governance.css
```

A small build script can concatenate them in a deterministic order into the existing `styles.css`. No HTML link changes would be required.

Important: first split the existing rules without changing selectors or order. Consolidation should happen only after the split is proven byte-equivalent or visually equivalent.

---

## 8. What must remain page-specific

Do not merge these merely because they look similar:

- table column definitions;
- device-type detail layouts;
- plant/client/tenant domain-specific state classes;
- conditional wizard fields;
- alert severity and commercial-state business mapping;
- page-specific sticky positioning;
- unique responsive breakpoints required by large tables;
- JS hooks used by event delegation or `querySelector`.

A class may simultaneously be a visual class and a JavaScript hook. Before renaming or deleting a class, search both TypeScript and HTML.

---

## 9. Deletion warnings

Static scanning found 234 CSS classes with no direct literal source reference. They are only **candidates**, not confirmed dead code.

Possible false positives:

- classes created through string interpolation;
- classes assembled through variables;
- classes applied through `classList` with non-literal values;
- classes expected by external API data;
- historical pages loaded outside the current standard shell.

Do not remove these during component consolidation. Dead-code deletion should be a separate stage supported by browser coverage.

---

## 10. Recommended implementation sequence

### Patch 1 — CSS architecture only

- add CSS tokens for repeated spacing, radius, surface, border, and typography values;
- split `styles.css` into ordered source files;
- concatenate back to the same runtime path;
- preserve selector order and visual output;
- add a CSS build validation script.

### Patch 2 — actions and section headers

- consolidate action containers;
- stabilize primary/secondary/danger button definitions;
- migrate a small set of pages first;
- run `verify` and browser smoke.

### Patch 3 — tables

- consolidate container/head/row/cell behavior;
- retain page-specific column classes;
- start with Clients, Tenants, Plants, Devices, Alerts, and Integrations.

### Patch 4 — cards, forms, drawers, and modals

- introduce surface and layout primitives;
- migrate in small route groups.

### Patch 5 — TypeScript render helpers

- status badge;
- HTML escaping;
- info cell;
- action group;
- empty state;
- modal controls.

### Patch 6 — duplicate entry files and HTML generation

- consolidate exact page-script duplicates;
- remove verified legacy root scripts;
- introduce page manifest and HTML generation.

### Patch 7 — optional ES modules

Reassess only after the previous stages. ES modules should be adopted only if the remaining dependency graph justifies the migration.

---

## 11. Recommended immediate next step

Start with **Patch 1: CSS architecture only**.

This patch should not rename classes or change declarations. Its purpose is to turn the 13,032-line monolith into ordered source layers while continuing to generate the same `assets/css/styles.css`. Once the split is stable, component consolidation becomes much safer because every shared primitive and every page-specific override has a known location.
