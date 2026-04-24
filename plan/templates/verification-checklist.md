# Generic Verification Checklist

> Drop-in checklist for any step that doesn't have its own. Answer yes to everything before ticking the step.

---

## Functional

- [ ] Requirement matches the linked spec section
- [ ] All fields / states / actions from spec are present
- [ ] Happy path works end-to-end
- [ ] Edge cases covered (empty, max length, boundary, concurrent, permission denied)

## Quality

- [ ] No console errors / warnings
- [ ] No lint errors (`eslint` / `flake8`)
- [ ] Formatter clean (`prettier` / `black`)
- [ ] Type hints / JSDoc where the pattern exists

## Tests

- [ ] New code has tests (unit / integration as appropriate)
- [ ] Coverage meets gate
- [ ] Tests are deterministic (no flakiness on 3 reruns)

## Performance / UX

- [ ] Meaningful loading + error states (UI)
- [ ] Pagination on any list > 50 rows
- [ ] p95 endpoint latency budget met (≤ 400 ms on dev hardware for CRUD)

## Security

- [ ] Auth required where applicable
- [ ] Input validated at system boundary
- [ ] No secrets committed
- [ ] SQL parameterised (no string concat)

## Docs

- [ ] Any new env var documented
- [ ] OpenAPI updated (API) / prop docs updated (UI)
- [ ] CHANGELOG line if user-facing

## Git

- [ ] Conventional commit
- [ ] Branch scoped to this step
- [ ] PR description references the plan step file

---

✅ Step complete → tick in phase overview → open next step file.
