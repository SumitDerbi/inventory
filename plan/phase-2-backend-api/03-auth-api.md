# Step 03 — Auth API (JWT, Users, Roles)

> Before this: [02-models-migrations.md](./02-models-migrations.md)

---

## Endpoints

| Method           | Path                         | Purpose                             |
| ---------------- | ---------------------------- | ----------------------------------- |
| POST             | `/api/auth/login`            | email + password → access + refresh |
| POST             | `/api/auth/refresh`          | refresh → new access                |
| POST             | `/api/auth/logout`           | blacklist refresh                   |
| POST             | `/api/auth/forgot`           | email → reset token (email stub)    |
| POST             | `/api/auth/reset`            | token + new password                |
| POST             | `/api/auth/change-password`  | old + new (auth required)           |
| GET              | `/api/auth/me`               | current user profile                |
| PATCH            | `/api/auth/me`               | update profile fields               |
| GET              | `/api/users/`                | list (admin)                        |
| POST             | `/api/users/`                | create (admin)                      |
| GET              | `/api/users/:id`             | retrieve                            |
| PATCH            | `/api/users/:id`             | update                              |
| DELETE           | `/api/users/:id`             | soft delete                         |
| GET              | `/api/roles/`                | list                                |
| POST             | `/api/roles/`                | create                              |
| GET/PATCH/DELETE | `/api/roles/:id`             |                                     |
| GET              | `/api/roles/:id/permissions` | matrix of module × action           |
| PUT              | `/api/roles/:id/permissions` | replace matrix                      |

---

## Rules

- Login throttled (`AnonRateThrottle` 5/min).
- Password hashing via Django's default PBKDF2.
- Refresh token rotation + blacklist on logout.
- `me` endpoint is the canonical user info source for the frontend.
- Role permission matrix validated against enum set (module × action).
- Password reset token lives in `password_reset_tokens` table with 1 h TTL + single use.

---

## Tests (pytest)

- Successful login returns access + refresh; tokens decode with expected claims (id, role, email).
- Wrong password → 401, generic message (no user enumeration).
- Locked/inactive user → 403.
- Refresh rotation: old refresh blacklisted after use.
- `/me` requires auth; returns expected fields.
- Users list denied for non-admin.
- Role permission PUT validates unknown module/action → 400.

---

## Postman

- Folder `Auth` with requests above.
- Login response test writes `{{access}}`, `{{refresh}}`, `{{current_user_id}}` to env.
- Pre-request script on protected folders auto-refreshes token when expired.

---

## Verification

- [ ] Pytest for `auth_ext` ≥ 90 % coverage.
- [ ] Postman `Auth` folder all green.
- [ ] OpenAPI shows correct security schemes for each endpoint.
- [ ] Commit: `feat(api): auth + users + roles`.

---

**Next:** [04-masters-api.md](./04-masters-api.md)
