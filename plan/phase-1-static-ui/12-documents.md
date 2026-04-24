# Phase 1 · Step 12 — Documents module ✅ Delivered

Static UI for the central documents vault: list page with filters and bulk
actions, detail drawer with version history & access controls, and an upload
dialog with entity linking.

## Mocks ✅

`frontend/src/mocks/documents.ts` (~530 LOC)

- **Types:** `DocumentType` (13: invoice / po / quotation /
  order_confirmation / delivery_challan / commissioning_report /
  warranty_certificate / test_certificate / datasheet / drawing / contract /
  photo / other), `DocumentEntityType` (8: inquiry / quotation / order /
  dispatch / job / product / customer / general), `DocumentSensitivity`
  (public / internal / confidential), `DocumentVersion`,
  `DocumentAccessRule` (per role: admin / sales / accounts / inventory /
  dispatch / engineer / customer with `canView` + `canDownload`),
  `DocumentActivity`, `DocumentRecord`.
- **Constants:** `DOCUMENT_TYPE_LABEL`, `DOCUMENT_TYPE_TONE`,
  `ENTITY_TYPE_LABEL`, `SENSITIVITY_LABEL`, `SENSITIVITY_TONE`, `ROLE_LABEL`.
- **Helpers:** `defaultAccess(sensitivity)` (confidential → admin+accounts
  only; internal → all except customer with engineer download blocked;
  public → all roles), `documentById`, `documentsForEntity(type, id)`,
  `documentsSummary()` (total / confidential count / total bytes /
  updatedThisWeek), `formatFileSize` (B/KB/MB/GB).
- **14 seed documents** spanning every type and sensitivity level —
  invoice, customer PO, quotation v3 (3 versions), delivery challan,
  commissioning report, warranty + test certificates, datasheet (2
  versions), GA drawing, AMC contract, site photos, customer specs and a
  general GST archive.

## Pages ✅

`frontend/src/pages/documents/DocumentsPage.tsx` (~900 LOC) replaces the
prior placeholder.

### Components

- **`DocumentsPage`** (default export) — list view:
  - 4-card summary strip (total / confidential / storage / updated this
    week).
  - Bulk-select bar that appears when ≥1 row is selected (Bulk download
    toast + Clear).
  - `FilterBar` with full-text search + 4 selects (type / entity type /
    sensitivity / uploader) + Reset button.
  - `DataTable` with 8 columns (select checkbox / Document name + filename
    + file-type icon / Linked-to with route link / Type badge /
    Sensitivity badge with `Lock` for confidential / Version `vN (count)` /
    Uploader name + relative time / Size right-aligned tabular).
  - Row click opens the detail `Sheet`.
- **`DocumentDrawer`** — right sheet (max 40rem):
  - Header: file-type icon, name, three badges (type / sensitivity /
    version count) and three actions — Download v{current}, Copy share
    link, Close.
  - Sections: Details (linked entity, timestamps, share URL, notes,
    tags), Version history (per-version rows with Current badge and
    download button), Access (per-role View / Download badges based on
    sensitivity defaults), Activity timeline.
- **`UploadDocumentDialog`** — `max-w-lg` modal:
  - Mock dropzone, Title (required ≥3), Type + Sensitivity selects.
  - "Link to an entity" checkbox gating Entity type + Entity ID inputs;
    Entity ID is required when entity type ≠ general.
  - Tags (comma-separated) + Notes.
  - Submit disabled until validation passes; success toast on upload.
- **Helpers:** `FileTypeIcon` (mime → image / archive / spreadsheet /
  text — rendered as JSX to satisfy React Compiler static-components
  rule), `Stat`, `Section` (optional icon + aside), `Field`, `FormRow`.

### Routing

`/documents` already wired in `app/router.tsx` from earlier scaffolding —
no router changes required for this step.

## Verification ✅

- [x] `get_errors` — clean.
- [x] `npm run lint` — clean (only the pre-existing
  `InquiryFormDrawer.tsx` `react-hook-form` watch warning).
- [x] `npm run build` — succeeds in ~4.6s.

### Notable chunk sizes

| Asset                            | Raw       | Gzip     |
| -------------------------------- | --------- | -------- |
| `DocumentsPage-*.js`             | 27.67 kB  | 8.06 kB  |
| `index-*.js` (root bundle)       | 516.52 kB | 165.42 kB |

## Commit

`feat(ui): documents module static`
