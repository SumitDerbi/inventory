# Phase 1 — Static UI

> Goal: ship a **clickable, pixel-faithful** React UI using mock data. Host it, collect client sign-off on fields, flows, look & feel. Zero backend work in this phase.

---

## Ordered steps

| #   | Step                                                                                   | Status                                      |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| 01  | [Project setup & tooling](./01-setup.md)                                               | ✅                                          |
| 02  | [Design system & tokens](./02-design-system.md)                                        | ✅                                          |
| 03  | [App shell (sidebar, topbar, router)](./03-app-shell.md)                               | ✅                                          |
| 04  | [Auth screens (login, forgot)](./04-auth.md)                                           | ✅                                          |
| 05  | [Executive dashboard](./05-dashboard.md)                                               | ✅                                          |
| 06  | [Inquiry module](./06-inquiries.md)                                                    | ✅                                          |
| 07  | [Quotation module](./07-quotations.md)                                                 | ✅                                          |
| 08  | [Sales order module](./08-sales-orders.md)                                             | ✅                                          |
| 09  | [Inventory module](./09-inventory.md)                                                  | ✅                                          |
| 10  | [Dispatch & logistics](./10-dispatch.md)                                               | ✅                                          |
| 11  | [Engineer & installation jobs](./11-jobs-engineer.md)                                  | ✅                                          |
| 12  | [Documents module](./12-documents.md)                                                  | ✅                                          |
| 13  | [Reports & analytics](./13-reports.md)                                                 | ✅                                          |
| 14  | [Admin (users, roles, settings)](./14-admin.md)                                        | ✅                                          |
| 15  | [Static deploy + client review](./15-static-deploy.md)                                 | 🟡 (code-side ✅, hosting/sign-off pending) |
| 16  | [UI gap closure (search, bulk, sessions, 2FA, customer merge)](./16-ui-gap-closure.md) | ✅                                          |
| 17  | [Purchase & procurement module](./17-purchase.md)                                      | ☐                                           |

Tick boxes above as each step's **Verification** block passes. For each screen, follow [../SKILL.md §1](../SKILL.md).

---

## Exit criteria for Phase 1

- [ ] All 17 steps ticked.
- [ ] App hosted on a preview URL (Netlify/Vercel/GH Pages or Django `staticfiles` preview).
- [ ] Client written sign-off on look & feel + field list + flows.
- [ ] Zero console errors, Lighthouse ≥ 90 on Performance, Accessibility.

**Next phase:** [../phase-2-backend-api/00-overview.md](../phase-2-backend-api/00-overview.md).
