# Step 03 — Auth API (JWT, Users, Roles)

> Before this: [02-models-migrations.md](./02-models-migrations.md)

---

## Endpoints

| Method           | Path                                      | Purpose                             |
| ---------------- | ----------------------------------------- | ----------------------------------- |
| POST             | `/api/auth/login`                         | email + password → access + refresh |
| POST             | `/api/auth/refresh`                       | refresh → new access                |
| POST             | `/api/auth/logout`                        | blacklist refresh                   |
| POST             | `/api/auth/forgot`                        | email → reset token (email stub)    |
| POST             | `/api/auth/reset`                         | token + new password                |
| POST             | `/api/auth/change-password`               | old + new (auth required)           |
| GET              | `/api/auth/me`                            | current user profile                |
| PATCH            | `/api/auth/me`                            | update profile fields               |
| GET              | `/api/auth/sessions`                      | active sessions for current user    |
| POST             | `/api/auth/sessions/:id/logout`           | revoke a single session             |
| POST             | `/api/auth/sessions/logout-others`        | revoke all except current           |
| GET              | `/api/auth/2fa/status`                    | `{ enabled, method, enrolled_at }`  |
| POST             | `/api/auth/2fa/enable`                    | start enrolment → secret + qr_svg   |
| POST             | `/api/auth/2fa/confirm`                   | `{ code }` → finalises + recovery   |
| POST             | `/api/auth/2fa/disable`                   | `{ password }` required             |
| GET              | `/api/auth/2fa/recovery-codes`            | masked list (`***-****`)            |
| POST             | `/api/auth/2fa/recovery-codes/regenerate` | `{ password }` → new code set       |
| GET              | `/api/users/`                             | list (admin)                        |
| POST             | `/api/users/`                             | create (admin)                      |
| GET              | `/api/users/:id`                          | retrieve                            |
| PATCH            | `/api/users/:id`                          | update                              |
| DELETE           | `/api/users/:id`                          | soft delete                         |
| GET              | `/api/roles/`                             | list                                |
| POST             | `/api/roles/`                             | create                              |
| GET/PATCH/DELETE | `/api/roles/:id`                          |                                     |
| GET              | `/api/roles/:id/permissions`              | matrix of module × action           |
| PUT              | `/api/roles/:id/permissions`              | replace matrix                      |

---

## Sessions

- New model `auth_sessions` (added in step 02 under `auth_ext`): `user_id`, `refresh_jti` (FK to outstanding refresh), `device`, `ip`, `user_agent`, `location` (GeoIP optional), `created_at`, `last_seen_at`, `is_current` (computed from request).
- Login creates one row per refresh; refresh rotation updates `last_seen_at` + replaces `refresh_jti`.
- `GET /api/auth/sessions` returns user's own rows only, with `current=true` flag for the row matching the request's refresh.
- `POST /api/auth/sessions/:id/logout` blacklists that refresh + deletes row; cannot target current session (use `/logout` instead).
- `POST /api/auth/sessions/logout-others` blacklists every refresh except the current one in one transaction.

## Two-factor authentication (TOTP)

- New model `user_2fa` (step 02): `user_id` (1:1), `secret` (encrypted), `enrolled_at`, `last_used_at`, `recovery_codes` (hashed list).
- Library: `pyotp` for TOTP; `qrcode` for the SVG payload.
- Flow:
  1. `POST /api/auth/2fa/enable` — generates secret, returns `{ secret, otpauth_url, qr_svg }`. Row created with `enrolled_at=null` (pending).
  2. `POST /api/auth/2fa/confirm` — validates code; on success sets `enrolled_at`, generates 8 single-use recovery codes (returned **once**, hashed in DB).
  3. `POST /api/auth/2fa/disable` — requires current password; deletes 2FA row + recovery codes.
  4. Login flow: when user has 2FA enabled, `/api/auth/login` returns `{ requires_otp: true, otp_token }` first; client follows up with `POST /api/auth/login/verify-otp` `{ otp_token, code | recovery_code }` → access + refresh.
  5. `recovery-codes/regenerate` invalidates previous set; returns fresh list once.
- Throttle 2FA verify endpoint (`5/min` per user).

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
- Sessions list returns own rows with exactly one `current=true`; cannot logout the current session via `/sessions/:id/logout`.
- `logout-others` keeps current session valid, blacklists all other refreshes.
- 2FA: enable → confirm with valid TOTP → enrolled_at set; recovery codes returned once, hashed in DB.
- 2FA: login with enabled 2FA returns `requires_otp`; bad code → 401; recovery code consumed (single use).
- 2FA: disable requires correct password; wrong password → 403.

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
