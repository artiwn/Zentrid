# Zentrid v140 — Pagination Collision & Edit Restoration

## Pagination
The Rows selector, previous navigation, page jump and next navigation are isolated into independent flex groups. Pagination buttons are forced back into normal flow so generic button positioning cannot overlap the select.

## Editing
Live Client, Tenant, Plant and Integration records can enter the existing local edit workflow for editable sections. Saving creates a clearly marked browser-only override and does not send an unsupported backend update request. Archived records and operational read-only tabs remain protected.

## Regression
Run `npm run check:pagination-edit-restoration`.
