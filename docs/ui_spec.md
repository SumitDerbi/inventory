# UI Specification Document

## Advanced Business Process Automation System

### Pump & Fire Fighting Products Industry

**Stack:** React · Tailwind CSS · shadcn/ui · Recharts · Framer Motion (light use)
**Build approach:** Static HTML/JSX with hardcoded placeholder data first → replace with API calls in dynamic phase.

---

## DESIGN SYSTEM

### Color Palette

| Token          | Tailwind Class     | Hex       | Usage                              |
| -------------- | ------------------ | --------- | ---------------------------------- |
| Primary        | `bg-blue-600`      | `#2563EB` | Primary buttons, active nav, links |
| Primary Dark   | `bg-blue-700`      | `#1D4ED8` | Hover states                       |
| Primary Light  | `bg-blue-50`       | `#EFF6FF` | Selected rows, badge backgrounds   |
| Secondary      | `bg-slate-700`     | `#334155` | Sidebar background                 |
| Secondary Text | `text-slate-500`   | `#64748B` | Labels, captions                   |
| Surface        | `bg-white`         | `#FFFFFF` | Cards, panels                      |
| Background     | `bg-slate-50`      | `#F8FAFC` | Page background                    |
| Border         | `border-slate-200` | `#E2E8F0` | All borders                        |
| Success        | `text-emerald-600` | `#059669` | Confirmed, Active status           |
| Warning        | `text-amber-500`   | `#F59E0B` | Pending, Draft status              |
| Danger         | `text-red-600`     | `#DC2626` | Lost, Cancelled, Alerts            |
| Info           | `text-sky-600`     | `#0284C7` | In progress, Informational         |

### Status Badge Color Map

| Status Value     | Badge Class                       |
| ---------------- | --------------------------------- |
| New              | `bg-sky-100 text-sky-700`         |
| In Progress      | `bg-blue-100 text-blue-700`       |
| Quoted           | `bg-violet-100 text-violet-700`   |
| Confirmed        | `bg-emerald-100 text-emerald-700` |
| Converted        | `bg-green-100 text-green-700`     |
| Draft            | `bg-slate-100 text-slate-600`     |
| Pending Approval | `bg-amber-100 text-amber-700`     |
| Approved         | `bg-emerald-100 text-emerald-700` |
| Sent             | `bg-blue-100 text-blue-700`       |
| Dispatched       | `bg-indigo-100 text-indigo-700`   |
| Installed        | `bg-green-100 text-green-700`     |
| Cancelled        | `bg-red-100 text-red-700`         |
| Lost             | `bg-red-100 text-red-700`         |
| On Hold          | `bg-orange-100 text-orange-700`   |
| Low Stock        | `bg-amber-100 text-amber-700`     |
| Out of Stock     | `bg-red-100 text-red-700`         |

### Priority Badge Color Map

| Priority | Badge Class                   |
| -------- | ----------------------------- |
| High     | `bg-red-100 text-red-700`     |
| Medium   | `bg-amber-100 text-amber-700` |
| Low      | `bg-slate-100 text-slate-600` |
| Urgent   | `bg-red-600 text-white`       |
| Normal   | `bg-slate-100 text-slate-600` |

### Typography

| Role             | Tailwind Class                                                 |
| ---------------- | -------------------------------------------------------------- |
| Page Title       | `text-2xl font-semibold text-slate-800`                        |
| Section Header   | `text-lg font-semibold text-slate-700`                         |
| Card Title       | `text-sm font-semibold text-slate-700 uppercase tracking-wide` |
| Body Text        | `text-sm text-slate-600`                                       |
| Data Value       | `text-sm font-medium text-slate-900`                           |
| Caption / Helper | `text-xs text-slate-400`                                       |
| Stat Number      | `text-3xl font-bold text-slate-800`                            |

### Spacing & Radius

- Page padding: `p-6`
- Card padding: `p-5` or `p-6`
- Section gap: `gap-6`
- Card radius: `rounded-xl`
- Button radius: `rounded-lg`
- Input radius: `rounded-md`
- Badge radius: `rounded-full px-2.5 py-0.5 text-xs font-medium`

### Component Defaults (shadcn/ui)

| Element        | shadcn Component                                 | Notes                              |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| Data tables    | `Table`, `TableHeader`, `TableRow`, `TableCell`  | With sticky header                 |
| Form inputs    | `Input`, `Select`, `Textarea`, `Combobox`        | Label above, helper text below     |
| Dialogs        | `Dialog`, `DialogContent`, `DialogFooter`        | Medium size default                |
| Drawers        | `Sheet` (from right)                             | For form panels on desktop         |
| Tabs           | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Underline variant                  |
| Dropdowns      | `DropdownMenu`                                   | With icons in items                |
| Tooltips       | `Tooltip`                                        | On truncated text and icon buttons |
| Toasts         | `Sonner` or `useToast`                           | Bottom-right, auto-dismiss 3s      |
| Date pickers   | `Popover` + `Calendar`                           | ISO format internally              |
| Command search | `Command`, `CommandInput`, `CommandList`         | Product/customer lookup            |
| Breadcrumbs    | Custom `Breadcrumb` component                    | Max 3 levels                       |
| Progress       | `Progress`                                       | Thin bar, blue                     |
| Avatars        | `Avatar`, `AvatarFallback`                       | Initials fallback                  |
| Skeleton       | `Skeleton`                                       | On all loading states              |

### Animation Guidelines (Framer Motion — light)

- Page enter: `opacity: 0→1, y: 8→0`, duration `0.2s`
- Card enter (list): stagger `0.05s` per card
- Modal open: `scale: 0.96→1, opacity: 0→1`, duration `0.15s`
- Status badge change: `scale: 1→1.1→1` pulse once
- No heavy animations — nothing that delays interaction

---

## APP SHELL

### Internal App Layout

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (fixed, 240px)    │  MAIN CONTENT AREA      │
│  ┌──────────────────────┐  │  ┌───────────────────┐  │
│  │ Logo + App Name      │  │  │ Topbar             │  │
│  ├──────────────────────┤  │  │ (breadcrumb, user) │  │
│  │ NAV MENU             │  │  ├───────────────────┤  │
│  │  [icon] Dashboard    │  │  │                   │  │
│  │  [icon] Inquiries    │  │  │   Page Content    │  │
│  │  [icon] Quotations   │  │  │                   │  │
│  │  [icon] Orders       │  │  │                   │  │
│  │  [icon] Inventory    │  │  │                   │  │
│  │  [icon] Dispatch     │  │  └───────────────────┘  │
│  │  [icon] Jobs         │  │                         │
│  │  [icon] Documents    │  │                         │
│  │  [icon] Reports      │  │                         │
│  │  ── Admin ──         │  │                         │
│  │  [icon] Users        │  │                         │
│  │  [icon] Settings     │  │                         │
│  ├──────────────────────┤  │                         │
│  │ User avatar + name   │  │                         │
│  └──────────────────────┘  │                         │
└─────────────────────────────────────────────────────┘
```

**Sidebar details:**

- Background: `bg-slate-800`
- Active item: `bg-blue-600 text-white rounded-lg mx-2`
- Inactive item: `text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg mx-2`
- Icons: Lucide React icons, `size-4`
- Logo area: `h-16` with company name in `text-white font-bold`
- Bottom user section: avatar, name, role badge, logout icon
- Collapse button (desktop): toggle to icon-only mode (`w-16`)
- Mobile: hidden by default, opens as overlay Sheet

**Topbar details:**

- Background: `bg-white border-b border-slate-200 h-14`
- Left: Breadcrumb navigation
- Right: Notification bell (with unread count badge) + User dropdown (profile, change password, logout)
- Notification bell: `relative` with `absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4`

**Responsive breakpoints:**

- Mobile `< 768px`: Sidebar hidden, hamburger menu button in topbar triggers Sheet
- Tablet `768–1024px`: Sidebar collapses to icon-only mode
- Desktop `> 1024px`: Full sidebar visible

---

## SECTION 1 — AUTH SCREENS

---

### Screen: Login Page

**Route:** `/login`
**File:** `src/pages/auth/LoginPage.jsx`

**Layout:**

- Two-column on desktop: left half `bg-slate-900` branding panel, right half white form panel
- Single column on mobile: full-width white form
- Not inside the app shell — standalone page

**Left Branding Panel:**

- `bg-gradient-to-br from-slate-800 to-blue-900`
- Company logo (placeholder SVG fire/pump icon)
- App name: `text-3xl font-bold text-white`
- Tagline: `text-slate-300 text-lg`
- 3 feature bullets with check icons in `text-blue-300`
- Bottom: version text `text-slate-500 text-xs`

**Right Form Panel:**

- Centered vertically with `flex items-center justify-center min-h-screen`
- Form container: `w-full max-w-sm`
- Heading: "Welcome back" `text-2xl font-semibold text-slate-800`
- Sub-heading: "Sign in to your account" `text-sm text-slate-500`
- Fields:
  - Email: `Input type="email"` with label "Email address"
  - Password: `Input type="password"` with label "Password" and show/hide toggle icon
- Forgot password link: `text-blue-600 text-sm` below password field, right-aligned
- Submit button: `Button` full-width `bg-blue-600` "Sign in"
- Loading state: button shows spinner + "Signing in…" disabled
- Error state: `Alert variant="destructive"` above form with error message

**Static placeholder data:** Email: `admin@company.com` Password: `••••••••`

---

### Screen: Forgot Password

**Route:** `/forgot-password`
**File:** `src/pages/auth/ForgotPasswordPage.jsx`

**Layout:** Same right-panel style from Login, centered

- Heading: "Reset your password"
- Single email input
- Submit button: "Send reset link"
- Back to login link below button
- Success state: green Alert showing "Check your email for the reset link."

---

## SECTION 2 — EXECUTIVE DASHBOARD

---

### Screen: Executive Dashboard

**Route:** `/dashboard`
**File:** `src/pages/dashboard/ExecutiveDashboard.jsx`

**Layout:** Standard app shell, page content uses 12-column grid

**Row 1 — KPI Summary Cards (4 cards)**
Each card: `bg-white rounded-xl border border-slate-200 p-5 flex justify-between items-start`

| Card                         | Stat     | Sub-text              | Icon Color |
| ---------------------------- | -------- | --------------------- | ---------- |
| Total Inquiries (This Month) | `142`    | `↑ 18% vs last month` | Blue       |
| Open Quotations              | `38`     | `₹24.6L total value`  | Violet     |
| Active Orders                | `21`     | `7 pending dispatch`  | Amber      |
| Revenue (This Month)         | `₹18.4L` | `↑ 12% vs last month` | Emerald    |

- Icon: Lucide icon in colored `rounded-lg p-2` box (e.g. `bg-blue-50`)
- Stat: `text-3xl font-bold text-slate-800`
- Sub-text: green/red arrow + `text-sm text-slate-500`
- Hover: `shadow-md` transition

**Row 2 — Conversion Funnel + Revenue Trend (2 columns)**

Left (7 cols): `RevenueLineChart`

- `recharts LineChart` — Monthly revenue for last 6 months
- Two lines: Revenue (blue), Cost (slate)
- Tooltip: custom with ₹ formatting
- Static data: `[{ month: 'Nov', revenue: 1240000, cost: 890000 }, ...]`

Right (5 cols): `InquiryFunnelChart`

- `recharts FunnelChart` or horizontal bar chart
- Stages: New 142 → In Progress 89 → Quoted 52 → Won 31 → Lost 21
- Color gradient blue to green
- Labels: stage name + count + conversion %

**Row 3 — Recent Activity + Pending Actions (2 columns)**

Left (7 cols): `RecentActivityFeed`

- Scrollable list `max-h-80 overflow-y-auto`
- Each item: Avatar (initials) + action text + time ago + link badge
- Static items: "Raj created Inquiry #INQ-0142", "Order #SO-0089 dispatched", etc.
- `text-sm text-slate-600`, time `text-xs text-slate-400`

Right (5 cols): `PendingActionsList`

- Grouped by type with `Badge` count:
  - Quotations awaiting approval: **4**
  - Overdue follow-ups: **11**
  - Orders blocked (material): **3**
  - POD pending: **6**
- Each item is a clickable card with `→` arrow
- Urgent items in `border-l-4 border-red-500`

**Row 4 — Top Products + Engineer Utilization (2 columns)**

Left (6 cols): `TopProductsBar`

- `recharts BarChart` horizontal, top 5 products by revenue
- Color: blue bars, white labels

Right (6 cols): `EngineerUtilizationDonut`

- `recharts PieChart`
- On-site, Available, On Leave segments
- Center text: "8 of 12 Engineers Active"

---

## SECTION 3 — INQUIRY MODULE

---

### Screen: Inquiry List

**Route:** `/inquiries`
**File:** `src/pages/inquiries/InquiryList.jsx`

**Layout:** Full-width page, standard shell

**Topbar area (below breadcrumb, above table):**

- Left: Page title "Inquiries" + count badge `text-slate-400 text-sm (142)`
- Right: `+ New Inquiry` button (`Button variant="default"` with `Plus` icon)

**Filter Bar:** `bg-white border rounded-xl p-4 mb-4`

- Search input: `Input placeholder="Search by name, mobile, project..."` with `Search` icon prefix — full-width on mobile
- Row of filters (inline on desktop, stacked on mobile):
  - `Select` — Status: All / New / In Progress / Quoted / Converted / Lost / On Hold
  - `Select` — Priority: All / High / Medium / Low
  - `Select` — Source: All / Dealer / Website / Direct / Contractor
  - `Select` — Assigned To: All / [Sales exec names]
  - Date range: two `Input type="date"` fields — From, To
  - `Button variant="outline"` — Reset Filters

**View Toggle:** Table view / Kanban view icons (top right of filter bar)

**Table View:**
`Table` component, full-width, `hover:bg-slate-50` rows

| Column      | Content                                                        | Width |
| ----------- | -------------------------------------------------------------- | ----- |
| #           | `INQ-0142` truncated link                                      | 100px |
| Customer    | Company name + `text-xs text-slate-400` customer type          | 180px |
| Project     | Project name `text-sm`                                         | 180px |
| Product     | Category badge                                                 | 130px |
| Priority    | Priority badge                                                 | 90px  |
| Status      | Status badge                                                   | 130px |
| Assigned To | Avatar + name                                                  | 130px |
| Follow-up   | Date + `text-red-500` if overdue                               | 110px |
| Actions     | `MoreHorizontal` dropdown: View, Edit, Create Quote, Mark Lost | 60px  |

- Clicking row navigates to Inquiry Detail
- Pagination: `Pagination` component, 20 rows/page, total count
- Empty state: centered illustration + "No inquiries found" + New Inquiry button

**Kanban View (optional toggle):**

- 5 columns: New, In Progress, Quoted, Converted, Lost
- Each column: `bg-slate-100 rounded-xl p-3 min-h-96`
- Column header: status name + count badge
- Cards: Customer name, project, priority badge, assigned avatar, follow-up date
- Cards are static (no drag in static phase)

---

### Screen: Create / Edit Inquiry

**Route:** `/inquiries/new` | `/inquiries/:id/edit`
**File:** `src/pages/inquiries/InquiryForm.jsx`

**Layout:** Full-page form with two-column layout on desktop; right sidebar for product line items

**Form Sections (using `Card` + `CardHeader` + `CardContent`):**

**Card 1 — Customer Information**

- Fields in 2-column grid `grid grid-cols-2 gap-4`:
  - Customer Name `Input` (required)
  - Company Name `Input`
  - Mobile `Input type="tel"` (required)
  - Alternate Mobile `Input`
  - Email `Input type="email"`
  - Customer Type `Select` — Dealer / Contractor / Direct / Company
  - City `Input`
  - State `Input`
- Below fields: "Link to existing customer" `Button variant="outline" size="sm"` (opens Combobox search dialog)

**Card 2 — Inquiry Details**

- Fields in 2-column grid:
  - Source `Select` (required)
  - Source Reference `Input` (shown when source = Dealer)
  - Inquiry Type `Select` — New Project / Spare Parts / AMC / Service / Other
  - Priority `Select` — High / Medium / Low (required)
  - Project Name `Input`
  - Expected Order Date `Input type="date"`
  - Site Location `Textarea rows=2`
  - Budget Range `Input placeholder="e.g. ₹5L–₹10L"`
  - Assigned To `Select` (sales users list)
- Notes `Textarea rows=3` full-width

**Card 3 — Product Requirements (Line Items)**

- Section header + `+ Add Item` button
- Items table: compact rows
  - Product Description `Input` (required)
  - Category `Select`
  - Qty `Input type="number" w-20`
  - Unit `Select` (pcs, set, lot, meter)
  - Est. Value `Input type="number"`
  - Specifications `Input` (collapsible)
  - Delete `Button variant="ghost"` with `Trash2` icon
- "Link to product master" option per row (opens product Combobox)

**Action Bar:** `sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3`

- `Cancel` button (`variant="outline"`)
- `Save Draft` button (`variant="outline"`)
- `Save & Submit` button (`variant="default"`)

---

### Screen: Inquiry Detail

**Route:** `/inquiries/:id`
**File:** `src/pages/inquiries/InquiryDetail.jsx`

**Layout:** 8 + 4 column split on desktop

**Left (8 cols) — Main Content:**

_Tabs:_ Overview / Follow-ups / Activity / Attachments

**Overview Tab:**

- Two-column info grid: Customer, Mobile, Email, Source, Type, Assigned To, Created Date, Expected Order Date, Budget Range, Site
- Project name as sub-heading
- Line items table: Description, Category, Qty, Unit, Est. Value, Specifications

**Follow-ups Tab:**

- `+ Schedule Follow-up` button
- Timeline list: each item shows type icon (phone/email/visit), date, status badge, assignee, outcome notes
- Past follow-ups in `text-slate-400`
- Overdue in `text-red-600 font-medium`

**Activity Tab:**

- Chronological log: timestamp, user avatar + name, action description
- `text-xs text-slate-400` for timestamp
- `text-sm text-slate-700` for action

**Attachments Tab:**

- Upload area: dashed border dropzone `border-2 border-dashed border-slate-300 rounded-xl`
- File grid: `grid grid-cols-3 gap-3`
- Each file card: icon (PDF/image), file name, size, uploaded by + date, download button

**Right (4 cols) — Sidebar:**

_Card: Status & Actions_

- Current status badge (large)
- Status change: `Select` with allowed transitions
- `Change Status` button

_Card: Quick Stats_

- Quotations raised: **2**
- Follow-ups done: **5**
- Days since created: **14**

_Card: Linked Quotations_

- List of quotations with number, version, status badge, grand total
- `+ Create Quotation` button

_Card: Assigned To_

- Avatar + name + email
- `Reassign` button

---

### Screen: Follow-up Modal

**Component:** `src/components/inquiries/FollowUpModal.jsx`
**Trigger:** "+ Schedule Follow-up" button

**Dialog size:** medium `max-w-md`

- Follow-up Type: `RadioGroup` with icons — Call / Email / Visit / WhatsApp / Meeting
- Scheduled Date & Time: date + time inputs in 2-column grid
- Assigned To: `Select`
- Notes / Agenda: `Textarea rows=3`
- For completed follow-ups, additional section:
  - Outcome: `Textarea`
  - Next Follow-up Date: `Input type="date"`
- Footer: Cancel + `Schedule` button

---

## SECTION 4 — QUOTATION MODULE

---

### Screen: Quotation List

**Route:** `/quotations`
**File:** `src/pages/quotations/QuotationList.jsx`

**Filter Bar:** Same pattern as Inquiry List

- Filters: Status, Customer, Date Range, Assigned To, Expiry (expiring this week toggle)
- Search: by quotation number, customer, project

**Table:**

| Column      | Content                                             |
| ----------- | --------------------------------------------------- |
| #           | `QT-0089 v2` — version in muted text                |
| Customer    | Company name                                        |
| Project     | Project name                                        |
| Items       | Count badge `3 items`                               |
| Grand Total | `₹ 4,85,000` right-aligned                          |
| Margin %    | `22%` — colored: green >20%, amber 10–20%, red <10% |
| Status      | Status badge                                        |
| Valid Until | Date — `text-red-500` if expiring within 7 days     |
| Actions     | View / Edit / New Version / Send / Convert to Order |

- Expiring quotes: row has left border `border-l-4 border-amber-400`
- Expired quotes: row text `text-slate-400`

---

### Screen: Quotation Builder

**Route:** `/quotations/new` | `/quotations/:id/edit`
**File:** `src/pages/quotations/QuotationBuilder.jsx`

**Layout:** Main area (9 cols) + Pricing Summary sidebar (3 cols), sticky

**Header section:**

- Quotation number (auto-generated placeholder `QT-DRAFT`)
- `Badge` for version: v1
- Status badge

**Card 1 — Customer & Project Info:**

- Customer search Combobox (typeahead)
- Contact person `Select` (from customer's contacts)
- Project name `Input`
- Quotation Date `Input type="date"` (today default)
- Valid Until `Input type="date"` (today + 30 days default)
- Billing Address `Select` from customer addresses
- Shipping Address `Select` from customer addresses
- Site Address `Textarea` (optional override)

**Card 2 — Line Items (Product Table):**

- Add product via `+ Add Product` button (opens Command Palette: type to search product by code/name)
- Table with editable cells:

| Column                | Input Type                                         |
| --------------------- | -------------------------------------------------- |
| #                     | Row number                                         |
| Product / Description | `Input` (pre-filled from product)                  |
| Brand / Model         | `Input`                                            |
| Spec Notes            | `Input` (small)                                    |
| Qty                   | `Input type="number"` w-20                         |
| Unit                  | `Select`                                           |
| Unit Cost             | `Input` (internal, conditionally visible by role)  |
| Unit Price            | `Input`                                            |
| Disc %                | `Input type="number"` w-20                         |
| Tax                   | `Select`                                           |
| Line Total            | Calculated, read-only, right-aligned `font-medium` |
|                       | Drag handle + delete row                           |

- Margin indicator per row: small `text-xs` below cost: "Margin: 24%" — color-coded
- "Group products" option: add section headers between rows

**Card 3 — Commercial Terms:**

- Payment Terms `Textarea rows=2`
- Delivery Terms `Textarea rows=2`
- Warranty Terms `Textarea rows=2`
- Scope of Supply `Textarea rows=3`
- Exclusions `Textarea rows=2`
- Notes `Textarea rows=2`

**Pricing Summary Sidebar (sticky, right 3 cols):**

```
┌─────────────────────┐
│ PRICE SUMMARY       │
├─────────────────────┤
│ Sub-total    ₹4,20,000 │
│ Discount    -₹21,000   │
│ Tax (GST)   +₹71,460   │
│ Freight     +₹8,000    │
│ Other       +₹0        │
├─────────────────────┤
│ GRAND TOTAL ₹4,78,460  │
├─────────────────────┤
│ Cost Total  ₹3,50,000  │
│ Gross Margin  26.7%    │
│ [████████░░] bar       │
└─────────────────────┘
```

- Margin bar: green if >20%, amber if 10–20%, red if <10%
- Freight and other charges inline editable

**Sticky Action Bar:**

- `Save Draft` / `Submit for Approval` / `Preview PDF` / `Approve & Send` (role-dependent visibility)

---

### Screen: Quotation Detail / View

**Route:** `/quotations/:id`
**File:** `src/pages/quotations/QuotationDetail.jsx`

**Layout:** Document-style view, 9+3 columns

**Main (9 cols):**

- Read-only version of the quotation as it would look printed
- Product table, totals, commercial terms in clean layout
- Version history `Tabs`: v1 / v2 / v3 — click to view snapshot

**Right Sidebar (3 cols):**

_Card: Status & Actions_

- Status badge + last changed date
- Role-based action buttons:
  - Sales: "Edit", "Submit for Approval", "Send to Customer", "Create New Version"
  - Approver: "Approve", "Reject" (with comment dialog)
  - Converted: "View Order"

_Card: Approval Status_

- Step list: each approver with status (pending ⏳ / approved ✅ / rejected ❌)
- Approved at timestamp
- Rejection comments in `Alert variant="destructive"`

_Card: Activity Timeline_

- Draft created → Submitted → Approved → Sent → Accepted
- With timestamps and actors

_Card: Email Log_

- Sent to, sent at, opened (placeholder checkmarks)

---

### Screen: PDF Preview Modal

**Component:** `src/components/quotations/PDFPreviewModal.jsx`

**Dialog:** full-height `max-w-4xl`

- Left: PDF-style rendered preview (HTML layout with company header, item table, terms, signature block)
- Right: Send controls panel
  - To email `Input` (pre-filled from customer)
  - CC `Input`
  - Subject `Input`
  - Message `Textarea`
  - Attach as PDF checkbox
  - `Send Email` button + `Download PDF` button

---

## SECTION 5 — SALES ORDER MODULE

---

### Screen: Order List

**Route:** `/orders`
**File:** `src/pages/orders/OrderList.jsx`

**Table:**

| Column        | Content                                |
| ------------- | -------------------------------------- |
| #             | `SO-0042` link                         |
| Customer      | Company name                           |
| Project       | Project name                           |
| Items         | Count + value                          |
| Stage         | Multi-step progress bar (mini)         |
| Status        | Status badge                           |
| Order Date    | Date                                   |
| Delivery Date | Date, `text-amber-500` if approaching  |
| Blockers      | Red icon count if any blockers         |
| Actions       | View / Update Status / Create Dispatch |

**Stage Progress Bar (inline mini):**

- 6 dots connected by line: Confirmed → Processing → Ready → Dispatched → Installed → Closed
- Filled dots in blue, current dot pulsing, future dots in slate

---

### Screen: Order Detail

**Route:** `/orders/:id`
**File:** `src/pages/orders/OrderDetail.jsx`

**Layout:** Full page, tabs-based

**Header Section:**

- Order number + status badge
- Customer name, project, order date, sales exec
- Grand total `text-2xl font-bold text-slate-800`
- Stage progress bar (full-width, with milestone labels below)
- Action button: "Advance to Next Stage" (primary) + `MoreHorizontal` for other actions

**Tabs:** Items / Milestones / Material Checklist / Site Info / Dispatch / Activity

**Items Tab:**
Table: Product, Qty Ordered, Qty Dispatched, Qty Pending, Unit Price, Line Total, Status badge per item

**Milestones Tab:**

- Vertical checklist: each milestone with checkbox, name, target date, completed date
- Completed: `text-slate-400 line-through`
- Overdue: `text-red-600`
- `+ Add Milestone` button

**Material Checklist Tab:**

- Table: Product, Required Qty, Available Qty, Shortage, Status
- Status: green "Available", amber "Partial", red "Shortage", blue "Procuring"
- "Refresh from Stock" button

**Site Info Tab:**

- Form view: Site address, contact, civil readiness, electrical readiness, expected install date, special requirements
- Editable inline or via "Edit" button → Sheet

**Dispatch Tab:**

- List of dispatch challans linked to this order
- Each challan: challan number, date, status, items dispatched, transporter, POD status

**Activity Tab:**

- Full chronological audit trail

**Blockers Panel (if applicable):**

- Sticky alert at top: `Alert variant="warning"` listing blockers (missing material, site not ready, payment pending)

---

## SECTION 6 — INVENTORY MODULE

---

### Screen: Stock Dashboard

**Route:** `/inventory`
**File:** `src/pages/inventory/StockDashboard.jsx`

**Row 1 — KPI Cards (4 cards):**

- Total Products Active: **284**
- Total Stock Value: **₹42.8L**
- Products Low Stock: **18** (amber badge)
- Products Out of Stock: **5** (red badge)

**Row 2 — Stock Alerts Panel (full-width):**

- `Alert variant="warning"` collapsible section
- Table: Product, Category, Brand, Current Stock, Minimum Stock, Shortage
- "Create Purchase Request" action button per row

**Row 3 — Warehouse Stock Summary:**

- `Tabs` per warehouse
- Each tab: Product table with available, reserved, physical stock columns
- Filter bar: category, brand, search

**Row 4 — Stock Movement Chart:**

- `recharts BarChart` — last 30 days inward vs outward
- Blue bars = inward, red bars = outward

---

### Screen: Product Master List

**Route:** `/inventory/products`
**File:** `src/pages/inventory/ProductList.jsx`

**Filter bar:** Category `Select`, Brand `Select`, Status (Active/Inactive), Search

**Table:**

| Column     | Content                                              |
| ---------- | ---------------------------------------------------- |
| Code       | `PRD-001`                                            |
| Name       | Product name + model number `text-xs text-slate-400` |
| Category   | Badge                                                |
| Brand      | Text                                                 |
| Stock      | Available / Reserved / Physical — color coded        |
| Price      | Purchase / Selling                                   |
| Serialized | Checkbox icon                                        |
| Status     | Active/Inactive badge                                |
| Actions    | View / Edit / View Ledger / View Reservations        |

---

### Screen: Product Detail / Edit

**Route:** `/inventory/products/:id`
**File:** `src/pages/inventory/ProductDetail.jsx`

**Tabs:** Info / Specifications / Stock Ledger / Reservations / Documents

**Info Tab:**

- Two-column form layout: Code, Name, Category, Brand, Model, Description, UoM, HSN code, Tax Rule, Purchase Price, Selling Price, Min Stock, Reorder Point, Warranty Months, Dimensions, Weight, Status

**Specifications Tab:**

- Key-value table: Spec Key, Value, Unit
- `+ Add Specification` button
- Inline editable rows

**Stock Ledger Tab:**

- Table: Date, Transaction Type, Reference, Warehouse, Qty (+ green / - red), Unit Cost, Balance
- Filter by warehouse, date range, transaction type

**Reservations Tab:**

- Table: Order #, Customer, Reserved Qty, Reserved At, Status

---

### Screen: Stock Movement Entry

**Route:** `/inventory/stock/inward` | `/inventory/stock/outward` | `/inventory/stock/adjustment`
**File:** `src/pages/inventory/StockEntryForm.jsx`

**Card layout:**

- Transaction Type: shown as header `Badge` (Inward / Outward / Adjustment)
- Warehouse `Select` (required)
- Reference Number `Input` (PO number, SO number, etc.)
- Date `Input type="date"`
- Items table:
  - Product search `Combobox`
  - Quantity `Input`
  - Unit Cost `Input` (inward only)
  - Batch Number `Input`
  - Serial Numbers `Textarea` (if product is serialized, comma-separated)
  - Remarks `Input`
  - Remove row button
- For Adjustment: Reason `Select` + Notes `Textarea`
- `+ Add Product` button
- Total quantity summary at bottom
- Sticky action bar: Cancel + Save

---

## SECTION 7 — DISPATCH MODULE

---

### Screen: Dispatch Dashboard

**Route:** `/dispatch`
**File:** `src/pages/dispatch/DispatchDashboard.jsx`

**KPI Cards (4):**

- Today's Dispatches: **8**
- In Transit: **14**
- Pending POD: **9**
- Failed Deliveries: **2**

**Ready to Dispatch Orders:** (highlighted panel)

- Table: Order #, Customer, Items, Location, Priority, `Create Challan` button per row

**Today's Dispatch Schedule:**

- Card list: each challan with transporter name, vehicle, items count, destination, status badge
- Cards color-coded by status

**Pending POD List:**

- Table: Challan #, Dispatched Date, Customer, Expected Delivery, Days Pending
- `Upload POD` button per row (opens modal)

---

### Screen: Dispatch Challan List

**Route:** `/dispatch/challans`
**File:** `src/pages/dispatch/ChallanList.jsx`

**Table:**

| Column            | Content                                                       |
| ----------------- | ------------------------------------------------------------- |
| Challan #         | `DC-0089`                                                     |
| Order #           | Linked order                                                  |
| Customer          | Name                                                          |
| Items             | Count                                                         |
| Transporter       | Name                                                          |
| Dispatch Date     | Date                                                          |
| Expected Delivery | Date                                                          |
| Status            | Status badge (Planned / In Transit / Delivered / POD Pending) |
| POD               | ✅ received / ⏳ pending                                      |
| Actions           | View / Update Status / Upload POD / Download PDF              |

---

### Screen: Challan Creation Form

**Route:** `/dispatch/challans/new`
**File:** `src/pages/dispatch/ChallanForm.jsx`

**Card 1 — Order & Customer:**

- Order `Combobox` search — shows ready orders only
- Customer: auto-filled from order
- Delivery Address `Select` from customer addresses + free-text option

**Card 2 — Transport Details:**

- Transporter `Select` (from master)
- Vehicle `Select` (filtered by transporter)
- Driver Name `Input`
- Driver Mobile `Input`
- LR Number `Input`
- Freight Amount `Input`
- Freight Paid By `Select` — Company / Customer
- Dispatch Date `Input type="date"`
- Expected Delivery Date `Input type="date"`

**Card 3 — Items (from order):**

- Pre-filled from order items, editable quantity (partial dispatch support)
- Each row: Product, Ordered Qty, Previously Dispatched, Dispatch Qty `Input`, Pending After, Serial Numbers `Input`
- Validation: Dispatch Qty ≤ Pending Qty (inline error)

**Notes `Textarea`**

**Action bar:** Cancel + Save Draft + Finalize Challan

---

### Screen: POD Upload Modal

**Component:** `src/components/dispatch/PODUploadModal.jsx`

**Dialog:** `max-w-sm`

- Challan number and customer shown at top
- Received By `Input`
- Received At `Input type="datetime-local"`
- Condition `Select` — Good / Damaged / Partial
- Signature `Input file` (image upload)
- Photo Upload dropzone (one image)
- Remarks `Textarea`
- `Submit POD` button

---

## SECTION 8 — ENGINEER & INSTALLATION MODULE

---

### Screen: Jobs List (Web)

**Route:** `/jobs`
**File:** `src/pages/jobs/JobList.jsx`

**Filter bar:** Status, Priority, Assigned Engineer, Date Range, Job Type

**Table:**

| Column      | Content                                             |
| ----------- | --------------------------------------------------- |
| Job #       | `JOB-0042`                                          |
| Type        | Job type badge (Installation / Commissioning / AMC) |
| Customer    | Name                                                |
| Site        | City + short address                                |
| Engineer(s) | Avatars (max 3, +N)                                 |
| Priority    | Priority badge                                      |
| Scheduled   | Date                                                |
| Status      | Status badge                                        |
| Checklist   | Progress bar `6/10 steps`                           |
| Actions     | View / Assign / Schedule                            |

---

### Screen: Job Detail (Web)

**Route:** `/jobs/:id`
**File:** `src/pages/jobs/JobDetail.jsx`

**Header:** Job number, type badge, status badge, priority badge, customer name, site address

**Tabs:** Overview / Assignments / Visits / Checklist / Report / Attachments

**Overview Tab:**

- Two-column info: Customer, Order Reference, Job Type, Scheduled Date, Site Contact, Completion Date
- Related Dispatch Challan link
- Job notes

**Assignments Tab:**

- Current assigned engineers: Avatar, name, designation, lead indicator, assigned at
- `+ Assign Engineer` button → opens engineer availability sheet
- Engineer Availability Sheet:
  - Date picker
  - Available engineers list with skill match indicator
  - Select and confirm

**Visits Tab:**

- Visit timeline: Visit #, Scheduled, Actual Start, Actual End, Engineer, Status
- GPS coordinates link (Google Maps link for static)
- `+ Schedule Visit` button

**Checklist Tab:**

- Progress summary: `7 / 12 steps completed` with `Progress` bar
- Grouped by section
- Each item: step number, title, status icon (✅ / ❌ / ⏳), response value, photo thumbnail, remarks
- Non-editable in web view (engineers fill on mobile)

**Report Tab:**

- View submitted service report
- Summary, issues found, actions taken, pending actions
- Customer signature image
- `Download PDF` button

---

### Screen: Engineer Roster

**Route:** `/jobs/engineers`
**File:** `src/pages/jobs/EngineerRoster.jsx`

**Layout:** Two-column — engineer cards on left, calendar/availability on right

**Engineer Cards (left):**

- `grid grid-cols-2 gap-4`
- Each card: Avatar, name, designation, base location, mobile
- Skill badges: `bg-blue-100 text-blue-700 rounded-full text-xs`
- Status indicator dot: green = available, amber = on-site, red = on leave
- Active jobs count: `text-sm text-slate-500`

**Availability Calendar (right):**

- Monthly calendar grid
- Click day: shows engineer's scheduled visits and jobs

---

### Screen: Mobile — My Jobs List (Engineer PWA)

**Route:** `/m/jobs` (mobile-specific route or responsive variant)
**File:** `src/pages/mobile/EngineerJobList.jsx`

**Design:** Fully mobile-optimized, `max-w-sm mx-auto`, bottom navigation bar

**Header:** App name + engineer name + notification bell

**Job Cards (stacked):**

```
┌────────────────────────────────┐
│ 🔴 URGENT  JOB-0042            │
│ Pump Installation              │
│ Rajesh Mehta Builders          │
│ 📍 Andheri East, Mumbai        │
│ 📅 Today, 10:30 AM             │
│ ──────────────────────         │
│ Checklist: [████████░░] 8/10   │
│ [View Details →]               │
└────────────────────────────────┘
```

- Priority badge top-right
- Tap card → job detail
- Filter tabs at top: All / Today / Upcoming / Completed

---

### Screen: Mobile — Job Detail (Engineer)

**Route:** `/m/jobs/:id`
**File:** `src/pages/mobile/EngineerJobDetail.jsx`

**Header:** Back button, job number, status badge

**Sections (scrollable, accordion-style):**

1. **Site Info Card:** Address, contact name, mobile (tap to call), map link, notes
2. **Check-in/Check-out Card:** Large `Check In` button → becomes `Check Out` after check-in, timestamp displayed, GPS auto-captured
3. **Checklist Card:** Step-by-step form:
   - Step cards with checkbox / input / camera icon
   - Photo capture: tap camera → opens native camera capture
   - Required steps marked with `*`
   - Progress bar at top updating in real-time
4. **Report Submission Card:** Summary, issues found, pending actions text areas
5. **Customer Signature Card:** Signature pad area (static: image placeholder with "Tap to Sign")

**Bottom Action Bar:** `Save Progress` + `Submit Report`

---

## SECTION 9 — INVOICE & DOCUMENT MANAGEMENT

---

### Screen: Invoice Management

**Route:** `/documents/invoices`
**File:** `src/pages/documents/InvoiceList.jsx`

**Filter bar:** Date range, Customer, Order #, Invoice Type, Status

**Table:**

| Column       | Content                              |
| ------------ | ------------------------------------ |
| Invoice #    | `INV-0089`                           |
| Type         | Tax Invoice / Proforma / Credit Note |
| Customer     | Name                                 |
| Order #      | Linked order                         |
| Invoice Date | Date                                 |
| Grand Total  | `₹ 4,85,000`                         |
| GST          | Tax amount                           |
| Status       | Issued / Draft / Cancelled           |
| Actions      | View / Download / Cancel             |

**Upload Invoice button** (top right) → opens `InvoiceUploadModal`

**Invoice Upload Modal:**

- Order search `Combobox` (required)
- Invoice Number `Input`
- Invoice Date `Input type="date"`
- Invoice Type `Select`
- File upload dropzone (PDF only)
- Notes `Textarea`
- Submit button

---

### Screen: Document Repository

**Route:** `/documents`
**File:** `src/pages/documents/DocumentRepository.jsx`

**Layout:** Split — sidebar filter tree (left 3 cols) + document list/grid (right 9 cols)

**Left Sidebar Filter Tree:**

- All Documents
- By Category: Warranty Certificate, Test Certificate, Commissioning Report, Inspection Report, Invoice, Other
- By Customer (top 10 with counts)
- Customer-visible only toggle

**Main Area:**

- View toggle: List / Grid
- Search bar: `Input placeholder="Search by customer, order, serial, invoice number..."`
- Sort by: Date (newest) / Category / Customer

**List View Table:**

| Column     | Content                          |
| ---------- | -------------------------------- |
| Document # | Reference                        |
| Category   | Badge                            |
| Customer   | Name                             |
| Linked To  | Order / Invoice / Job + number   |
| Serial #   | If applicable                    |
| Date       | Document date                    |
| Expiry     | Date, `text-red-500` if expired  |
| Visibility | 🔒 Internal / 🌐 Client visible  |
| Actions    | Download / Share / View / Delete |

**Grid View:**

- `grid grid-cols-4 gap-4`
- Each card: file icon (PDF=red, image=green, doc=blue), category badge, name (truncated), date, download button

---

### Screen: Serial Number Tracker

**Route:** `/documents/serial-numbers`
**File:** `src/pages/documents/SerialNumberTracker.jsx`

**Search bar:** Large search `Input placeholder="Enter serial number to trace..."` with search button

**Trace Result (shown after search):**

```
Serial: SN-20240011
Product: Fire Pump | Kirloskar | KDS 615+
```

**Vertical Timeline:**

- ✅ Inward (Purchase): Date, PO Reference, Warehouse
- ✅ Reserved: Date, Order Reference
- ✅ Dispatched: Date, Challan #, Transporter, Customer
- ✅ Installed: Date, Job #, Engineer name, Site address
- 📄 Warranty Certificate: Date issued, link to download
- 📄 Test Certificate: Date issued, link to download
- 📄 Commissioning Report: Date issued, link to download

**Table of all serial numbers (below search):**
Product, Serial, Customer, Status (In Stock / Dispatched / Installed / Returned), Warranty Expiry

---

### Screen: Certificate Generation Wizard

**Route:** `/documents/certificates/new`
**File:** `src/pages/documents/CertificateWizard.jsx`

**Step 1 — Select Type:**

- Card grid of certificate types with icons: Warranty, Test, Commissioning
- Click to select, highlighted card

**Step 2 — Select Reference:**

- Order search `Combobox`
- Auto-fills customer, product, serial numbers
- Serial number multi-select checkbox list

**Step 3 — Review & Edit:**

- Preview of certificate content (HTML template with filled values)
- Editable fields: Issue Date, warranty start/end dates, any notes
- Template preview on right

**Step 4 — Generate:**

- `Generate Certificate` button
- Shows generated PDF preview inline
- `Download PDF` + `Save to Repository` buttons

**Stepper component** at top: `Step 1 → Step 2 → Step 3 → Step 4`

---

## SECTION 10 — CLIENT PORTAL

---

### Screen: Client Login

**Route:** `/portal/login`
**File:** `src/pages/portal/PortalLogin.jsx`

**Design:** Distinct from internal app — clean white layout with company branding

- Company logo (centered at top)
- Card `max-w-xs mx-auto shadow-lg rounded-2xl p-8`
- "Client Access Portal" heading
- Email + Password fields
- `Login` button full-width blue
- "Forgot Password?" link
- Footer: company contact info + version

---

### Screen: Client Portal Dashboard

**Route:** `/portal/dashboard`
**File:** `src/pages/portal/ClientDashboard.jsx`

**Layout:** Simplified shell — top navbar only (no sidebar), clean and minimal

**Navbar:** Company logo + "Welcome, {Company Name}" + Logout button

**Row 1 — Summary Cards (3 cards):**

- Active Projects: **3**
- Pending Deliveries: **2**
- Documents Available: **14**

**Row 2 — Active Orders (full-width card):**

- Table: Order #, Project Name, Items, Stage, Dispatched, Expected Delivery
- Each row expandable: shows item-level status on expand
- Stage shown as mini progress steps: Confirmed → Dispatched → Installed

**Row 3 — Recent Documents:**

- Grid `grid grid-cols-3 gap-4`
- Card per document: category badge, filename, date, `Download` button
- "View All Documents →" link

---

### Screen: Client — Order Tracking

**Route:** `/portal/orders/:id`
**File:** `src/pages/portal/ClientOrderDetail.jsx`

**Header:** Order # + Project Name + Status badge

**Stage Timeline (full-width):**

```
[✅ Confirmed] → [✅ Processing] → [✅ Dispatched] → [⏳ Installation] → [○ Closed]
   Jan 5            Jan 8             Jan 12            Pending
```

**Items Table:** Product, Quantity, Dispatched, Pending, Unit

**Dispatch Info Card (if dispatched):**

- Transporter, LR Number, Dispatch Date, Expected Delivery
- POD status

**Installation Info Card (if job exists):**

- Engineer name, scheduled date, status

**Documents Card:**

- List of documents for this order (invoices, certificates)
- Download buttons

---

### Screen: Client — Documents

**Route:** `/portal/documents`
**File:** `src/pages/portal/ClientDocuments.jsx`

**Layout:** Simple, no sidebar

- Filter tabs: All / Invoices / Certificates / Reports
- Search input
- Card grid:
  - Category icon + badge
  - File name
  - Related Order # and date
  - `Download` button
- Empty state per category

---

### Screen: Client — Universal Search

**Route:** `/portal/search?q=...`
**File:** `src/pages/portal/ClientSearch.jsx`

**Search bar full-width** at top (large, prominent)

- Results grouped by type: Orders, Invoices, Certificates, Serial Numbers
- Each group: section heading + result cards
- Each result card shows key fields and a link to detail
- "No results" illustration if empty

---

## SECTION 11 — ADMIN DASHBOARD & REPORTS

---

### Screen: Reports Hub

**Route:** `/reports`
**File:** `src/pages/reports/ReportsHub.jsx`

**Layout:** Card grid of report categories

- Inquiry Reports
- Quotation Reports
- Sales Reports
- Inventory Reports
- Dispatch Reports
- Engineer Reports
- Revenue & Margin Reports
- Document Reports

Each card: icon, title, description, "View Report →" link

---

### Screen: Report Viewer

**Route:** `/reports/:reportId`
**File:** `src/pages/reports/ReportViewer.jsx`

**Layout:** Full-width

**Filter Panel (collapsible, top):**

- Date Range (quick picks: Today / This Week / This Month / Last Month / Custom)
- Additional filters per report type (e.g., Sales Exec, Product Category, Customer)
- `Run Report` button + `Reset` button

**Chart Section:**

- Primary visualization (bar, line, funnel, or pie based on report type)
- Chart `recharts` component with tooltips, legend, responsive container

**Data Table:**

- Full-width `Table` with all columns
- Sortable column headers
- Pagination: 25 rows/page

**Export Bar:**

- `Export CSV` button
- `Export Excel` button
- `Export PDF` button
- `Save as Report` button (opens name dialog)
- `Schedule Report` button (opens schedule config sheet)

---

### Screen: Inquiry Funnel Report

**Route:** `/reports/inquiry-funnel`
_(as an example of a specific report page)_

**Chart:** Horizontal funnel or bar chart

- New: 142 → In Progress: 89 (62.7%) → Quoted: 52 (58.4%) → Won: 31 (59.6%) → Lost: 21

**Breakdown Tables:**

- Loss Reason Analysis table: reason, count, % of total lost
- Source Conversion Table: Source, Total, Won, Lost, Conversion %
- Sales Exec Performance: Exec, Assigned, Converted, Avg Days to Convert

---

## SECTION 12 — ADMIN / SETTINGS MODULE

---

### Screen: User Management

**Route:** `/settings/users`
**File:** `src/pages/settings/UserManagement.jsx`

**Table:**
| Column | Content |
|---|---|
| User | Avatar + name + email |
| Role | Role badge |
| Department | Text |
| Status | Active / Inactive badge |
| Last Login | Relative time "2 hours ago" |
| Actions | Edit / Deactivate / Reset Password |

**`+ Add User` button** → Sheet from right:

- Name, Email, Mobile, Department, Designation, Role `Select`, Password (auto-generated option)

---

### Screen: Role & Permission Management

**Route:** `/settings/roles`
**File:** `src/pages/settings/RoleManagement.jsx`

**Layout:** Two-column — roles list (left 3 cols) + permissions matrix (right 9 cols)

**Roles List:**

- Each role as clickable card: name, user count, system role badge
- `+ New Role` button at bottom

**Permissions Matrix:**

- Rows: Modules (Inquiry, Quotation, Orders, Inventory, Dispatch, Jobs, Documents, Reports, Admin)
- Columns: Actions (View, Create, Edit, Delete, Approve, Export)
- Cells: Toggle `Switch` component
- System roles: read-only matrix (cannot modify)

---

### Screen: Master Data Settings

**Route:** `/settings/masters`
**File:** `src/pages/settings/MasterSettings.jsx`

**Tabs:** Inquiry Sources / Tax Rules / Product Categories / Brands / Warehouses / Document Categories / Transporters / Vehicles / Checklist Templates / Certificate Templates

Each tab: simple CRUD table with `+ Add` button, edit inline or via mini Sheet

---

### Screen: Notification List (Dropdown + Full Page)

**Notification Dropdown** (in topbar, triggered by bell icon):

- `DropdownMenuContent align="end" className="w-80"`
- Header: "Notifications" + "Mark all read" link
- List: max 5 items, each:
  - Icon colored by type, title, message `text-xs`, time ago
  - Unread: `bg-blue-50`
  - Click → navigate to related record
- Footer: "View all notifications →" link

**Full Notification Page** `/notifications`:

- Tabs: All / Unread / By Type
- Full list with filters
- Mark as read / Mark all read actions

---

## SECTION 13 — SHARED COMPONENTS

### `PageHeader`

```jsx
// Usage: <PageHeader title="Inquiries" subtitle="142 total" action={<Button>+ New</Button>} />
```

- `h1 text-2xl font-semibold text-slate-800` + subtitle `text-sm text-slate-500`
- Right slot for action button
- Optional breadcrumb below

### `StatCard`

- Icon box, title, value, change indicator
- Hover shadow animation

### `StatusBadge`

```jsx
// Usage: <StatusBadge status="in_progress" />
// Automatically maps to correct colors from design system
```

### `DataTable`

- Wrapper around shadcn `Table` with:
  - Column sort headers
  - Pagination
  - Empty state
  - Loading skeleton (5 skeleton rows)
  - Row hover state

### `FilterBar`

- Composable filter row: accepts filter config array
- Responsive: collapses to "Filters" button + Sheet on mobile

### `ConfirmDialog`

```jsx
// Usage: <ConfirmDialog title="Delete Inquiry?" onConfirm={fn} variant="danger" />
```

- Used for all destructive actions

### `FileUploadZone`

- Dashed border dropzone
- Accepts file types prop
- Shows preview thumbnails for images, file icon for PDFs
- Max size validation display

### `ActivityFeed`

- Reused across Inquiry, Quotation, Order, Job detail pages
- Accepts `activities` array, renders timeline with icons per action type

### `StepProgress`

- Horizontal steps component
- Used for: Order stages, Quotation status, Wizard steps
- Props: steps array, currentStep, completedSteps

### `MiniChart` (Sparkline)

- Tiny `recharts LineChart` without axes
- Used in KPI cards for trend indication

---

## SCREEN INVENTORY (Prompt Build Order)

> Build screens in this exact order — each is a self-contained static component with hardcoded sample data.

| #   | Screen Name                  | Route                         | File                                 | Phase  |
| --- | ---------------------------- | ----------------------------- | ------------------------------------ | ------ |
| 1   | Login Page                   | `/login`                      | `auth/LoginPage.jsx`                 | Static |
| 2   | Forgot Password              | `/forgot-password`            | `auth/ForgotPasswordPage.jsx`        | Static |
| 3   | App Shell + Sidebar + Topbar | Layout                        | `layout/AppShell.jsx`                | Static |
| 4   | Executive Dashboard          | `/dashboard`                  | `dashboard/ExecutiveDashboard.jsx`   | Static |
| 5   | Inquiry List                 | `/inquiries`                  | `inquiries/InquiryList.jsx`          | Static |
| 6   | Create Inquiry               | `/inquiries/new`              | `inquiries/InquiryForm.jsx`          | Static |
| 7   | Inquiry Detail               | `/inquiries/:id`              | `inquiries/InquiryDetail.jsx`        | Static |
| 8   | Quotation List               | `/quotations`                 | `quotations/QuotationList.jsx`       | Static |
| 9   | Quotation Builder            | `/quotations/new`             | `quotations/QuotationBuilder.jsx`    | Static |
| 10  | Quotation Detail             | `/quotations/:id`             | `quotations/QuotationDetail.jsx`     | Static |
| 11  | Order List                   | `/orders`                     | `orders/OrderList.jsx`               | Static |
| 12  | Order Detail                 | `/orders/:id`                 | `orders/OrderDetail.jsx`             | Static |
| 13  | Stock Dashboard              | `/inventory`                  | `inventory/StockDashboard.jsx`       | Static |
| 14  | Product List                 | `/inventory/products`         | `inventory/ProductList.jsx`          | Static |
| 15  | Product Detail               | `/inventory/products/:id`     | `inventory/ProductDetail.jsx`        | Static |
| 16  | Stock Movement Entry         | `/inventory/stock/inward`     | `inventory/StockEntryForm.jsx`       | Static |
| 17  | Dispatch Dashboard           | `/dispatch`                   | `dispatch/DispatchDashboard.jsx`     | Static |
| 18  | Challan List                 | `/dispatch/challans`          | `dispatch/ChallanList.jsx`           | Static |
| 19  | Challan Creation             | `/dispatch/challans/new`      | `dispatch/ChallanForm.jsx`           | Static |
| 20  | Jobs List (Web)              | `/jobs`                       | `jobs/JobList.jsx`                   | Static |
| 21  | Job Detail (Web)             | `/jobs/:id`                   | `jobs/JobDetail.jsx`                 | Static |
| 22  | Engineer Roster              | `/jobs/engineers`             | `jobs/EngineerRoster.jsx`            | Static |
| 23  | Mobile Job List              | `/m/jobs`                     | `mobile/EngineerJobList.jsx`         | Static |
| 24  | Mobile Job Detail            | `/m/jobs/:id`                 | `mobile/EngineerJobDetail.jsx`       | Static |
| 25  | Invoice Management           | `/documents/invoices`         | `documents/InvoiceList.jsx`          | Static |
| 26  | Document Repository          | `/documents`                  | `documents/DocumentRepository.jsx`   | Static |
| 27  | Serial Number Tracker        | `/documents/serial-numbers`   | `documents/SerialNumberTracker.jsx`  | Static |
| 28  | Certificate Wizard           | `/documents/certificates/new` | `documents/CertificateWizard.jsx`    | Static |
| 29  | Client Login                 | `/portal/login`               | `portal/PortalLogin.jsx`             | Static |
| 30  | Client Dashboard             | `/portal/dashboard`           | `portal/ClientDashboard.jsx`         | Static |
| 31  | Client Order Tracking        | `/portal/orders/:id`          | `portal/ClientOrderDetail.jsx`       | Static |
| 32  | Client Documents             | `/portal/documents`           | `portal/ClientDocuments.jsx`         | Static |
| 33  | Client Search                | `/portal/search`              | `portal/ClientSearch.jsx`            | Static |
| 34  | Reports Hub                  | `/reports`                    | `reports/ReportsHub.jsx`             | Static |
| 35  | Report Viewer                | `/reports/:id`                | `reports/ReportViewer.jsx`           | Static |
| 36  | User Management              | `/settings/users`             | `settings/UserManagement.jsx`        | Static |
| 37  | Role & Permissions           | `/settings/roles`             | `settings/RoleManagement.jsx`        | Static |
| 38  | Master Data Settings         | `/settings/masters`           | `settings/MasterSettings.jsx`        | Static |
| 39  | Notifications Page           | `/notifications`              | `notifications/NotificationList.jsx` | Static |

---

## SAMPLE DATA REFERENCE

> Use these static values consistently across all screens during the static build phase.

### Sample Customers

```js
const customers = [
  {
    id: 1,
    company_name: "Rajesh Builders Pvt Ltd",
    type: "contractor",
    city: "Mumbai",
    mobile: "9876543210",
  },
  {
    id: 2,
    company_name: "Aggarwal Fire Safety",
    type: "dealer",
    city: "Delhi",
    mobile: "9123456780",
  },
  {
    id: 3,
    company_name: "Metro Infrastructure",
    type: "company",
    city: "Pune",
    mobile: "9988776655",
  },
];
```

### Sample Inquiries

```js
const inquiries = [
  {
    id: "INQ-0142",
    customer: "Rajesh Builders",
    project: "Andheri Commercial Tower",
    priority: "high",
    status: "in_progress",
    assigned: "Vikram Shah",
  },
  {
    id: "INQ-0141",
    customer: "Aggarwal Fire Safety",
    project: "Sector 18 Mall",
    priority: "medium",
    status: "quoted",
    assigned: "Priya Nair",
  },
  {
    id: "INQ-0140",
    customer: "Metro Infrastructure",
    project: "Pune Metro Phase 2",
    priority: "high",
    status: "new",
    assigned: null,
  },
];
```

### Sample Products

```js
const products = [
  {
    code: "PRD-001",
    name: "Kirloskar Fire Pump KDS 615+",
    category: "Fire Pump",
    brand: "Kirloskar",
    stock: 12,
    reserved: 3,
    price: 185000,
  },
  {
    code: "PRD-002",
    name: "Grundfos Jockey Pump CM10-3",
    category: "Jockey Pump",
    brand: "Grundfos",
    stock: 5,
    reserved: 2,
    price: 42000,
  },
  {
    code: "PRD-003",
    name: "MS Hose Reel Cabinet 30m",
    category: "Fire Fighting",
    brand: "Local",
    stock: 28,
    reserved: 8,
    price: 8500,
  },
];
```

### Sample Orders

```js
const orders = [
  {
    id: "SO-0042",
    customer: "Rajesh Builders",
    project: "Andheri Tower",
    status: "processing",
    stage: 2,
    total: 485000,
    order_date: "2026-04-01",
  },
  {
    id: "SO-0041",
    customer: "Aggarwal Fire",
    project: "Sector 18 Mall",
    status: "ready_to_dispatch",
    stage: 3,
    total: 128000,
    order_date: "2026-03-28",
  },
];
```

### Sample Engineers

```js
const engineers = [
  {
    id: 1,
    name: "Suresh Kumar",
    designation: "Senior Engineer",
    location: "Mumbai",
    skills: ["Fire Pump", "Sprinkler"],
    status: "on_site",
  },
  {
    id: 2,
    name: "Ramesh Patil",
    designation: "Engineer",
    location: "Pune",
    skills: ["AMC", "Commissioning"],
    status: "available",
  },
];
```
