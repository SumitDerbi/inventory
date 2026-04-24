# Step 09 — Inventory (Static UI)

> Before this: [08-sales-orders.md](./08-sales-orders.md)
> Spec: [docs/development_spec.md Module 4](../../docs/development_spec.md), [docs/project_details.md §4](../../docs/project_details.md)

---

## Objective

Static UI for product master, stock ledger, warehouse views, reservations, reorder alerts, adjustments.

---

## Sub-screens

1. **Products List** — `/inventory/products`
   - Columns: SKU, Name, Category, Brand, UoM, Current Stock, Reserved, Available, Reorder Pt, Status.
   - Filters: category, brand, warehouse, stock status (in/low/out).
   - Low-stock rows highlighted with `bg-amber-50`, out-of-stock with `bg-red-50`.
2. **Product Detail** — `/inventory/products/:id`
   - Tabs: `Specifications`, `Stock by Warehouse`, `Ledger`, `Reservations`, `Pricing`, `Attachments`.
   - Ledger: infinite scroll list of movements with doc ref.
3. **Stock Movements / Adjustments** — `/inventory/adjustments`
   - Create adjustment dialog: warehouse, product, qty +/-, reason code, remark, authoriser.
4. **Warehouses** — `/inventory/warehouses`
   - List + detail with zones/racks (UI stub).
5. **Reorder Alerts** — `/inventory/reorder`
   - Table of items at or below reorder point with suggested PO qty.
6. **Reservations view** — `/inventory/reservations` — order-linked reservation entries.
7. **Stock Dashboard** widget-strip: total SKUs, low stock count, out-of-stock count, stock value ₹.

---

## Mock data

- `src/mocks/products.js` ≥ 40 products covering pumps, fire fighting, spares; technical spec attributes per product.
- `src/mocks/warehouses.js` (3 warehouses), `mocks/stockLedger.js` (≥ 200 movements).

---

## Verification

- [ ] Product detail shows spec attributes in key-value grid.
- [ ] Ledger entries show running balance column.
- [ ] Low-stock + out-of-stock highlighting works across list + dashboard strip.
- [ ] Adjustment dialog requires reason code + authoriser fields.
- [ ] Reservation list links back to order.
- [ ] Commit: `feat(ui): inventory module static`.

---

**Next:** [10-dispatch.md](./10-dispatch.md)
