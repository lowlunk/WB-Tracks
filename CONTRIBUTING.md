# Contributing to WB Tracks

Thanks for taking the time to contribute. WB Tracks is built and maintained by Chris Bryson for Woodbridge Foam, but pull requests and issues from anyone are welcome.

---

## Reporting Bugs

Open an issue at <https://github.com/lowlunk/WB-Tracks/issues> with:

- **What you were doing** (steps to reproduce)
- **What you expected** to happen
- **What actually happened**
- **Screenshots** if visual
- **Environment** — browser, OS, WB Tracks version (see `package.json`)
- **Console errors** — open DevTools (F12) → Console tab and paste anything red

---

## Suggesting Features

Open an issue with the label `enhancement`. Describe:

- The problem you're solving (not just the feature you want)
- Who benefits and how often
- Any rough sketches or examples from other tools

---

## Pull Requests

1. **Fork** the repo and create a branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Set up locally** following [DEVELOPMENT.md](DEVELOPMENT.md#local-setup)
3. **Make your changes** — keep PRs focused. One feature or fix per PR.
4. **Run the checks:**
   ```bash
   npm run check     # TypeScript
   npm run build     # ensure it compiles
   ```
5. **Manually QA** the pages you touched (see [DEVELOPMENT.md → Testing](DEVELOPMENT.md#testing))
6. **Update docs** — if you changed user-visible behavior, update `USER_GUIDE.md`. If you changed APIs, update `DEVELOPMENT.md`. If you added a feature, update `CHANGELOG.md` under `Unreleased`.
7. **Commit** with a [Conventional Commits](https://www.conventionalcommits.org/) style message:
   ```
   feat: add CSV export to switches page
   fix: prevent port deletion when in use
   docs: clarify Postgres migration
   chore: bump deps
   ```
8. **Push and open a PR** against `master`. Fill in the description with what changed and why.

---

## Code Style

- TypeScript everywhere — no untyped JavaScript
- Tailwind classes — no inline styles unless dynamic
- shadcn primitives — don't roll custom UI when one exists
- `data-testid` on every interactive element
- Lucide icons for actions
- Path aliases — `@/`, `@shared/`, `@assets/`

See [DEVELOPMENT.md → Coding Conventions](DEVELOPMENT.md#coding-conventions) for the full list.

---

## Pull Request Checklist

Before requesting review:

- [ ] `npm run check` passes
- [ ] `npm run build` completes
- [ ] Manually QA'd the affected pages
- [ ] Updated `USER_GUIDE.md` if user-visible behavior changed
- [ ] Updated `DEVELOPMENT.md` if APIs / schema changed
- [ ] Added entry to `CHANGELOG.md` under `Unreleased`
- [ ] No new `console.log` or commented-out code
- [ ] No `localStorage` / `sessionStorage` / `cookies` (sandbox blocks them)
- [ ] All new interactive elements have `data-testid`

---

## Code of Conduct

Be professional. Be kind. Disagree with ideas, not people. We're all here to make the plant run smoother.
