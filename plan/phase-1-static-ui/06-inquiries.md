# Step 06 — Inquiry Module (Static UI)

> Before this: [05-dashboard.md](./05-dashboard.md)
> Next: [07-quotations.md](./07-quotations.md)

---

## ✅ Delivered

### Status / domain helpers

- `src/lib/inquiryStatus.ts` — `InquiryStatus`, `InquiryPriority`, `InquiryType` enums + label/tone helpers + gate helpers `canConvertToQuotation`, `canMarkLost`.

### Mocks

- `src/mocks/users.ts` — 5 mock users covering admin / sales_manager / sales_executive / inventory / dispatch.
- `src/mocks/inquirySources.ts` — 7 sources (Dealer, Website, Walk-in, Referral, Trade Show, Cold Call, IndiaMART).
- `src/mocks/productCategories.ts` — 7 categories.
- `src/mocks/inquiries.ts` — 32 inquiries: 3 fully detailed (Patel Engineering / Sunrise Textiles / Sheikh Constructions — in_progress, quoted, lost) with line items, follow-ups, activity timeline, attachments, + 29 light rows covering every status × source × priority × type combination.

### New UI primitives

- `src/components/ui/Toast.tsx` — `ToastProvider` + `useToast()`, variants `success|error|info|warning`, framer-motion animations, `aria-live="polite"` region.
- `src/components/ui/Dialog.tsx` — centered Radix-dialog wrapper (overlay + content with zoom-in/out animation, header/body/footer slots). Wired into `main.tsx` alongside `ToastProvider`.

### Validation

- `src/schemas/inquiry.ts` — `inquirySchema` (mobile regex, required fields, enum guards), `followUpSchema` (future scheduledAt via `.refine`), `lostReasonSchema`.

### Pages

- `src/pages/inquiries/InquiriesPage.tsx` — list with search + status/priority/source/assigned/date-range filters, indeterminate bulk-select, bulk action bar (assign / status / export / clear), export dropdown (CSV/Excel/PDF → toast "Export queued"), `DataTable` with inquiry #, date, customer, mobile, project, source, type, priority, status, assigned, row actions menu (Edit / Reassign / Archive). Row click → detail.
- `src/pages/inquiries/InquiryFormDrawer.tsx` — right-side Sheet with RHF + zod, sections Source & Type / Customer (with dedupe banner on matching mobile/email) / Project / Commercial / Assignment, 600 ms simulated latency, success toast.
- `src/pages/inquiries/InquiryDetailPage.tsx` — header (back link, inquiry #, status + priority badges, Edit button + Actions menu with Edit / Reassign / Convert to Quotation / Mark Lost, gated by `canConvertToQuotation` / `canMarkLost`). Five tabs:
  - **Overview** — Customer / Project / Commercial / Source & Assignment cards, Lost-reason card (conditional), Internal notes card.
  - **Requirements** — line-item table with totals footer + Add-row dialog.
  - **Follow-ups** — sorted list with type icons (call/email/visit/whatsapp/meeting), status badges (pending/completed/missed), Schedule dialog with RHF + `followUpSchema`.
  - **Activity** — vertical timeline with distinct icons for 8 action types (created / status_changed / assigned / note_added / follow_up_added / attachment_added / email_sent / converted).
  - **Attachments** — dropzone placeholder + file list (version, uploader, relative upload time, download link).
- `src/pages/inquiries/ConvertToQuotationDialog.tsx` — confirmation dialog, generates mock `Q-2026-XXX` id, toast + navigate to `/quotations`.
- `src/pages/inquiries/MarkLostDialog.tsx` — RHF + `lostReasonSchema`, danger button, toast on submit.

### Routing

- `src/app/router.tsx` — added `InquiryDetailPage` lazy import and `{ path: 'inquiries/:id' }`.

---

## Verification

- [x] Every field from the `inquiries` spec (source, customer, project, commercial, assignment, notes) is represented in create/edit + detail.
- [x] All 6 status values render with correct badge tones via `statusLabel` bridge.
- [x] Filter bar filters client-side over mock data.
- [x] Export menu shows 3 options (CSV/Excel/PDF) — each fires toast "Export queued".
- [x] Create flow validates required fields (mobile regex, customer name, source, type, priority).
- [x] Status transitions gated — Convert action visible only for `new|in_progress|quoted`; Mark Lost hidden for `lost|converted`.
- [x] Activity timeline shows 8 event types with unique icons.
- [x] Follow-up dialog uses `followUpSchema` which rejects past timestamps.
- [x] `npm run lint` — clean (only pre-existing RHF `watch()` compiler warning).
- [x] `npm run build` — success (InquiryDetailPage 24.5 kB, InquiryFormDrawer 27.5 kB).

Commit: `feat(ui): inquiry module static`.
