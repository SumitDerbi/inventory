# Step 06 — Combined Deploy (Build → Django Template → cPanel)

> Before this: [05-e2e-playwright.md](./05-e2e-playwright.md)
> Ref: [docs/stack.md](../../docs/stack.md)

---

## Objective

Produce a single deployable artifact: Django serves the React build via a template, APIs under `/api/*`. Deployed to cPanel through `deploy.sh`.

---

## Architecture

- `frontend/dist/` built locally.
- `dist/index.html` copied into `backend/templates/spa/index.html`.
- `dist/assets/*` copied into `backend/static/spa/`.
- Django `CatchAllView` renders `spa/index.html` for any non-`/api`, non-`/admin`, non-`/static` path.
- `collectstatic` ships assets into `STATIC_ROOT` per [stack.md](../../docs/stack.md).

---

## Steps

1. **Django SPA serving**
   - Add `apps/core/views.SpaView`.
   - URL pattern: `re_path(r'^(?!api/|admin/|static/|media/).*$', SpaView.as_view())`.
2. **Frontend build script** — `scripts/build-frontend.ps1`:
   ```powershell
   Push-Location frontend
   npm ci
   npm run build
   Pop-Location
   Copy-Item frontend/dist/index.html backend/templates/spa/index.html -Force
   Copy-Item frontend/dist/assets/* backend/static/spa/assets/ -Recurse -Force
   ```
3. **deploy.sh** (bash on cPanel) — follow [stack.md](../../docs/stack.md) variables:

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   source ~/deploy_config/inventory/inventory.config
   source ~/deploy_config/inventory/inventory.env
   cd "$APP_DIR"

   # 0. Backup DB
   mkdir -p "$DB_BACKUP_PATH"
   mysqldump --defaults-file=$MYSQL_CNF "$DB_NAME" \
     > "$DB_BACKUP_PATH/$(date +%Y%m%d-%H%M).sql"

   # 1. Pull latest
   git --git-dir="$GIT_DIR" --work-tree="$APP_DIR" fetch origin main
   git --git-dir="$GIT_DIR" --work-tree="$APP_DIR" reset --hard origin/main

   # 2. Python env
   source "$ACTIVATE_ENV"
   pip install -r "$REQUIREMENTS_FILE"

   # 3. DB migrate
   python manage.py migrate --noinput

   # 4. Collect static (frontend build already committed)
   python manage.py collectstatic --noinput

   # 5. Restart app (passenger / wsgi touch)
   touch tmp/restart.txt
   ```

4. **CI/CD guardrails** — `main` only deploys when:
   - pytest green,
   - Newman green,
   - Vitest green,
   - Playwright smoke green on last nightly.
5. **Post-deploy verification**:
   - `curl -I https://domain/` → 200, `Content-Type: text/html`.
   - `curl https://domain/api/v1/inquiries/stats` → 401 (auth required but server alive).
   - Login via UI, run Playwright smoke against prod.

---

## Rollback

- Keep last 5 DB backups (`$DB_BACKUP_PATH`).
- Git tags per release (`v1.0.0`, ...); rollback = `git reset --hard <prev-tag>` + restore latest backup.

---

## Verification

- [ ] `deploy.sh` runs clean on staging cPanel.
- [ ] SPA routes load directly (hard refresh on `/orders/123` returns 200 with the app).
- [ ] API routes still served correctly under `/api/`.
- [ ] Static assets served with long cache headers + hashed filenames.
- [ ] Lighthouse prod page ≥ 85 Performance, ≥ 90 Accessibility.
- [ ] UAT checklist signed off.
- [ ] Tag `v1.0.0` pushed.

---

**Project complete.** Future iterations: copy a relevant step file as a starting point for the next sprint; always follow [../SKILL.md](../SKILL.md).
