# Advanced Business Process Automation System

## Development Specification Document

### Pump & Fire Fighting Products Industry

---

# PART A — DATABASE SCHEMA (All Modules)

> All tables include standard audit columns unless noted:
> `id` (PK, UUID or auto-increment), `created_at` (datetime), `updated_at` (datetime), `created_by` (FK → users), `updated_by` (FK → users), `is_deleted` (boolean, soft delete).

---

## SHARED / MASTER TABLES

### `customers`

| Field               | Type                                              | Required | Notes                   |
| ------------------- | ------------------------------------------------- | -------- | ----------------------- |
| id                  | BIGINT / UUID                                     | Yes      | Primary key             |
| customer_type       | ENUM('dealer', 'contractor', 'direct', 'company') | Yes      |                         |
| company_name        | VARCHAR(255)                                      | Yes      |                         |
| contact_person_name | VARCHAR(100)                                      | No       |                         |
| mobile              | VARCHAR(20)                                       | Yes      | Used for dedup          |
| alternate_mobile    | VARCHAR(20)                                       | No       |                         |
| email               | VARCHAR(150)                                      | No       |                         |
| gst_number          | VARCHAR(20)                                       | No       | For dedup and invoicing |
| pan_number          | VARCHAR(20)                                       | No       |                         |
| address_line1       | TEXT                                              | No       |                         |
| address_line2       | TEXT                                              | No       |                         |
| city                | VARCHAR(100)                                      | No       |                         |
| state               | VARCHAR(100)                                      | No       |                         |
| pincode             | VARCHAR(10)                                       | No       |                         |
| assigned_sales_exec | FK → users                                        | No       |                         |
| territory           | VARCHAR(100)                                      | No       |                         |
| credit_limit        | DECIMAL(15,2)                                     | No       |                         |
| credit_days         | INT                                               | No       |                         |
| status              | ENUM('active', 'inactive', 'blacklisted')         | Yes      | Default: active         |
| notes               | TEXT                                              | No       |                         |

---

### `contacts`

| Field       | Type           | Required | Notes          |
| ----------- | -------------- | -------- | -------------- |
| id          | BIGINT         | Yes      |                |
| customer_id | FK → customers | Yes      |                |
| name        | VARCHAR(100)   | Yes      |                |
| designation | VARCHAR(100)   | No       |                |
| mobile      | VARCHAR(20)    | Yes      |                |
| email       | VARCHAR(150)   | No       |                |
| is_primary  | BOOLEAN        | Yes      | Default: false |
| department  | VARCHAR(100)   | No       |                |

---

### `addresses`

| Field          | Type                                | Required | Notes                        |
| -------------- | ----------------------------------- | -------- | ---------------------------- |
| id             | BIGINT                              | Yes      |                              |
| customer_id    | FK → customers                      | Yes      |                              |
| address_type   | ENUM('billing', 'shipping', 'site') | Yes      |                              |
| label          | VARCHAR(100)                        | No       | e.g. "Main Office", "Site A" |
| address_line1  | TEXT                                | Yes      |                              |
| address_line2  | TEXT                                | No       |                              |
| city           | VARCHAR(100)                        | Yes      |                              |
| state          | VARCHAR(100)                        | Yes      |                              |
| pincode        | VARCHAR(10)                         | Yes      |                              |
| contact_person | VARCHAR(100)                        | No       | Site contact name            |
| contact_mobile | VARCHAR(20)                         | No       |                              |
| is_default     | BOOLEAN                             | Yes      | Default: false               |

---

### `tax_rules`

| Field         | Type                                         | Required | Notes          |
| ------------- | -------------------------------------------- | -------- | -------------- |
| id            | BIGINT                                       | Yes      |                |
| name          | VARCHAR(100)                                 | Yes      | e.g. "GST 18%" |
| tax_type      | ENUM('GST', 'IGST', 'VAT', 'EXEMPT')         | Yes      |                |
| rate_percent  | DECIMAL(5,2)                                 | Yes      |                |
| applicable_to | ENUM('product', 'freight', 'service', 'all') | Yes      |                |
| is_active     | BOOLEAN                                      | Yes      |                |

---

### `users` _(also Auth — see Module 10)_

| Field         | Type         | Required | Notes            |
| ------------- | ------------ | -------- | ---------------- |
| id            | BIGINT       | Yes      |                  |
| name          | VARCHAR(100) | Yes      |                  |
| email         | VARCHAR(150) | Yes      | Unique           |
| password_hash | VARCHAR(255) | Yes      | Bcrypt           |
| mobile        | VARCHAR(20)  | No       |                  |
| employee_code | VARCHAR(50)  | No       |                  |
| department    | VARCHAR(100) | No       |                  |
| designation   | VARCHAR(100) | No       |                  |
| role_id       | FK → roles   | Yes      |                  |
| is_active     | BOOLEAN      | Yes      |                  |
| last_login    | DATETIME     | No       |                  |
| profile_photo | VARCHAR(500) | No       | File path or URL |
| notes         | TEXT         | No       |                  |

---

### `attachments`

| Field        | Type         | Required | Notes                          |
| ------------ | ------------ | -------- | ------------------------------ |
| id           | BIGINT       | Yes      |                                |
| entity_type  | VARCHAR(50)  | Yes      | e.g. 'inquiry', 'order', 'job' |
| entity_id    | BIGINT       | Yes      | Polymorphic FK                 |
| file_name    | VARCHAR(255) | Yes      |                                |
| file_path    | VARCHAR(500) | Yes      | Storage path or URL            |
| file_size_kb | INT          | No       |                                |
| mime_type    | VARCHAR(100) | No       |                                |
| uploaded_by  | FK → users   | Yes      |                                |
| version      | INT          | Yes      | Default: 1                     |
| is_latest    | BOOLEAN      | Yes      | Default: true                  |
| notes        | TEXT         | No       |                                |

---

### `notifications`

| Field       | Type         | Required | Notes                               |
| ----------- | ------------ | -------- | ----------------------------------- |
| id          | BIGINT       | Yes      |                                     |
| user_id     | FK → users   | Yes      | Recipient                           |
| type        | VARCHAR(100) | Yes      | e.g. 'follow_up_due', 'order_ready' |
| title       | VARCHAR(255) | Yes      |                                     |
| message     | TEXT         | Yes      |                                     |
| entity_type | VARCHAR(50)  | No       | Linked entity type                  |
| entity_id   | BIGINT       | No       | Linked entity ID                    |
| is_read     | BOOLEAN      | Yes      | Default: false                      |
| sent_at     | DATETIME     | Yes      |                                     |
| read_at     | DATETIME     | No       |                                     |

---

## MODULE 1 — INQUIRY MANAGEMENT

### `inquiries`

| Field               | Type                                                                 | Required | Notes                              |
| ------------------- | -------------------------------------------------------------------- | -------- | ---------------------------------- |
| id                  | BIGINT                                                               | Yes      |                                    |
| inquiry_number      | VARCHAR(50)                                                          | Yes      | System-generated, unique           |
| source_id           | FK → inquiry_sources                                                 | Yes      |                                    |
| customer_id         | FK → customers                                                       | No       | Nullable until customer created    |
| customer_name       | VARCHAR(255)                                                         | Yes      | Free-text at capture time          |
| company_name        | VARCHAR(255)                                                         | No       |                                    |
| mobile              | VARCHAR(20)                                                          | Yes      |                                    |
| email               | VARCHAR(150)                                                         | No       |                                    |
| city                | VARCHAR(100)                                                         | No       |                                    |
| state               | VARCHAR(100)                                                         | No       |                                    |
| project_name        | VARCHAR(255)                                                         | No       |                                    |
| project_description | TEXT                                                                 | No       |                                    |
| product_category    | FK → product_categories                                              | No       | Primary product type               |
| inquiry_type        | ENUM('new_project', 'spare_parts', 'amc', 'service', 'other')        | Yes      |                                    |
| priority            | ENUM('high', 'medium', 'low')                                        | Yes      | Default: medium                    |
| status              | ENUM('new', 'in_progress', 'quoted', 'converted', 'lost', 'on_hold') | Yes      | Default: new                       |
| assigned_to         | FK → users                                                           | No       | Sales executive                    |
| expected_order_date | DATE                                                                 | No       |                                    |
| site_location       | TEXT                                                                 | No       |                                    |
| budget_range        | VARCHAR(100)                                                         | No       |                                    |
| source_reference    | VARCHAR(255)                                                         | No       | Dealer name, website form ID, etc. |
| lost_reason         | TEXT                                                                 | No       | Required when status = lost        |
| notes               | TEXT                                                                 | No       |                                    |

---

### `inquiry_sources`

| Field     | Type         | Required | Notes                                      |
| --------- | ------------ | -------- | ------------------------------------------ |
| id        | BIGINT       | Yes      |                                            |
| name      | VARCHAR(100) | Yes      | e.g. 'Dealer', 'Website', 'Direct Walk-in' |
| is_active | BOOLEAN      | Yes      |                                            |

---

### `inquiry_line_items`

| Field               | Type           | Required | Notes                                 |
| ------------------- | -------------- | -------- | ------------------------------------- |
| id                  | BIGINT         | Yes      |                                       |
| inquiry_id          | FK → inquiries | Yes      |                                       |
| product_id          | FK → products  | No       | Optional if product not yet in master |
| product_description | VARCHAR(255)   | Yes      | Free-text description                 |
| category            | VARCHAR(100)   | No       |                                       |
| specification_notes | TEXT           | No       | Technical requirements                |
| quantity            | DECIMAL(10,2)  | Yes      |                                       |
| unit                | VARCHAR(50)    | No       | e.g. 'pcs', 'set', 'lot'              |
| estimated_value     | DECIMAL(15,2)  | No       |                                       |
| notes               | TEXT           | No       |                                       |

---

### `inquiry_follow_ups`

| Field               | Type                                                  | Required | Notes                    |
| ------------------- | ----------------------------------------------------- | -------- | ------------------------ |
| id                  | BIGINT                                                | Yes      |                          |
| inquiry_id          | FK → inquiries                                        | Yes      |                          |
| follow_up_type      | ENUM('call', 'email', 'visit', 'whatsapp', 'meeting') | Yes      |                          |
| scheduled_at        | DATETIME                                              | Yes      |                          |
| completed_at        | DATETIME                                              | No       |                          |
| status              | ENUM('pending', 'completed', 'missed', 'rescheduled') | Yes      | Default: pending         |
| outcome             | TEXT                                                  | No       | Notes from the follow-up |
| next_follow_up_date | DATE                                                  | No       |                          |
| assigned_to         | FK → users                                            | Yes      |                          |

---

### `inquiry_activity_logs`

| Field        | Type           | Required | Notes                                           |
| ------------ | -------------- | -------- | ----------------------------------------------- |
| id           | BIGINT         | Yes      |                                                 |
| inquiry_id   | FK → inquiries | Yes      |                                                 |
| action_type  | VARCHAR(100)   | Yes      | e.g. 'status_changed', 'assigned', 'note_added' |
| old_value    | TEXT           | No       |                                                 |
| new_value    | TEXT           | No       |                                                 |
| remarks      | TEXT           | No       |                                                 |
| performed_by | FK → users     | Yes      |                                                 |
| performed_at | DATETIME       | Yes      |                                                 |

---

## MODULE 2 — QUOTATION MANAGEMENT

### `quotations`

| Field                | Type                                                                                                  | Required | Notes                           |
| -------------------- | ----------------------------------------------------------------------------------------------------- | -------- | ------------------------------- |
| id                   | BIGINT                                                                                                | Yes      |                                 |
| quotation_number     | VARCHAR(50)                                                                                           | Yes      | System-generated, unique        |
| version_number       | INT                                                                                                   | Yes      | Starts at 1                     |
| inquiry_id           | FK → inquiries                                                                                        | No       | Optional link                   |
| customer_id          | FK → customers                                                                                        | Yes      |                                 |
| contact_id           | FK → contacts                                                                                         | No       | Specific contact for this quote |
| billing_address_id   | FK → addresses                                                                                        | No       |                                 |
| shipping_address_id  | FK → addresses                                                                                        | No       |                                 |
| site_address         | TEXT                                                                                                  | No       | Free-text site address          |
| project_name         | VARCHAR(255)                                                                                          | No       |                                 |
| quotation_date       | DATE                                                                                                  | Yes      |                                 |
| valid_until          | DATE                                                                                                  | Yes      |                                 |
| status               | ENUM('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired', 'converted') | Yes      | Default: draft                  |
| prepared_by          | FK → users                                                                                            | Yes      |                                 |
| approved_by          | FK → users                                                                                            | No       |                                 |
| approved_at          | DATETIME                                                                                              | No       |                                 |
| currency             | VARCHAR(10)                                                                                           | Yes      | Default: INR                    |
| subtotal             | DECIMAL(15,2)                                                                                         | Yes      |                                 |
| total_discount       | DECIMAL(15,2)                                                                                         | Yes      | Default: 0                      |
| total_tax            | DECIMAL(15,2)                                                                                         | Yes      | Default: 0                      |
| freight_amount       | DECIMAL(15,2)                                                                                         | Yes      | Default: 0                      |
| other_charges        | DECIMAL(15,2)                                                                                         | Yes      | Default: 0                      |
| grand_total          | DECIMAL(15,2)                                                                                         | Yes      |                                 |
| gross_margin_percent | DECIMAL(5,2)                                                                                          | No       | Calculated                      |
| payment_terms        | TEXT                                                                                                  | No       |                                 |
| delivery_terms       | TEXT                                                                                                  | No       |                                 |
| warranty_terms       | TEXT                                                                                                  | No       |                                 |
| scope_of_supply      | TEXT                                                                                                  | No       | What is included                |
| exclusions           | TEXT                                                                                                  | No       | What is excluded                |
| notes                | TEXT                                                                                                  | No       |                                 |
| pdf_path             | VARCHAR(500)                                                                                          | No       | Generated PDF location          |
| sent_at              | DATETIME                                                                                              | No       | When emailed to customer        |
| parent_quotation_id  | FK → quotations                                                                                       | No       | For revised quotes              |

---

### `quotation_items`

| Field               | Type            | Required | Notes               |
| ------------------- | --------------- | -------- | ------------------- |
| id                  | BIGINT          | Yes      |                     |
| quotation_id        | FK → quotations | Yes      |                     |
| product_id          | FK → products   | No       |                     |
| product_code        | VARCHAR(100)    | No       |                     |
| product_description | TEXT            | Yes      | As printed on quote |
| brand               | VARCHAR(100)    | No       |                     |
| model_number        | VARCHAR(100)    | No       |                     |
| specifications      | TEXT            | No       |                     |
| quantity            | DECIMAL(10,2)   | Yes      |                     |
| unit                | VARCHAR(50)     | Yes      |                     |
| unit_cost           | DECIMAL(15,2)   | Yes      | Internal cost       |
| unit_price          | DECIMAL(15,2)   | Yes      | Selling price       |
| discount_percent    | DECIMAL(5,2)    | Yes      | Default: 0          |
| discount_amount     | DECIMAL(15,2)   | Yes      | Calculated          |
| tax_rule_id         | FK → tax_rules  | No       |                     |
| tax_amount          | DECIMAL(15,2)   | Yes      | Calculated          |
| line_total          | DECIMAL(15,2)   | Yes      | Calculated          |
| sort_order          | INT             | No       | Display order       |
| notes               | TEXT            | No       |                     |

---

### `quotation_approval_steps`

| Field          | Type                                               | Required | Notes                    |
| -------------- | -------------------------------------------------- | -------- | ------------------------ |
| id             | BIGINT                                             | Yes      |                          |
| quotation_id   | FK → quotations                                    | Yes      |                          |
| step_order     | INT                                                | Yes      |                          |
| approver_id    | FK → users                                         | Yes      |                          |
| status         | ENUM('pending', 'approved', 'rejected', 'skipped') | Yes      | Default: pending         |
| action_at      | DATETIME                                           | No       |                          |
| comments       | TEXT                                               | No       |                          |
| condition_type | VARCHAR(100)                                       | No       | e.g. 'discount_above_15' |

---

### `price_rules`

| Field          | Type                                                                       | Required | Notes                |
| -------------- | -------------------------------------------------------------------------- | -------- | -------------------- |
| id             | BIGINT                                                                     | Yes      |                      |
| name           | VARCHAR(100)                                                               | Yes      |                      |
| rule_type      | ENUM('cost_plus_margin', 'list_price', 'dealer_price', 'project_specific') | Yes      |                      |
| product_id     | FK → products                                                              | No       | If product-specific  |
| category_id    | FK → product_categories                                                    | No       | If category-specific |
| customer_type  | ENUM('dealer', 'contractor', 'direct')                                     | No       |                      |
| base_price     | DECIMAL(15,2)                                                              | No       |                      |
| margin_percent | DECIMAL(5,2)                                                               | No       |                      |
| valid_from     | DATE                                                                       | No       |                      |
| valid_to       | DATE                                                                       | No       |                      |
| is_active      | BOOLEAN                                                                    | Yes      |                      |

---

### `discount_rules`

| Field                   | Type                                                | Required | Notes                         |
| ----------------------- | --------------------------------------------------- | -------- | ----------------------------- |
| id                      | BIGINT                                              | Yes      |                               |
| name                    | VARCHAR(100)                                        | Yes      |                               |
| max_discount_percent    | DECIMAL(5,2)                                        | Yes      |                               |
| requires_approval_above | DECIMAL(5,2)                                        | No       | Threshold to trigger approval |
| applicable_to           | ENUM('all', 'product', 'category', 'customer_type') | Yes      |                               |
| entity_id               | BIGINT                                              | No       | FK to product or category     |
| is_active               | BOOLEAN                                             | Yes      |                               |

---

## MODULE 3 — SALES ORDER & WORKFLOW

### `sales_orders`

| Field                  | Type                                                                                                                                          | Required | Notes                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------ |
| id                     | BIGINT                                                                                                                                        | Yes      |                          |
| order_number           | VARCHAR(50)                                                                                                                                   | Yes      | System-generated, unique |
| quotation_id           | FK → quotations                                                                                                                               | No       | Source quotation         |
| customer_id            | FK → customers                                                                                                                                | Yes      |                          |
| contact_id             | FK → contacts                                                                                                                                 | No       |                          |
| billing_address_id     | FK → addresses                                                                                                                                | No       |                          |
| shipping_address_id    | FK → addresses                                                                                                                                | No       |                          |
| project_name           | VARCHAR(255)                                                                                                                                  | No       |                          |
| status                 | ENUM('draft', 'confirmed', 'processing', 'ready_to_dispatch', 'partially_dispatched', 'fully_dispatched', 'installed', 'closed', 'cancelled') | Yes      | Default: draft           |
| order_date             | DATE                                                                                                                                          | Yes      |                          |
| expected_delivery_date | DATE                                                                                                                                          | No       |                          |
| confirmed_at           | DATETIME                                                                                                                                      | No       |                          |
| confirmed_by           | FK → users                                                                                                                                    | No       |                          |
| assigned_sales_exec    | FK → users                                                                                                                                    | No       |                          |
| payment_terms          | TEXT                                                                                                                                          | No       |                          |
| delivery_terms         | TEXT                                                                                                                                          | No       |                          |
| special_instructions   | TEXT                                                                                                                                          | No       |                          |
| subtotal               | DECIMAL(15,2)                                                                                                                                 | Yes      |                          |
| total_discount         | DECIMAL(15,2)                                                                                                                                 | Yes      |                          |
| total_tax              | DECIMAL(15,2)                                                                                                                                 | Yes      |                          |
| freight_amount         | DECIMAL(15,2)                                                                                                                                 | Yes      |                          |
| grand_total            | DECIMAL(15,2)                                                                                                                                 | Yes      |                          |
| cancellation_reason    | TEXT                                                                                                                                          | No       |                          |
| notes                  | TEXT                                                                                                                                          | No       |                          |

---

### `sales_order_items`

| Field               | Type                                                            | Required | Notes                          |
| ------------------- | --------------------------------------------------------------- | -------- | ------------------------------ |
| id                  | BIGINT                                                          | Yes      |                                |
| order_id            | FK → sales_orders                                               | Yes      |                                |
| product_id          | FK → products                                                   | No       |                                |
| product_description | TEXT                                                            | Yes      |                                |
| quantity_ordered    | DECIMAL(10,2)                                                   | Yes      |                                |
| quantity_dispatched | DECIMAL(10,2)                                                   | Yes      | Default: 0                     |
| quantity_pending    | DECIMAL(10,2)                                                   | Yes      | Computed: ordered - dispatched |
| unit                | VARCHAR(50)                                                     | Yes      |                                |
| unit_price          | DECIMAL(15,2)                                                   | Yes      |                                |
| discount_percent    | DECIMAL(5,2)                                                    | Yes      |                                |
| tax_rule_id         | FK → tax_rules                                                  | No       |                                |
| line_total          | DECIMAL(15,2)                                                   | Yes      |                                |
| status              | ENUM('pending', 'reserved', 'ready', 'dispatched', 'cancelled') | Yes      | Default: pending               |
| notes               | TEXT                                                            | No       |                                |

---

### `order_milestones`

| Field          | Type                                    | Required | Notes                              |
| -------------- | --------------------------------------- | -------- | ---------------------------------- |
| id             | BIGINT                                  | Yes      |                                    |
| order_id       | FK → sales_orders                       | Yes      |                                    |
| milestone_name | VARCHAR(255)                            | Yes      | e.g. 'PO Received', 'Advance Paid' |
| target_date    | DATE                                    | No       |                                    |
| completed_at   | DATETIME                                | No       |                                    |
| status         | ENUM('pending', 'completed', 'overdue') | Yes      |                                    |
| notes          | TEXT                                    | No       |                                    |

---

### `material_checklists`

| Field         | Type                                                           | Required | Notes           |
| ------------- | -------------------------------------------------------------- | -------- | --------------- |
| id            | BIGINT                                                         | Yes      |                 |
| order_id      | FK → sales_orders                                              | Yes      |                 |
| order_item_id | FK → sales_order_items                                         | No       |                 |
| product_id    | FK → products                                                  | No       |                 |
| description   | VARCHAR(255)                                                   | Yes      | Material needed |
| required_qty  | DECIMAL(10,2)                                                  | Yes      |                 |
| available_qty | DECIMAL(10,2)                                                  | No       | From stock      |
| shortage_qty  | DECIMAL(10,2)                                                  | No       | Computed        |
| status        | ENUM('available', 'partial', 'shortage', 'procuring', 'ready') | Yes      |                 |
| notes         | TEXT                                                           | No       |                 |

---

### `installation_requirements`

| Field                     | Type                                             | Required | Notes            |
| ------------------------- | ------------------------------------------------ | -------- | ---------------- |
| id                        | BIGINT                                           | Yes      |                  |
| order_id                  | FK → sales_orders                                | Yes      |                  |
| site_address              | TEXT                                             | Yes      |                  |
| site_contact_name         | VARCHAR(100)                                     | No       |                  |
| site_contact_mobile       | VARCHAR(20)                                      | No       |                  |
| civil_readiness           | ENUM('ready', 'not_ready', 'partial', 'unknown') | Yes      | Default: unknown |
| electrical_readiness      | ENUM('ready', 'not_ready', 'partial', 'unknown') | Yes      |                  |
| expected_install_date     | DATE                                             | No       |                  |
| special_site_requirements | TEXT                                             | No       |                  |
| access_instructions       | TEXT                                             | No       |                  |
| permissions_required      | BOOLEAN                                          | Yes      | Default: false   |
| permission_details        | TEXT                                             | No       |                  |

---

## MODULE 4 — INVENTORY MANAGEMENT

### `product_categories`

| Field              | Type                    | Required | Notes                      |
| ------------------ | ----------------------- | -------- | -------------------------- |
| id                 | BIGINT                  | Yes      |                            |
| name               | VARCHAR(100)            | Yes      | e.g. 'Fire Fighting Pumps' |
| parent_category_id | FK → product_categories | No       | For sub-categories         |
| description        | TEXT                    | No       |                            |
| is_active          | BOOLEAN                 | Yes      |                            |

---

### `brands`

| Field             | Type         | Required | Notes |
| ----------------- | ------------ | -------- | ----- |
| id                | BIGINT       | Yes      |       |
| name              | VARCHAR(100) | Yes      |       |
| country_of_origin | VARCHAR(100) | No       |       |
| is_active         | BOOLEAN      | Yes      |       |
| notes             | TEXT         | No       |       |

---

### `products`

| Field           | Type                    | Required | Notes                      |
| --------------- | ----------------------- | -------- | -------------------------- |
| id              | BIGINT                  | Yes      |                            |
| product_code    | VARCHAR(100)            | Yes      | Unique                     |
| name            | VARCHAR(255)            | Yes      |                            |
| category_id     | FK → product_categories | Yes      |                            |
| brand_id        | FK → brands             | No       |                            |
| model_number    | VARCHAR(100)            | No       |                            |
| description     | TEXT                    | No       |                            |
| unit_of_measure | VARCHAR(50)             | Yes      | e.g. 'pcs', 'set', 'meter' |
| hsn_code        | VARCHAR(20)             | No       | For GST                    |
| tax_rule_id     | FK → tax_rules          | No       | Default tax                |
| purchase_price  | DECIMAL(15,2)           | No       | Default cost               |
| selling_price   | DECIMAL(15,2)           | No       | List price                 |
| minimum_stock   | DECIMAL(10,2)           | Yes      | Default: 0                 |
| reorder_point   | DECIMAL(10,2)           | Yes      | Default: 0                 |
| is_serialized   | BOOLEAN                 | Yes      | Requires serial tracking   |
| is_active       | BOOLEAN                 | Yes      |                            |
| weight_kg       | DECIMAL(10,3)           | No       |                            |
| dimensions      | VARCHAR(100)            | No       | LxWxH                      |
| warranty_months | INT                     | No       |                            |
| notes           | TEXT                    | No       |                            |

---

### `product_specifications`

| Field      | Type          | Required | Notes                            |
| ---------- | ------------- | -------- | -------------------------------- |
| id         | BIGINT        | Yes      |                                  |
| product_id | FK → products | Yes      |                                  |
| spec_key   | VARCHAR(100)  | Yes      | e.g. 'Power Rating', 'Flow Rate' |
| spec_value | VARCHAR(255)  | Yes      | e.g. '5.5 kW', '500 LPM'         |
| unit       | VARCHAR(50)   | No       |                                  |

---

### `warehouses`

| Field      | Type         | Required | Notes  |
| ---------- | ------------ | -------- | ------ |
| id         | BIGINT       | Yes      |        |
| name       | VARCHAR(100) | Yes      |        |
| code       | VARCHAR(50)  | Yes      | Unique |
| address    | TEXT         | No       |        |
| manager_id | FK → users   | No       |        |
| is_active  | BOOLEAN      | Yes      |        |

---

### `stock_ledger`

| Field            | Type                                                                                                                                 | Required | Notes                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------- |
| id               | BIGINT                                                                                                                               | Yes      |                                           |
| product_id       | FK → products                                                                                                                        | Yes      |                                           |
| warehouse_id     | FK → warehouses                                                                                                                      | Yes      |                                           |
| transaction_type | ENUM('inward_purchase', 'inward_return', 'outward_sale', 'outward_dispatch', 'transfer_in', 'transfer_out', 'adjustment', 'opening') | Yes      |                                           |
| reference_type   | VARCHAR(50)                                                                                                                          | No       | e.g. 'purchase_order', 'sales_order'      |
| reference_id     | BIGINT                                                                                                                               | No       | Polymorphic                               |
| reference_number | VARCHAR(100)                                                                                                                         | No       |                                           |
| quantity         | DECIMAL(10,3)                                                                                                                        | Yes      | Positive for inward, negative for outward |
| unit_cost        | DECIMAL(15,2)                                                                                                                        | No       |                                           |
| batch_number     | VARCHAR(100)                                                                                                                         | No       |                                           |
| serial_number    | VARCHAR(100)                                                                                                                         | No       | For serialized products                   |
| remarks          | TEXT                                                                                                                                 | No       |                                           |
| transacted_at    | DATETIME                                                                                                                             | Yes      |                                           |

---

### `stock_summary` _(view or maintained table)_

| Field           | Type            | Required | Notes               |
| --------------- | --------------- | -------- | ------------------- |
| product_id      | FK → products   | Yes      |                     |
| warehouse_id    | FK → warehouses | Yes      |                     |
| total_stock     | DECIMAL(10,3)   | Yes      | Physical qty        |
| reserved_stock  | DECIMAL(10,3)   | Yes      | Against open orders |
| available_stock | DECIMAL(10,3)   | Yes      | total - reserved    |
| last_updated    | DATETIME        | Yes      |                     |

---

### `stock_reservations`

| Field         | Type                                    | Required | Notes                       |
| ------------- | --------------------------------------- | -------- | --------------------------- |
| id            | BIGINT                                  | Yes      |                             |
| product_id    | FK → products                           | Yes      |                             |
| warehouse_id  | FK → warehouses                         | Yes      |                             |
| order_id      | FK → sales_orders                       | Yes      |                             |
| order_item_id | FK → sales_order_items                  | Yes      |                             |
| reserved_qty  | DECIMAL(10,3)                           | Yes      |                             |
| reserved_at   | DATETIME                                | Yes      |                             |
| released_at   | DATETIME                                | No       | On dispatch or cancellation |
| status        | ENUM('active', 'released', 'cancelled') | Yes      |                             |

---

### `reorder_rules`

| Field              | Type            | Required | Notes |
| ------------------ | --------------- | -------- | ----- |
| id                 | BIGINT          | Yes      |       |
| product_id         | FK → products   | Yes      |       |
| warehouse_id       | FK → warehouses | Yes      |       |
| reorder_point      | DECIMAL(10,3)   | Yes      |       |
| reorder_quantity   | DECIMAL(10,3)   | Yes      |       |
| lead_time_days     | INT             | No       |       |
| preferred_supplier | VARCHAR(255)    | No       |       |
| is_active          | BOOLEAN         | Yes      |       |

---

## MODULE 5 — DISPATCH & LOGISTICS

### `dispatch_plans`

| Field        | Type                                                               | Required | Notes  |
| ------------ | ------------------------------------------------------------------ | -------- | ------ |
| id           | BIGINT                                                             | Yes      |        |
| plan_number  | VARCHAR(50)                                                        | Yes      | Unique |
| planned_date | DATE                                                               | Yes      |        |
| warehouse_id | FK → warehouses                                                    | Yes      |        |
| status       | ENUM('draft', 'approved', 'in_progress', 'completed', 'cancelled') | Yes      |        |
| notes        | TEXT                                                               | No       |        |

---

### `dispatch_challans`

| Field                  | Type                                                                                              | Required | Notes                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- | -------- | -------------------------- |
| id                     | BIGINT                                                                                            | Yes      |                            |
| challan_number         | VARCHAR(50)                                                                                       | Yes      | Unique                     |
| dispatch_plan_id       | FK → dispatch_plans                                                                               | No       |                            |
| order_id               | FK → sales_orders                                                                                 | Yes      |                            |
| customer_id            | FK → customers                                                                                    | Yes      |                            |
| delivery_address_id    | FK → addresses                                                                                    | No       |                            |
| delivery_address_text  | TEXT                                                                                              | No       | Free-text if not in master |
| transporter_id         | FK → transporters                                                                                 | No       |                            |
| vehicle_id             | FK → vehicles                                                                                     | No       |                            |
| driver_name            | VARCHAR(100)                                                                                      | No       |                            |
| driver_mobile          | VARCHAR(20)                                                                                       | No       |                            |
| lr_number              | VARCHAR(100)                                                                                      | No       | Lorry receipt              |
| dispatch_date          | DATE                                                                                              | Yes      |                            |
| expected_delivery_date | DATE                                                                                              | No       |                            |
| status                 | ENUM('planned', 'packed', 'loaded', 'in_transit', 'delivered', 'pod_pending', 'closed', 'failed') | Yes      | Default: planned           |
| freight_amount         | DECIMAL(15,2)                                                                                     | No       |                            |
| freight_paid_by        | ENUM('company', 'customer')                                                                       | No       |                            |
| notes                  | TEXT                                                                                              | No       |                            |
| pdf_path               | VARCHAR(500)                                                                                      | No       |                            |

---

### `dispatch_challan_items`

| Field               | Type                   | Required | Notes                               |
| ------------------- | ---------------------- | -------- | ----------------------------------- |
| id                  | BIGINT                 | Yes      |                                     |
| challan_id          | FK → dispatch_challans | Yes      |                                     |
| order_item_id       | FK → sales_order_items | Yes      |                                     |
| product_id          | FK → products          | Yes      |                                     |
| product_description | TEXT                   | Yes      |                                     |
| dispatched_qty      | DECIMAL(10,3)          | Yes      |                                     |
| unit                | VARCHAR(50)            | Yes      |                                     |
| serial_numbers      | TEXT                   | No       | CSV of serial numbers if serialized |
| batch_number        | VARCHAR(100)           | No       |                                     |
| notes               | TEXT                   | No       |                                     |

---

### `vehicles`

| Field          | Type              | Required | Notes                    |
| -------------- | ----------------- | -------- | ------------------------ |
| id             | BIGINT            | Yes      |                          |
| vehicle_number | VARCHAR(50)       | Yes      | Registration plate       |
| vehicle_type   | VARCHAR(100)      | No       | e.g. 'Truck', 'Mini Van' |
| capacity_kg    | DECIMAL(10,2)     | No       |                          |
| transporter_id | FK → transporters | No       |                          |
| is_own         | BOOLEAN           | Yes      | Own vehicle vs hired     |
| is_active      | BOOLEAN           | Yes      |                          |

---

### `transporters`

| Field          | Type         | Required | Notes |
| -------------- | ------------ | -------- | ----- |
| id             | BIGINT       | Yes      |       |
| name           | VARCHAR(255) | Yes      |       |
| contact_person | VARCHAR(100) | No       |       |
| mobile         | VARCHAR(20)  | No       |       |
| gst_number     | VARCHAR(20)  | No       |       |
| address        | TEXT         | No       |       |
| service_areas  | TEXT         | No       |       |
| is_active      | BOOLEAN      | Yes      |       |

---

### `pod_records`

| Field          | Type                               | Required | Notes              |
| -------------- | ---------------------------------- | -------- | ------------------ |
| id             | BIGINT                             | Yes      |                    |
| challan_id     | FK → dispatch_challans             | Yes      |                    |
| received_by    | VARCHAR(100)                       | No       | Customer signatory |
| received_at    | DATETIME                           | No       |                    |
| signature_path | VARCHAR(500)                       | No       |                    |
| pod_photo_path | VARCHAR(500)                       | No       |                    |
| condition      | ENUM('good', 'damaged', 'partial') | No       |                    |
| remarks        | TEXT                               | No       |                    |
| uploaded_by    | FK → users                         | Yes      |                    |

---

## MODULE 6 — ENGINEER & INSTALLATION MANAGEMENT

### `engineers`

| Field         | Type         | Required | Notes                       |
| ------------- | ------------ | -------- | --------------------------- |
| id            | BIGINT       | Yes      |                             |
| user_id       | FK → users   | Yes      | One-to-one with system user |
| employee_code | VARCHAR(50)  | No       |                             |
| designation   | VARCHAR(100) | No       |                             |
| base_location | VARCHAR(100) | No       |                             |
| mobile        | VARCHAR(20)  | Yes      |                             |
| is_available  | BOOLEAN      | Yes      | Quick availability flag     |
| notes         | TEXT         | No       |                             |

---

### `engineer_skills`

| Field               | Type                                    | Required | Notes                                        |
| ------------------- | --------------------------------------- | -------- | -------------------------------------------- |
| id                  | BIGINT                                  | Yes      |                                              |
| engineer_id         | FK → engineers                          | Yes      |                                              |
| skill_category      | VARCHAR(100)                            | Yes      | e.g. 'Fire Suppression', 'Pump Installation' |
| product_category_id | FK → product_categories                 | No       |                                              |
| proficiency         | ENUM('basic', 'intermediate', 'expert') | Yes      |                                              |
| certified           | BOOLEAN                                 | Yes      | Default: false                               |
| certification_name  | VARCHAR(255)                            | No       |                                              |
| certified_until     | DATE                                    | No       |                                              |

---

### `installation_jobs`

| Field                 | Type                                                                         | Required | Notes           |
| --------------------- | ---------------------------------------------------------------------------- | -------- | --------------- |
| id                    | BIGINT                                                                       | Yes      |                 |
| job_number            | VARCHAR(50)                                                                  | Yes      | Unique          |
| order_id              | FK → sales_orders                                                            | Yes      |                 |
| challan_id            | FK → dispatch_challans                                                       | No       |                 |
| customer_id           | FK → customers                                                               | Yes      |                 |
| site_address          | TEXT                                                                         | Yes      |                 |
| site_contact_name     | VARCHAR(100)                                                                 | No       |                 |
| site_contact_mobile   | VARCHAR(20)                                                                  | No       |                 |
| job_type              | ENUM('installation', 'commissioning', 'amc', 'service_call', 'inspection')   | Yes      |                 |
| status                | ENUM('open', 'assigned', 'in_progress', 'completed', 'on_hold', 'cancelled') | Yes      | Default: open   |
| priority              | ENUM('urgent', 'high', 'normal', 'low')                                      | Yes      | Default: normal |
| scheduled_date        | DATE                                                                         | No       |                 |
| completed_at          | DATETIME                                                                     | No       |                 |
| checklist_template_id | FK → checklist_templates                                                     | No       |                 |
| notes                 | TEXT                                                                         | No       |                 |

---

### `job_assignments`

| Field       | Type                   | Required | Notes                     |
| ----------- | ---------------------- | -------- | ------------------------- |
| id          | BIGINT                 | Yes      |                           |
| job_id      | FK → installation_jobs | Yes      |                           |
| engineer_id | FK → engineers         | Yes      |                           |
| is_lead     | BOOLEAN                | Yes      | Lead engineer for the job |
| assigned_at | DATETIME               | Yes      |                           |
| assigned_by | FK → users             | Yes      |                           |
| notes       | TEXT                   | No       |                           |

---

### `visit_schedules`

| Field        | Type                                                                              | Required | Notes           |
| ------------ | --------------------------------------------------------------------------------- | -------- | --------------- |
| id           | BIGINT                                                                            | Yes      |                 |
| job_id       | FK → installation_jobs                                                            | Yes      |                 |
| engineer_id  | FK → engineers                                                                    | Yes      |                 |
| visit_number | INT                                                                               | Yes      | Visit 1, 2, 3   |
| scheduled_at | DATETIME                                                                          | Yes      |                 |
| actual_start | DATETIME                                                                          | No       |                 |
| actual_end   | DATETIME                                                                          | No       |                 |
| status       | ENUM('planned', 'in_progress', 'completed', 'missed', 'rescheduled', 'cancelled') | Yes      |                 |
| location_lat | DECIMAL(10,7)                                                                     | No       | GPS on check-in |
| location_lng | DECIMAL(10,7)                                                                     | No       |                 |
| remarks      | TEXT                                                                              | No       |                 |

---

### `checklist_templates`

| Field               | Type                    | Required | Notes                                   |
| ------------------- | ----------------------- | -------- | --------------------------------------- |
| id                  | BIGINT                  | Yes      |                                         |
| name                | VARCHAR(255)            | Yes      | e.g. 'Fire Pump Installation Checklist' |
| job_type            | VARCHAR(100)            | Yes      | Matches job_type in jobs                |
| product_category_id | FK → product_categories | No       |                                         |
| is_active           | BOOLEAN                 | Yes      |                                         |

---

### `checklist_template_items`

| Field          | Type                                                     | Required | Notes                  |
| -------------- | -------------------------------------------------------- | -------- | ---------------------- |
| id             | BIGINT                                                   | Yes      |                        |
| template_id    | FK → checklist_templates                                 | Yes      |                        |
| step_number    | INT                                                      | Yes      |                        |
| step_title     | VARCHAR(255)                                             | Yes      |                        |
| description    | TEXT                                                     | No       |                        |
| is_mandatory   | BOOLEAN                                                  | Yes      |                        |
| input_type     | ENUM('checkbox', 'text', 'number', 'photo', 'signature') | Yes      |                        |
| expected_value | VARCHAR(255)                                             | No       | For numeric validation |

---

### `job_checklist_responses`

| Field            | Type                          | Required | Notes                                 |
| ---------------- | ----------------------------- | -------- | ------------------------------------- |
| id               | BIGINT                        | Yes      |                                       |
| job_id           | FK → installation_jobs        | Yes      |                                       |
| visit_id         | FK → visit_schedules          | No       |                                       |
| template_item_id | FK → checklist_template_items | Yes      |                                       |
| response_value   | TEXT                          | No       | Checkbox true/false, text entry, etc. |
| photo_path       | VARCHAR(500)                  | No       |                                       |
| is_passed        | BOOLEAN                       | No       |                                       |
| remarks          | TEXT                          | No       |                                       |
| responded_by     | FK → engineers                | Yes      |                                       |
| responded_at     | DATETIME                      | Yes      |                                       |

---

### `service_reports`

| Field                   | Type                                                           | Required | Notes          |
| ----------------------- | -------------------------------------------------------------- | -------- | -------------- |
| id                      | BIGINT                                                         | Yes      |                |
| job_id                  | FK → installation_jobs                                         | Yes      |                |
| visit_id                | FK → visit_schedules                                           | No       |                |
| report_type             | ENUM('installation', 'commissioning', 'service', 'inspection') | Yes      |                |
| summary                 | TEXT                                                           | Yes      |                |
| issues_found            | TEXT                                                           | No       |                |
| actions_taken           | TEXT                                                           | No       |                |
| pending_actions         | TEXT                                                           | No       |                |
| customer_acknowledged   | BOOLEAN                                                        | Yes      | Default: false |
| customer_signature_path | VARCHAR(500)                                                   | No       |                |
| submitted_by            | FK → engineers                                                 | Yes      |                |
| submitted_at            | DATETIME                                                       | Yes      |                |
| pdf_path                | VARCHAR(500)                                                   | No       |                |

---

## MODULE 7 — INVOICE & DOCUMENT MANAGEMENT

### `invoices`

| Field           | Type                                                         | Required | Notes          |
| --------------- | ------------------------------------------------------------ | -------- | -------------- |
| id              | BIGINT                                                       | Yes      |                |
| invoice_number  | VARCHAR(100)                                                 | Yes      | Unique         |
| order_id        | FK → sales_orders                                            | Yes      |                |
| challan_id      | FK → dispatch_challans                                       | No       |                |
| customer_id     | FK → customers                                               | Yes      |                |
| invoice_date    | DATE                                                         | Yes      |                |
| invoice_type    | ENUM('tax_invoice', 'proforma', 'credit_note', 'debit_note') | Yes      |                |
| subtotal        | DECIMAL(15,2)                                                | Yes      |                |
| tax_amount      | DECIMAL(15,2)                                                | Yes      |                |
| grand_total     | DECIMAL(15,2)                                                | Yes      |                |
| is_gst_invoice  | BOOLEAN                                                      | Yes      | Default: true  |
| place_of_supply | VARCHAR(100)                                                 | No       | For GST        |
| file_path       | VARCHAR(500)                                                 | No       | Uploaded PDF   |
| status          | ENUM('draft', 'issued', 'cancelled')                         | Yes      | Default: draft |
| notes           | TEXT                                                         | No       |                |

---

### `invoice_items`

| Field           | Type          | Required | Notes |
| --------------- | ------------- | -------- | ----- |
| id              | BIGINT        | Yes      |       |
| invoice_id      | FK → invoices | Yes      |       |
| product_id      | FK → products | No       |       |
| description     | TEXT          | Yes      |       |
| hsn_code        | VARCHAR(20)   | No       |       |
| quantity        | DECIMAL(10,2) | Yes      |       |
| unit            | VARCHAR(50)   | Yes      |       |
| unit_price      | DECIMAL(15,2) | Yes      |       |
| discount_amount | DECIMAL(15,2) | Yes      |       |
| tax_percent     | DECIMAL(5,2)  | Yes      |       |
| tax_amount      | DECIMAL(15,2) | Yes      |       |
| line_total      | DECIMAL(15,2) | Yes      |       |

---

### `document_categories`

| Field                  | Type         | Required | Notes                                      |
| ---------------------- | ------------ | -------- | ------------------------------------------ |
| id                     | BIGINT       | Yes      |                                            |
| name                   | VARCHAR(100) | Yes      | e.g. 'Warranty Certificate', 'Test Report' |
| code                   | VARCHAR(50)  | Yes      | Unique                                     |
| requires_serial_number | BOOLEAN      | Yes      | Default: false                             |
| is_customer_visible    | BOOLEAN      | Yes      | Shown on client portal                     |
| is_active              | BOOLEAN      | Yes      |                                            |

---

### `documents`

| Field               | Type                        | Required | Notes                      |
| ------------------- | --------------------------- | -------- | -------------------------- |
| id                  | BIGINT                      | Yes      |                            |
| document_number     | VARCHAR(100)                | No       | System or manual reference |
| category_id         | FK → document_categories    | Yes      |                            |
| customer_id         | FK → customers              | No       |                            |
| order_id            | FK → sales_orders           | No       |                            |
| invoice_id          | FK → invoices               | No       |                            |
| job_id              | FK → installation_jobs      | No       |                            |
| product_id          | FK → products               | No       |                            |
| serial_number_id    | FK → serial_number_registry | No       |                            |
| document_date       | DATE                        | No       |                            |
| expiry_date         | DATE                        | No       | For certificates           |
| file_path           | VARCHAR(500)                | Yes      |                            |
| file_name           | VARCHAR(255)                | Yes      |                            |
| version             | INT                         | Yes      | Default: 1                 |
| is_latest           | BOOLEAN                     | Yes      | Default: true              |
| is_customer_visible | BOOLEAN                     | Yes      | Default: false             |
| generated_by_system | BOOLEAN                     | Yes      | Auto or manual upload      |
| notes               | TEXT                        | No       |                            |

---

### `serial_number_registry`

| Field               | Type                                                                            | Required | Notes                  |
| ------------------- | ------------------------------------------------------------------------------- | -------- | ---------------------- |
| id                  | BIGINT                                                                          | Yes      |                        |
| serial_number       | VARCHAR(100)                                                                    | Yes      | Unique                 |
| product_id          | FK → products                                                                   | Yes      |                        |
| batch_number        | VARCHAR(100)                                                                    | No       |                        |
| inward_date         | DATE                                                                            | No       | Date received in stock |
| order_id            | FK → sales_orders                                                               | No       | Assigned order         |
| challan_id          | FK → dispatch_challans                                                          | No       | Dispatched via         |
| customer_id         | FK → customers                                                                  | No       | Current owner          |
| installation_job_id | FK → installation_jobs                                                          | No       |                        |
| warranty_start_date | DATE                                                                            | No       |                        |
| warranty_end_date   | DATE                                                                            | No       |                        |
| status              | ENUM('in_stock', 'reserved', 'dispatched', 'installed', 'returned', 'scrapped') | Yes      |                        |

---

### `certificate_templates`

| Field         | Type                     | Required | Notes                                |
| ------------- | ------------------------ | -------- | ------------------------------------ |
| id            | BIGINT                   | Yes      |                                      |
| name          | VARCHAR(255)             | Yes      | e.g. 'Standard Warranty Certificate' |
| category_id   | FK → document_categories | Yes      |                                      |
| template_html | LONGTEXT                 | Yes      | HTML/template content                |
| variables     | TEXT                     | No       | JSON list of merge fields            |
| is_active     | BOOLEAN                  | Yes      |                                      |

---

## MODULE 8 — CLIENT PORTAL

### `client_organizations`

| Field                  | Type           | Required | Notes                 |
| ---------------------- | -------------- | -------- | --------------------- |
| id                     | BIGINT         | Yes      |                       |
| customer_id            | FK → customers | Yes      | One-to-one            |
| portal_enabled         | BOOLEAN        | Yes      | Default: false        |
| allowed_project_ids    | TEXT           | No       | JSON list, null = all |
| allowed_doc_categories | TEXT           | No       | JSON list, null = all |
| max_users              | INT            | No       | Default: 5            |

---

### `client_users`

| Field           | Type                                        | Required | Notes                    |
| --------------- | ------------------------------------------- | -------- | ------------------------ |
| id              | BIGINT                                      | Yes      |                          |
| organization_id | FK → client_organizations                   | Yes      |                          |
| name            | VARCHAR(100)                                | Yes      |                          |
| email           | VARCHAR(150)                                | Yes      | Unique, login identifier |
| password_hash   | VARCHAR(255)                                | Yes      |                          |
| mobile          | VARCHAR(20)                                 | No       |                          |
| is_active       | BOOLEAN                                     | Yes      |                          |
| last_login      | DATETIME                                    | No       |                          |
| email_verified  | BOOLEAN                                     | Yes      | Default: false           |
| access_level    | ENUM('full', 'read_only', 'documents_only') | Yes      | Default: read_only       |

---

### `portal_access_logs`

| Field          | Type              | Required | Notes                              |
| -------------- | ----------------- | -------- | ---------------------------------- |
| id             | BIGINT            | Yes      |                                    |
| client_user_id | FK → client_users | Yes      |                                    |
| action         | VARCHAR(100)      | Yes      | e.g. 'login', 'download', 'search' |
| entity_type    | VARCHAR(50)       | No       |                                    |
| entity_id      | BIGINT            | No       |                                    |
| file_name      | VARCHAR(255)      | No       | For downloads                      |
| ip_address     | VARCHAR(50)       | No       |                                    |
| performed_at   | DATETIME          | Yes      |                                    |

---

## MODULE 9 — ADMIN DASHBOARD

### `kpi_definitions`

| Field        | Type          | Required | Notes                      |
| ------------ | ------------- | -------- | -------------------------- |
| id           | BIGINT        | Yes      |                            |
| name         | VARCHAR(255)  | Yes      |                            |
| module       | VARCHAR(100)  | Yes      |                            |
| formula      | TEXT          | Yes      | SQL or formula description |
| target_value | DECIMAL(15,2) | No       |                            |
| unit         | VARCHAR(50)   | No       | e.g. '%', 'count', 'INR'   |
| is_active    | BOOLEAN       | Yes      |                            |

---

### `saved_reports`

| Field         | Type         | Required | Notes           |
| ------------- | ------------ | -------- | --------------- |
| id            | BIGINT       | Yes      |                 |
| name          | VARCHAR(255) | Yes      |                 |
| module        | VARCHAR(100) | Yes      |                 |
| filter_config | JSON         | Yes      | Applied filters |
| column_config | JSON         | No       | Visible columns |
| created_by    | FK → users   | Yes      |                 |
| is_shared     | BOOLEAN      | Yes      | Default: false  |

---

### `scheduled_reports`

| Field        | Type                               | Required | Notes                        |
| ------------ | ---------------------------------- | -------- | ---------------------------- |
| id           | BIGINT                             | Yes      |                              |
| report_id    | FK → saved_reports                 | Yes      |                              |
| frequency    | ENUM('daily', 'weekly', 'monthly') | Yes      |                              |
| send_time    | TIME                               | Yes      |                              |
| recipients   | TEXT                               | Yes      | JSON list of email addresses |
| last_sent_at | DATETIME                           | No       |                              |
| is_active    | BOOLEAN                            | Yes      |                              |

---

## MODULE 10 — ROLE-BASED ACCESS CONTROL (RBAC)

### `roles`

| Field          | Type         | Required | Notes                         |
| -------------- | ------------ | -------- | ----------------------------- |
| id             | BIGINT       | Yes      |                               |
| name           | VARCHAR(100) | Yes      | e.g. 'Admin', 'Sales Team'    |
| code           | VARCHAR(50)  | Yes      | Unique, e.g. 'ADMIN', 'SALES' |
| description    | TEXT         | No       |                               |
| is_system_role | BOOLEAN      | Yes      | Protect built-in roles        |
| is_active      | BOOLEAN      | Yes      |                               |

---

### `permissions`

| Field       | Type         | Required | Notes                                                          |
| ----------- | ------------ | -------- | -------------------------------------------------------------- |
| id          | BIGINT       | Yes      |                                                                |
| module      | VARCHAR(100) | Yes      | e.g. 'inquiry', 'quotation'                                    |
| action      | VARCHAR(100) | Yes      | e.g. 'create', 'read', 'update', 'delete', 'approve', 'export' |
| code        | VARCHAR(150) | Yes      | Unique e.g. 'quotation.approve'                                |
| description | TEXT         | No       |                                                                |

---

### `role_permissions`

| Field         | Type             | Required | Notes |
| ------------- | ---------------- | -------- | ----- |
| id            | BIGINT           | Yes      |       |
| role_id       | FK → roles       | Yes      |       |
| permission_id | FK → permissions | Yes      |       |

---

### `user_role_mappings`

| Field       | Type       | Required | Notes                  |
| ----------- | ---------- | -------- | ---------------------- |
| id          | BIGINT     | Yes      |                        |
| user_id     | FK → users | Yes      |                        |
| role_id     | FK → roles | Yes      |                        |
| assigned_at | DATETIME   | Yes      |                        |
| assigned_by | FK → users | Yes      |                        |
| expires_at  | DATETIME   | No       | Temporary role support |

---

### `audit_logs`

| Field        | Type         | Required | Notes                                                  |
| ------------ | ------------ | -------- | ------------------------------------------------------ |
| id           | BIGINT       | Yes      |                                                        |
| user_id      | FK → users   | Yes      |                                                        |
| module       | VARCHAR(100) | Yes      |                                                        |
| action       | VARCHAR(100) | Yes      | e.g. 'create', 'update', 'delete', 'approve', 'export' |
| entity_type  | VARCHAR(50)  | Yes      |                                                        |
| entity_id    | BIGINT       | Yes      |                                                        |
| old_data     | JSON         | No       | Snapshot before change                                 |
| new_data     | JSON         | No       | Snapshot after change                                  |
| ip_address   | VARCHAR(50)  | No       |                                                        |
| performed_at | DATETIME     | Yes      |                                                        |

---

### `session_logs`

| Field       | Type         | Required | Notes      |
| ----------- | ------------ | -------- | ---------- |
| id          | BIGINT       | Yes      |            |
| user_id     | FK → users   | Yes      |            |
| login_at    | DATETIME     | Yes      |            |
| logout_at   | DATETIME     | No       |            |
| ip_address  | VARCHAR(50)  | No       |            |
| device_info | VARCHAR(255) | No       | Browser/OS |
| is_active   | BOOLEAN      | Yes      |            |

---

## MODULE 11 — PURCHASE & PROCUREMENT

### `vendors`

| Field               | Type                                                              | Required | Notes            |
| ------------------- | ----------------------------------------------------------------- | -------- | ---------------- |
| id                  | BIGINT                                                            | Yes      |                  |
| vendor_code         | VARCHAR(50)                                                       | Yes      | Unique           |
| vendor_type         | ENUM('manufacturer', 'distributor', 'trader', 'service', 'other') | Yes      |                  |
| company_name        | VARCHAR(255)                                                      | Yes      |                  |
| contact_person_name | VARCHAR(100)                                                      | No       |                  |
| mobile              | VARCHAR(20)                                                       | Yes      |                  |
| alternate_mobile    | VARCHAR(20)                                                       | No       |                  |
| email               | VARCHAR(150)                                                      | No       |                  |
| website             | VARCHAR(255)                                                      | No       |                  |
| gst_number          | VARCHAR(20)                                                       | No       |                  |
| pan_number          | VARCHAR(20)                                                       | No       |                  |
| msme_number         | VARCHAR(50)                                                       | No       |                  |
| address_line1       | TEXT                                                              | No       |                  |
| address_line2       | TEXT                                                              | No       |                  |
| city                | VARCHAR(100)                                                      | No       |                  |
| state               | VARCHAR(100)                                                      | No       |                  |
| pincode             | VARCHAR(10)                                                       | No       |                  |
| country             | VARCHAR(100)                                                      | No       | Default: 'India' |
| payment_terms       | VARCHAR(100)                                                      | No       | e.g. 'Net 30'    |
| credit_days         | INT                                                               | No       |                  |
| currency            | VARCHAR(10)                                                       | No       | Default: 'INR'   |
| category_tags       | VARCHAR(255)                                                      | No       | Comma-separated  |
| performance_rating  | DECIMAL(3,2)                                                      | No       | 0.00 – 5.00      |
| status              | ENUM('active', 'inactive', 'blacklisted', 'on_hold')              | Yes      | Default: active  |
| notes               | TEXT                                                              | No       |                  |

---

### `vendor_contacts`

| Field       | Type         | Required | Notes |
| ----------- | ------------ | -------- | ----- |
| id          | BIGINT       | Yes      |       |
| vendor_id   | FK → vendors | Yes      |       |
| name        | VARCHAR(100) | Yes      |       |
| designation | VARCHAR(100) | No       |       |
| mobile      | VARCHAR(20)  | Yes      |       |
| email       | VARCHAR(150) | No       |       |
| is_primary  | BOOLEAN      | Yes      |       |

---

### `vendor_bank_details`

| Field          | Type         | Required | Notes |
| -------------- | ------------ | -------- | ----- |
| id             | BIGINT       | Yes      |       |
| vendor_id      | FK → vendors | Yes      |       |
| bank_name      | VARCHAR(150) | Yes      |       |
| branch         | VARCHAR(150) | No       |       |
| account_number | VARCHAR(50)  | Yes      |       |
| account_holder | VARCHAR(150) | No       |       |
| ifsc_code      | VARCHAR(20)  | Yes      |       |
| swift_code     | VARCHAR(20)  | No       |       |
| is_default     | BOOLEAN      | Yes      |       |

---

### `purchase_requisitions`

| Field             | Type                                                                                                       | Required | Notes                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | -------- | ------------------------ |
| id                | BIGINT                                                                                                     | Yes      |                          |
| pr_number         | VARCHAR(50)                                                                                                | Yes      | Unique                   |
| pr_date           | DATE                                                                                                       | Yes      |                          |
| source            | ENUM('manual', 'reorder', 'sales_order', 'site_request')                                                   | Yes      |                          |
| sales_order_id    | FK → sales_orders                                                                                          | No       | If source = sales_order  |
| job_id            | FK → installation_jobs                                                                                     | No       | If source = site_request |
| department        | VARCHAR(100)                                                                                               | No       |                          |
| project_reference | VARCHAR(255)                                                                                               | No       |                          |
| required_by_date  | DATE                                                                                                       | No       |                          |
| priority          | ENUM('high', 'medium', 'low')                                                                              | Yes      | Default: medium          |
| status            | ENUM('draft', 'pending_approval', 'approved', 'rejected', 'rfq_sent', 'po_created', 'closed', 'cancelled') | Yes      | Default: draft           |
| requested_by      | FK → users                                                                                                 | Yes      |                          |
| approved_by       | FK → users                                                                                                 | No       |                          |
| approved_at       | DATETIME                                                                                                   | No       |                          |
| rejection_reason  | TEXT                                                                                                       | No       |                          |
| notes             | TEXT                                                                                                       | No       |                          |

---

### `purchase_requisition_items`

| Field               | Type                       | Required | Notes |
| ------------------- | -------------------------- | -------- | ----- |
| id                  | BIGINT                     | Yes      |       |
| pr_id               | FK → purchase_requisitions | Yes      |       |
| product_id          | FK → products              | No       |       |
| product_description | VARCHAR(255)               | Yes      |       |
| specification_notes | TEXT                       | No       |       |
| quantity            | DECIMAL(10,2)              | Yes      |       |
| unit                | VARCHAR(50)                | No       |       |
| estimated_unit_cost | DECIMAL(15,2)              | No       |       |
| estimated_total     | DECIMAL(15,2)              | No       |       |
| warehouse_id        | FK → warehouses            | No       |       |
| notes               | TEXT                       | No       |       |

---

### `rfqs`

| Field      | Type                                                                | Required | Notes          |
| ---------- | ------------------------------------------------------------------- | -------- | -------------- |
| id         | BIGINT                                                              | Yes      |                |
| rfq_number | VARCHAR(50)                                                         | Yes      | Unique         |
| pr_id      | FK → purchase_requisitions                                          | No       |                |
| rfq_date   | DATE                                                                | Yes      |                |
| due_date   | DATE                                                                | No       |                |
| status     | ENUM('draft', 'sent', 'responses_received', 'awarded', 'cancelled') | Yes      | Default: draft |
| awarded_to | FK → vendors                                                        | No       |                |
| awarded_at | DATETIME                                                            | No       |                |
| notes      | TEXT                                                                | No       |                |

---

### `rfq_vendors`

| Field     | Type                                                    | Required | Notes            |
| --------- | ------------------------------------------------------- | -------- | ---------------- |
| id        | BIGINT                                                  | Yes      |                  |
| rfq_id    | FK → rfqs                                               | Yes      |                  |
| vendor_id | FK → vendors                                            | Yes      |                  |
| sent_at   | DATETIME                                                | No       |                  |
| status    | ENUM('pending', 'responded', 'declined', 'no_response') | Yes      | Default: pending |

---

### `vendor_quotes`

| Field          | Type          | Required | Notes           |
| -------------- | ------------- | -------- | --------------- |
| id             | BIGINT        | Yes      |                 |
| rfq_id         | FK → rfqs     | Yes      |                 |
| vendor_id      | FK → vendors  | Yes      |                 |
| quote_number   | VARCHAR(100)  | No       | Vendor-supplied |
| quote_date     | DATE          | Yes      |                 |
| valid_until    | DATE          | No       |                 |
| lead_time_days | INT           | No       |                 |
| total_amount   | DECIMAL(15,2) | No       |                 |
| currency       | VARCHAR(10)   | No       | Default: 'INR'  |
| payment_terms  | VARCHAR(100)  | No       |                 |
| freight_terms  | VARCHAR(100)  | No       |                 |
| notes          | TEXT          | No       |                 |

---

### `vendor_quote_items`

| Field               | Type               | Required | Notes |
| ------------------- | ------------------ | -------- | ----- |
| id                  | BIGINT             | Yes      |       |
| vendor_quote_id     | FK → vendor_quotes | Yes      |       |
| product_id          | FK → products      | No       |       |
| product_description | VARCHAR(255)       | Yes      |       |
| quantity            | DECIMAL(10,2)      | Yes      |       |
| unit                | VARCHAR(50)        | No       |       |
| unit_price          | DECIMAL(15,2)      | Yes      |       |
| discount_percent    | DECIMAL(5,2)       | No       |       |
| tax_id              | FK → tax_rules     | No       |       |
| line_total          | DECIMAL(15,2)      | Yes      |       |
| notes               | TEXT               | No       |       |

---

### `purchase_orders`

| Field                | Type                                                                                                           | Required | Notes          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| id                   | BIGINT                                                                                                         | Yes      |                |
| po_number            | VARCHAR(50)                                                                                                    | Yes      | Unique         |
| po_date              | DATE                                                                                                           | Yes      |                |
| vendor_id            | FK → vendors                                                                                                   | Yes      |                |
| pr_id                | FK → purchase_requisitions                                                                                     | No       |                |
| rfq_id               | FK → rfqs                                                                                                      | No       |                |
| sales_order_id       | FK → sales_orders                                                                                              | No       | Project-link   |
| billing_address      | TEXT                                                                                                           | No       |                |
| shipping_address     | TEXT                                                                                                           | No       |                |
| expected_delivery    | DATE                                                                                                           | No       |                |
| payment_terms        | VARCHAR(100)                                                                                                   | No       |                |
| freight_terms        | VARCHAR(100)                                                                                                   | No       |                |
| currency             | VARCHAR(10)                                                                                                    | No       | Default: 'INR' |
| subtotal             | DECIMAL(15,2)                                                                                                  | Yes      |                |
| discount_total       | DECIMAL(15,2)                                                                                                  | No       |                |
| tax_total            | DECIMAL(15,2)                                                                                                  | No       |                |
| freight_amount       | DECIMAL(15,2)                                                                                                  | No       |                |
| grand_total          | DECIMAL(15,2)                                                                                                  | Yes      |                |
| advance_paid         | DECIMAL(15,2)                                                                                                  | No       |                |
| status               | ENUM('draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'closed', 'cancelled') | Yes      | Default: draft |
| approved_by          | FK → users                                                                                                     | No       |                |
| approved_at          | DATETIME                                                                                                       | No       |                |
| sent_at              | DATETIME                                                                                                       | No       |                |
| terms_and_conditions | TEXT                                                                                                           | No       |                |
| notes                | TEXT                                                                                                           | No       |                |

---

### `purchase_order_items`

| Field               | Type                 | Required | Notes      |
| ------------------- | -------------------- | -------- | ---------- |
| id                  | BIGINT               | Yes      |            |
| po_id               | FK → purchase_orders | Yes      |            |
| product_id          | FK → products        | No       |            |
| product_description | VARCHAR(255)         | Yes      |            |
| specification_notes | TEXT                 | No       |            |
| quantity            | DECIMAL(10,2)        | Yes      |            |
| unit                | VARCHAR(50)          | No       |            |
| unit_price          | DECIMAL(15,2)        | Yes      |            |
| discount_percent    | DECIMAL(5,2)         | No       |            |
| tax_id              | FK → tax_rules       | No       |            |
| tax_amount          | DECIMAL(15,2)        | No       |            |
| line_total          | DECIMAL(15,2)        | Yes      |            |
| received_quantity   | DECIMAL(10,2)        | No       | Default: 0 |
| pending_quantity    | DECIMAL(10,2)        | No       | Computed   |
| warehouse_id        | FK → warehouses      | No       |            |
| notes               | TEXT                 | No       |            |

---

### `po_delivery_schedules`

| Field          | Type                                                | Required | Notes            |
| -------------- | --------------------------------------------------- | -------- | ---------------- |
| id             | BIGINT                                              | Yes      |                  |
| po_item_id     | FK → purchase_order_items                           | Yes      |                  |
| scheduled_date | DATE                                                | Yes      |                  |
| quantity       | DECIMAL(10,2)                                       | Yes      |                  |
| status         | ENUM('pending', 'received', 'overdue', 'cancelled') | Yes      | Default: pending |

---

### `purchase_approvals`

| Field       | Type                                                | Required | Notes            |
| ----------- | --------------------------------------------------- | -------- | ---------------- |
| id          | BIGINT                                              | Yes      |                  |
| entity_type | ENUM('purchase_requisition', 'purchase_order')      | Yes      |                  |
| entity_id   | BIGINT                                              | Yes      |                  |
| level       | INT                                                 | Yes      | 1, 2, 3          |
| approver_id | FK → users                                          | Yes      |                  |
| status      | ENUM('pending', 'approved', 'rejected', 'returned') | Yes      | Default: pending |
| acted_at    | DATETIME                                            | No       |                  |
| comments    | TEXT                                                | No       |                  |

---

### `goods_receipt_notes`

| Field          | Type                                                                                    | Required | Notes              |
| -------------- | --------------------------------------------------------------------------------------- | -------- | ------------------ |
| id             | BIGINT                                                                                  | Yes      |                    |
| grn_number     | VARCHAR(50)                                                                             | Yes      | Unique             |
| grn_date       | DATE                                                                                    | Yes      |                    |
| po_id          | FK → purchase_orders                                                                    | Yes      |                    |
| vendor_id      | FK → vendors                                                                            | Yes      |                    |
| warehouse_id   | FK → warehouses                                                                         | Yes      |                    |
| invoice_number | VARCHAR(100)                                                                            | No       | Vendor invoice ref |
| invoice_date   | DATE                                                                                    | No       |                    |
| vehicle_number | VARCHAR(50)                                                                             | No       |                    |
| transporter    | VARCHAR(150)                                                                            | No       |                    |
| received_by    | FK → users                                                                              | Yes      |                    |
| status         | ENUM('draft', 'pending_qc', 'completed', 'partially_accepted', 'rejected', 'cancelled') | Yes      | Default: draft     |
| notes          | TEXT                                                                                    | No       |                    |

---

### `grn_items`

| Field              | Type                                               | Required | Notes                   |
| ------------------ | -------------------------------------------------- | -------- | ----------------------- |
| id                 | BIGINT                                             | Yes      |                         |
| grn_id             | FK → goods_receipt_notes                           | Yes      |                         |
| po_item_id         | FK → purchase_order_items                          | Yes      |                         |
| product_id         | FK → products                                      | No       |                         |
| received_quantity  | DECIMAL(10,2)                                      | Yes      |                         |
| accepted_quantity  | DECIMAL(10,2)                                      | Yes      |                         |
| rejected_quantity  | DECIMAL(10,2)                                      | No       | Default: 0              |
| qc_status          | ENUM('pending', 'accepted', 'rejected', 'on_hold') | Yes      | Default: pending        |
| qc_remarks         | TEXT                                               | No       |                         |
| batch_number       | VARCHAR(100)                                       | No       |                         |
| serial_numbers     | TEXT                                               | No       | Comma-separated or JSON |
| warehouse_location | VARCHAR(100)                                       | No       |                         |

---

### `vendor_invoices`

| Field          | Type                                                                                     | Required | Notes                   |
| -------------- | ---------------------------------------------------------------------------------------- | -------- | ----------------------- |
| id             | BIGINT                                                                                   | Yes      |                         |
| invoice_number | VARCHAR(100)                                                                             | Yes      | Vendor's invoice number |
| invoice_date   | DATE                                                                                     | Yes      |                         |
| vendor_id      | FK → vendors                                                                             | Yes      |                         |
| po_id          | FK → purchase_orders                                                                     | No       |                         |
| grn_id         | FK → goods_receipt_notes                                                                 | No       |                         |
| subtotal       | DECIMAL(15,2)                                                                            | Yes      |                         |
| tax_total      | DECIMAL(15,2)                                                                            | No       |                         |
| freight_amount | DECIMAL(15,2)                                                                            | No       |                         |
| grand_total    | DECIMAL(15,2)                                                                            | Yes      |                         |
| due_date       | DATE                                                                                     | No       |                         |
| match_status   | ENUM('unmatched', 'matched', 'price_variance', 'qty_variance', 'on_hold')                | Yes      | Default: unmatched      |
| status         | ENUM('draft', 'verified', 'approved', 'paid', 'partially_paid', 'disputed', 'cancelled') | Yes      | Default: draft          |
| attachment_id  | FK → attachments                                                                         | No       | Scanned bill            |
| notes          | TEXT                                                                                     | No       |                         |

---

### `vendor_invoice_items`

| Field       | Type                      | Required | Notes |
| ----------- | ------------------------- | -------- | ----- |
| id          | BIGINT                    | Yes      |       |
| invoice_id  | FK → vendor_invoices      | Yes      |       |
| po_item_id  | FK → purchase_order_items | No       |       |
| product_id  | FK → products             | No       |       |
| description | VARCHAR(255)              | Yes      |       |
| quantity    | DECIMAL(10,2)             | Yes      |       |
| unit_price  | DECIMAL(15,2)             | Yes      |       |
| tax_amount  | DECIMAL(15,2)             | No       |       |
| line_total  | DECIMAL(15,2)             | Yes      |       |

---

### `vendor_payments`

| Field            | Type                                                                    | Required | Notes                 |
| ---------------- | ----------------------------------------------------------------------- | -------- | --------------------- |
| id               | BIGINT                                                                  | Yes      |                       |
| payment_number   | VARCHAR(50)                                                             | Yes      | Unique                |
| payment_date     | DATE                                                                    | Yes      |                       |
| vendor_id        | FK → vendors                                                            | Yes      |                       |
| invoice_id       | FK → vendor_invoices                                                    | No       | Optional for advances |
| po_id            | FK → purchase_orders                                                    | No       |                       |
| payment_type     | ENUM('advance', 'against_invoice', 'on_account', 'refund')              | Yes      |                       |
| payment_method   | ENUM('bank_transfer', 'cheque', 'cash', 'upi', 'rtgs', 'neft', 'other') | Yes      |                       |
| reference_number | VARCHAR(100)                                                            | No       | UTR / cheque no       |
| amount           | DECIMAL(15,2)                                                           | Yes      |                       |
| tds_amount       | DECIMAL(15,2)                                                           | No       |                       |
| status           | ENUM('pending', 'processed', 'cleared', 'failed', 'cancelled')          | Yes      | Default: pending      |
| notes            | TEXT                                                                    | No       |                       |

---

### `purchase_returns`

| Field             | Type                                                             | Required | Notes          |
| ----------------- | ---------------------------------------------------------------- | -------- | -------------- |
| id                | BIGINT                                                           | Yes      |                |
| return_number     | VARCHAR(50)                                                      | Yes      | Unique         |
| return_date       | DATE                                                             | Yes      |                |
| vendor_id         | FK → vendors                                                     | Yes      |                |
| grn_id            | FK → goods_receipt_notes                                         | No       |                |
| po_id             | FK → purchase_orders                                             | No       |                |
| reason_code       | ENUM('damaged', 'wrong_item', 'quality_fail', 'excess', 'other') | Yes      |                |
| reason_notes      | TEXT                                                             | No       |                |
| status            | ENUM('draft', 'approved', 'dispatched', 'closed', 'cancelled')   | Yes      | Default: draft |
| debit_note_no     | VARCHAR(100)                                                     | No       |                |
| debit_note_amount | DECIMAL(15,2)                                                    | No       |                |
| approved_by       | FK → users                                                       | No       |                |

---

### `purchase_return_items`

| Field       | Type                  | Required | Notes |
| ----------- | --------------------- | -------- | ----- |
| id          | BIGINT                | Yes      |       |
| return_id   | FK → purchase_returns | Yes      |       |
| grn_item_id | FK → grn_items        | No       |       |
| product_id  | FK → products         | No       |       |
| description | VARCHAR(255)          | Yes      |       |
| quantity    | DECIMAL(10,2)         | Yes      |       |
| unit_price  | DECIMAL(15,2)         | No       |       |
| line_total  | DECIMAL(15,2)         | No       |       |

---

---

# PART B — PHASED DEVELOPMENT ROADMAP

> Each phase details **Database**, **Backend (APIs)**, **Frontend (Screens)**, and **Integration** scope. Use each task as a direct AI prompt unit.

---

## PHASE 1 — Inquiry & Quotation (Days 1–15)

### 1A — Foundation Setup

**Database:**

- Create all shared master tables: `users`, `roles`, `permissions`, `role_permissions`, `customers`, `contacts`, `addresses`, `tax_rules`, `product_categories`, `brands`, `attachments`, `notifications`, `audit_logs`, `session_logs`
- Seed default roles: Admin, Sales Team, Dispatch Team, Engineers, Accounts, Clients

**Backend:**

- Project scaffold: framework setup, folder structure, database connection, environment config
- Authentication module: login, logout, password hash, JWT token, session management
- RBAC middleware: permission check on every API route
- Global services: attachment handler, notification sender, audit logger

**Frontend:**

- Login page with validation
- Authenticated layout: sidebar, header, role-based menu
- User management screen (Admin only): create, edit, deactivate users, assign roles

---

### 1B — Inquiry Module

**Database:**

- Create: `inquiries`, `inquiry_sources`, `inquiry_line_items`, `inquiry_follow_ups`, `inquiry_activity_logs`

**Backend APIs:**

- `POST /inquiries` — create new inquiry with line items
- `GET /inquiries` — list with filters: status, priority, assigned_to, source, date range
- `GET /inquiries/:id` — full detail with line items, follow-ups, activity log
- `PUT /inquiries/:id` — update inquiry fields
- `PATCH /inquiries/:id/status` — change status, validate allowed transitions, log activity
- `POST /inquiries/:id/follow-ups` — create follow-up task
- `PUT /inquiries/follow-ups/:id` — update follow-up outcome
- `GET /inquiries/:id/activity` — get activity log
- `POST /inquiries/:id/attachments` — upload files
- Cron job: generate overdue follow-up notifications daily

**Frontend Screens:**

- Inquiry list view: table with status chips, priority badges, filters, search
- Create inquiry form: customer info, source, product requirements, line items, priority
- Inquiry detail page: status timeline, line items, follow-up tasks, activity log, attachments
- Follow-up modal: schedule type, date, notes, outcome entry
- Inquiry status Kanban (optional board view)

**Business Rules:**

- Duplicate detection on mobile + company name before save
- Auto-assign based on source/territory configuration
- Status transition guard: e.g., cannot move to Converted without a linked quotation

---

### 1C — Quotation Module

**Database:**

- Create: `quotations`, `quotation_items`, `quotation_approval_steps`, `price_rules`, `discount_rules`

**Backend APIs:**

- `POST /quotations` — create quotation from inquiry or standalone
- `GET /quotations` — list with filters: status, customer, date, assigned_to
- `GET /quotations/:id` — full detail with items and approval steps
- `POST /quotations/:id/versions` — create a new revision (clone and increment version)
- `PUT /quotations/:id` — update draft quotation
- `POST /quotations/:id/submit-approval` — submit for internal approval
- `POST /quotations/:id/approve` — approver approves or rejects
- `POST /quotations/:id/send` — mark as sent, log timestamp
- `POST /quotations/:id/convert` — convert approved quotation to sales order
- `GET /quotations/:id/pdf` — generate and return branded PDF
- `GET /quotations/price-rules` — fetch active pricing rules for product/customer
- `GET /quotations/discount-rules` — fetch discount rules

**Frontend Screens:**

- Quotation list with version indicators, status, expiry warnings
- Quotation builder: product search and selection, quantity, pricing engine display, discount input, tax selection, commercial terms, totals panel
- Pricing panel: shows cost, price, margin, discount impact in real time
- Version history view: compare versions side by side
- Approval workflow panel: pending approvers, approve/reject with comment
- PDF preview modal and send email dialog
- Price rule and discount rule management (Admin)

**Business Rules:**

- Margin floor validation before save
- Discount above threshold triggers approval step insertion
- Converted quotation becomes read-only
- Expired quotations auto-flagged by scheduler

---

## PHASE 2 — Sales Order, Inventory, Dispatch (Days 16–30)

### 2A — Sales Order Module

**Database:**

- Create: `sales_orders`, `sales_order_items`, `order_milestones`, `material_checklists`, `installation_requirements`

**Backend APIs:**

- `POST /orders` — create from quotation or manually
- `GET /orders` — list with filters: status, customer, date, sales exec
- `GET /orders/:id` — full detail with items, milestones, material checklist
- `PATCH /orders/:id/confirm` — confirm order, trigger stock reservation
- `PATCH /orders/:id/status` — progress through lifecycle stages
- `PUT /orders/:id/milestones` — update milestone completion
- `PUT /orders/:id/material-checklist` — update material readiness
- `PUT /orders/:id/installation-requirements` — update site info
- `DELETE /orders/:id` — soft delete draft orders only
- `GET /orders/:id/dispatch-readiness` — check blockers before dispatch

**Frontend Screens:**

- Order list with stage progress bar and blockers indicator
- Order creation from quotation (one-click, pre-filled)
- Order detail: items table, milestones checklist, material readiness panel, site info tab
- Status progression control panel with blocker warnings
- Material checklist editor with stock availability display

---

### 2B — Inventory Module

**Database:**

- Create: `products`, `product_specifications`, `warehouses`, `stock_ledger`, `stock_summary`, `stock_reservations`, `reorder_rules`

**Backend APIs:**

- Product master CRUD: `POST/GET/PUT/DELETE /products`
- `GET /products/:id/specifications` — get tech specs
- `PUT /products/:id/specifications` — upsert specs
- `POST /stock/inward` — inward stock entry (purchase receipt, return)
- `POST /stock/outward` — outward stock entry (linked to dispatch)
- `POST /stock/adjustment` — manual adjustment with reason and authorization
- `GET /stock/summary` — current stock levels with filters
- `GET /stock/ledger` — full movement history per product/warehouse
- `POST /stock/reserve` — reserve stock against an order
- `DELETE /stock/reserve/:id` — release reservation
- `GET /stock/alerts` — products below reorder point
- Reorder rule CRUD

**Frontend Screens:**

- Product master list and detail with specs editor
- Product category and brand management
- Stock dashboard: current levels by warehouse, availability indicator
- Stock movement entry forms: inward, outward, adjustment
- Stock ledger view: transaction history with filters
- Reservation view per order
- Reorder alerts panel with suggested actions

---

### 2C — Dispatch Module

**Database:**

- Create: `dispatch_plans`, `dispatch_challans`, `dispatch_challan_items`, `vehicles`, `transporters`, `pod_records`

**Backend APIs:**

- `POST /dispatch/challans` — create challan from ready orders
- `GET /dispatch/challans` — list with status filters
- `GET /dispatch/challans/:id` — full detail with items
- `PATCH /dispatch/challans/:id/status` — progress status
- `POST /dispatch/challans/:id/pod` — upload POD record
- Transporter CRUD: `POST/GET/PUT /transporters`
- Vehicle CRUD: `POST/GET/PUT /vehicles`
- `GET /dispatch/orders-ready` — orders ready to dispatch
- `GET /dispatch/challans/:id/pdf` — generate dispatch challan PDF

**Frontend Screens:**

- Dispatch planning board: ready orders grouped by location/route
- Challan creation form: order selection, item quantities, transporter/vehicle, delivery info
- Challan detail: items, shipment info, status tracker
- POD upload form with photo capture
- Transporter and vehicle management screens
- Dispatch summary dashboard: today's dispatches, in-transit, pending POD

---

## PHASE 3 — Engineer & Installation (Days 31–40)

**Database:**

- Create: `engineers`, `engineer_skills`, `installation_jobs`, `job_assignments`, `visit_schedules`, `checklist_templates`, `checklist_template_items`, `job_checklist_responses`, `service_reports`

**Backend APIs:**

- Engineer profile CRUD with skill matrix
- `GET /engineers/availability` — filter by date, skill, location
- `POST /jobs` — create installation job from dispatched order
- `GET /jobs` — list with filters: status, engineer, date, customer
- `GET /jobs/:id` — full detail
- `POST /jobs/:id/assign` — assign engineer(s)
- `POST /jobs/:id/visits` — schedule a visit
- `PATCH /jobs/:id/visits/:visitId/start` — check-in with GPS
- `PATCH /jobs/:id/visits/:visitId/complete` — check-out
- `POST /jobs/:id/checklist` — submit checklist responses
- `GET /jobs/:id/checklist` — get checklist status
- `POST /jobs/:id/report` — submit service report
- `GET /jobs/:id/report/pdf` — generate service report PDF
- Checklist template CRUD (Admin)

**Frontend Screens (Web — Admin/Ops):**

- Engineer roster with availability calendar
- Job creation and assignment screen
- Job list: by status, engineer, date, priority
- Job detail: assignments, visit history, checklist progress, attachments, report
- Checklist template builder (Admin)
- Engineer performance summary view

**Frontend Screens (Mobile — Engineer-facing):**

- My Jobs list with priority indicators
- Job detail view with site info, contact, and navigation link
- Checklist form with checkboxes, text inputs, camera capture
- Visit check-in (capture GPS) and check-out
- Service report submission form
- Customer signature capture

---

## PHASE 4 — Invoice & Document Management (Days 41–48)

**Database:**

- Create: `invoices`, `invoice_items`, `document_categories`, `documents`, `serial_number_registry`, `certificate_templates`

**Backend APIs:**

- `POST /invoices` — upload and tag invoice to order
- `GET /invoices` — list with filters
- `GET /invoices/:id` — invoice detail
- Document category CRUD (Admin)
- `POST /documents` — upload document with metadata tagging
- `GET /documents` — list with filters: customer, order, category, serial number
- `GET /documents/:id/download` — secure download with access check
- `POST /documents/generate` — generate certificate from template
- Serial number CRUD: `POST/GET/PUT /serial-numbers`
- `GET /serial-numbers/:serial/trace` — full trace: inward → order → dispatch → install → certificates
- Certificate template CRUD (Admin)

**Frontend Screens:**

- Invoice upload and management screen with order linking
- Document repository: searchable by customer, order, serial number, category
- Document upload form: category, linked entities, file picker
- Certificate generation wizard: select template, link order/serial, preview, generate
- Serial number tracker: full trace view
- Document category management (Admin)

---

## PHASE 5 — Client Portal & Analytics Dashboard (Days 49–60)

### 5A — Client Portal

**Database:**

- Create: `client_organizations`, `client_users`, `portal_access_logs`

**Backend APIs (Portal-specific, separate auth scope):**

- `POST /portal/auth/login` — client login, issue portal JWT
- `POST /portal/auth/reset-password` — email-based reset
- `GET /portal/orders` — client's orders with stage visibility
- `GET /portal/orders/:id` — order detail
- `GET /portal/documents` — documents visible to this client
- `GET /portal/documents/:id/download` — secure download, log access
- `GET /portal/search` — universal search across orders, invoices, serials
- Admin portal management: `POST/PUT /admin/client-organizations`, user provisioning

**Frontend Screens (Portal — Client-facing):**

- Client login page with branding
- Dashboard: active orders summary, recent documents, project status cards
- Order tracking page: stage timeline, item status, dispatch info
- Documents page: categorized list with download
- Search results page
- Profile settings: password change

---

### 5B — Admin Dashboard & Reporting

**Backend APIs:**

- `GET /reports/inquiry-funnel` — conversion funnel: New → In Progress → Quoted → Won/Lost
- `GET /reports/sales-performance` — team-wise, product-wise, period-wise
- `GET /reports/quotation-aging` — open quotes by age, value
- `GET /reports/order-status` — stage-wise order count and value
- `GET /reports/inventory` — stock levels, movement, reorder alerts
- `GET /reports/dispatch-performance` — on-time rate, transporter analysis
- `GET /reports/engineer-productivity` — job completion rate, utilization
- `GET /reports/revenue-margin` — revenue, cost, margin by period, customer, product
- `GET /reports/pending-documents` — missing invoices, certificates
- `POST /reports/scheduled` — create or update scheduled report
- Saved report CRUD

**Frontend Screens:**

- Executive dashboard: KPI summary cards, conversion funnel chart, revenue trend, open action items
- Sales dashboard: team-wise pipeline, product performance
- Operations dashboard: open orders, dispatch today, pending POD, site jobs in progress
- Inventory dashboard: stock alerts, movement summary
- Report module: filter builder, column selector, table view, export to Excel/PDF
- Scheduled report management screen

---

## Key Integration Points (Cross-Phase)

| Integration                            | From Module | To Module     | Trigger                     |
| -------------------------------------- | ----------- | ------------- | --------------------------- |
| Inquiry → Quotation                    | Inquiry     | Quotation     | User action: "Create Quote" |
| Quotation → Sales Order                | Quotation   | Sales Order   | Quotation converted         |
| Sales Order → Stock Reservation        | Sales Order | Inventory     | Order confirmed             |
| Sales Order → Installation Requirement | Sales Order | Engineer      | Order confirmed             |
| Dispatch → Stock Outward               | Dispatch    | Inventory     | Challan dispatched          |
| Dispatch → Installation Job            | Dispatch    | Engineer      | Delivery confirmed          |
| Installation Job → Documents           | Engineer    | Documents     | Report submitted            |
| Invoice Upload → Document Repository   | Invoicing   | Documents     | Invoice saved               |
| Serial Number → Certificate            | Documents   | Documents     | Certificate generated       |
| All status changes → Notifications     | All         | Notifications | Configured triggers         |
| All write operations → Audit Log       | All         | RBAC          | Every mutation              |

---

## Prompt Engineering Index

> Each item below maps to one focused development AI prompt unit.

| #   | Prompt Topic                                                     | Phase | Module      |
| --- | ---------------------------------------------------------------- | ----- | ----------- |
| 1   | Database schema creation: shared master tables + seed data       | 1A    | Foundation  |
| 2   | Auth module: JWT login, bcrypt password, session management      | 1A    | RBAC        |
| 3   | RBAC middleware: permission guard on API routes                  | 1A    | RBAC        |
| 4   | Inquiry CRUD APIs with status workflow and activity log          | 1B    | Inquiry     |
| 5   | Follow-up scheduler: overdue alert cron job                      | 1B    | Inquiry     |
| 6   | Inquiry duplicate detection logic                                | 1B    | Inquiry     |
| 7   | Inquiry management frontend: list, filter, detail page           | 1B    | Inquiry     |
| 8   | Quotation builder backend: pricing engine, discount rules        | 1C    | Quotation   |
| 9   | Quotation approval workflow: multi-step, condition-based         | 1C    | Quotation   |
| 10  | PDF generation for quotations using branded template             | 1C    | Quotation   |
| 11  | Quotation frontend: builder UI with real-time margin calc        | 1C    | Quotation   |
| 12  | Sales order creation from quotation, lifecycle APIs              | 2A    | Sales Order |
| 13  | Material checklist: stock availability evaluation logic          | 2A    | Sales Order |
| 14  | Order dispatch readiness check API                               | 2A    | Sales Order |
| 15  | Product master CRUD with technical specifications                | 2B    | Inventory   |
| 16  | Stock ledger: inward, outward, adjustment APIs                   | 2B    | Inventory   |
| 17  | Stock reservation system against sales orders                    | 2B    | Inventory   |
| 18  | Reorder alert engine and notification trigger                    | 2B    | Inventory   |
| 19  | Inventory frontend: stock dashboard, movement forms              | 2B    | Inventory   |
| 20  | Dispatch challan creation with partial delivery support          | 2C    | Dispatch    |
| 21  | POD upload and status progression for dispatch                   | 2C    | Dispatch    |
| 22  | Dispatch challan PDF generation                                  | 2C    | Dispatch    |
| 23  | Engineer profile and skill matrix management                     | 3     | Engineer    |
| 24  | Engineer availability and assignment engine                      | 3     | Engineer    |
| 25  | Installation job lifecycle and visit scheduling                  | 3     | Engineer    |
| 26  | Mobile checklist form with GPS check-in and photo capture        | 3     | Engineer    |
| 27  | Service report generation and customer signature capture         | 3     | Engineer    |
| 28  | Invoice upload and order tagging module                          | 4     | Documents   |
| 29  | Document repository with metadata search                         | 4     | Documents   |
| 30  | Serial number registry and full traceability API                 | 4     | Documents   |
| 31  | Certificate template engine and generation workflow              | 4     | Documents   |
| 32  | Client portal: isolated auth, access policy, JWT scope           | 5A    | Portal      |
| 33  | Client portal: order tracking and document download APIs         | 5A    | Portal      |
| 34  | Client portal: search by serial number, invoice, project         | 5A    | Portal      |
| 35  | Client portal frontend: responsive dashboard and document access | 5A    | Portal      |
| 36  | Reporting APIs: sales, inventory, dispatch, engineer KPIs        | 5B    | Dashboard   |
| 37  | Admin dashboard frontend: KPI cards, charts, funnel view         | 5B    | Dashboard   |
| 38  | Report builder: filters, column config, export to Excel/PDF      | 5B    | Dashboard   |
| 39  | Scheduled report email job                                       | 5B    | Dashboard   |
| 40  | Notification system: in-app + email, configurable triggers       | Cross | All         |
| 41  | Audit log viewer for admin: filter by module, user, action       | Cross | RBAC        |
| 42  | Attachment service: upload, version, polymorphic linking         | Cross | All         |
