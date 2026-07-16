# 📋 TeleKas — Project Tracking

Living log of what has been **added** and what has been **performed**.
Newest phase on top. Update this file with every meaningful change (feature, refactor, removal, ops task).

**Legend:** ✅ done · 🚧 in progress · 📌 planned · ❌ dropped

---

## Phase 5 — Post-Redesign Fixes (July 16, 2026)

**Status:** ✅ Complete (not yet committed)
**Trigger:** User feedback on Phase 4 redesign

### Added

| Item | Location | Status |
|---|---|---|
| Mobile transactions load-more (20/step, "Muat lebih banyak (N tersisa)") | `app/(app)/transactions/page.js` | ✅ |
| Desktop transactions pagination + column sort — v1 spec (tanggal/nominal toggle asc-desc, page size 10/50/100/1000, "Halaman X dari Y", Sebelumnya/Berikutnya, total count) | `app/(app)/transactions/page.js` | ✅ |
| Expense-by-source-of-fund donut — mobile dashboard, desktop dashboard, insights | `lib/aggregate.js` (`byField`/`bySource`), pages | ✅ |
| Category emoji system — keyword map + deterministic fallback, pop-in + hover-wiggle animation | `lib/utils.js` (`categoryEmoji`), `app/globals.css` | ✅ |
| `CreatedByPill` dropdown (replaces `SourcePill` on dashboard; defaults to logged-in user per v1 rules) | `components/widgets.jsx` | ✅ |
| Shared `FilterFields` (dibuat oleh / sumber dana / kategori) reused by transactions **and** dashboard desktop | `components/widgets.jsx` | ✅ |

### Performed

| Task | Detail | Status |
|---|---|---|
| Desktop: Insights menu removed | Redundant with dashboard; hidden from sidebar, page shows redirect note on ≥lg (mobile keeps it) | ✅ |
| Desktop: D/W/M/6M/Y segment control removed | Dashboard desktop always shows daily chart; mobile keeps segment control | ✅ |
| Desktop dashboard: filter aside added | Same filter card as transactions — filters already live in shared provider | ✅ |
| TxAvatar restyle | Initials → category emoji on tinted category-color background | ✅ |
| Skeleton on refresh | All pages show skeleton while `refreshing` (v1 behavior preserved) | ✅ |
| Emoji on category chips + donut legend | `ChipRow emojiFor`, `CategoryDonut emojiFor` | ✅ |
| SW cache bump | `telekas-v1` → `telekas-v2` (breaking UI changes) | ✅ |
| Filter section moved to desktop sidebar | `FilterFields` card now lives in `app-shell.jsx` (all pages, scrollable, sidebar 232→260px); per-page filter asides removed from dashboard + transactions | ✅ |
| Unused code removed | Deleted `components/ui/badge.jsx` (zero usage); pruned dead `FilterFields`/`resetFilters` imports from pages | ✅ |
| Sidebar filter scoped to routes | Filter card only on `/` and `/transactions` (not profile/insights) | ✅ |
| Category filter lazy load | Chips ranked by cycle spend, top 5 shown + active selections; "Muat lainnya (+N)" / "Tampilkan lebih sedikit" toggle | ✅ |
| Sidebar sticky + profile pinned | `sticky top-0 h-dvh` aside; profile card `mt-auto` bottom; filter area scrolls independently | ✅ |
| Dashboard right column aligned | Donut cards `flex-1` + centered content — column bottoms match left column | ✅ |
| Verification | `npm run build` green (11 routes) | ✅ |

---

## Phase 4 — Dark Redesign + PWA (July 16, 2026)

**Status:** ✅ Complete (not yet committed)
**Source of truth:** Claude Design project "Budget tracker redesign" (`TeleKas.dc.html`)

### Added

| Item | Location | Status |
|---|---|---|
| Design tokens (dark-only: #000 bg, #141416 card, #B6F53E accent, Manrope) | `app/globals.css`, `tailwind.config.js` | ✅ |
| shadcn-style UI primitives (button, card, input, badge, skeleton, sheet, dropdown-menu, separator) | `components/ui/` | ✅ |
| shadcn CLI config | `components.json` | ✅ |
| Shared dashboard state — filters, D/W/M/6M/Y period, month-cycle nav, cycle + wide fetch | `components/dashboard-provider.jsx` | ✅ |
| App shell — desktop sidebar (≥lg) + floating mobile bottom nav (<lg) | `components/app-shell.jsx` | ✅ |
| Pure-CSS charts (daily bars, labeled bars, conic-gradient donut, top-5 list) | `components/charts.jsx` | ✅ |
| Shared widgets (period pill, segment control, source dropdown, chips, tx avatar/amount) | `components/widgets.jsx` | ✅ |
| Aggregation helpers (daily/weekly/monthly series, category share, top spending, day grouping) | `lib/aggregate.js` | ✅ |
| Utility helpers (`cn`, rupiah formatters, category palette) | `lib/utils.js` | ✅ |
| Route group with per-page mobile + desktop layouts | `app/(app)/{page,transactions,insights,profile}` | ✅ |
| PWA manifest + icons (SVG source, PNGs via sharp) | `public/manifest.webmanifest`, `public/icons/` | ✅ |
| Service worker — network-first pages, cache-first static, `/api` never cached, prod-only registration | `public/sw.js`, `components/sw-register.jsx` | ✅ |

### Performed

| Task | Detail | Status |
|---|---|---|
| Imported design from claude.ai/design | 7 screens (2 desktop, 5 mobile) mapped to pages | ✅ |
| Root layout rewrite | Manrope via `next/font`, PWA metadata, dark html class | ✅ |
| Login page restyle | Dark card, ui primitives, same `/api/login` flow | ✅ |
| Middleware update | `PUBLIC_ASSETS` allowlist → manifest/sw/icons reachable pre-auth | ✅ |
| Dependency changes | + radix (dialog, dropdown), cva, clsx, tailwind-merge, lucide-react, tailwindcss-animate, sharp (dev) · − recharts | ✅ |
| Legacy cleanup | Deleted old `app/page.js` + 11 flat components (ChartsGrid, TransactionTable, MonthNavigator, filters, DarkModeToggle, UserMenu, …) | ✅ |
| Verification | `npm run build` green (11 routes); prod smoke test: auth redirects intact, PWA assets 200 | ✅ |

### Decisions

- **Dark-only.** Design has no light variant → dark-mode toggle removed.
- **Charts hand-rolled** (divs + conic-gradient) to match design pixel-for-pixel; recharts dropped.
- **Two views = responsive breakpoint (`lg`)**, not separate routes — one URL works installed (mobile PWA) and on desktop web.
- Bump `CACHE` name in `public/sw.js` when shipping breaking asset changes.

### Follow-ups

- 📌 Commit Phase 4 work
- 📌 Real-device PWA install test (Android/iOS)
- 📌 Editable preferences (monthly start day, week start) — currently read-only from env
- 📌 Pagination / virtualization for large transaction tables

---

## Phase 3 — Dashboard MVP + UX Polish (June 30 – July 5, 2026)

**Status:** ✅ Complete — see [PHASE_3_SUMMARY.md](PHASE_3_SUMMARY.md)

Highlights: date-range engine (bulanan/mingguan/kustom), monthly cycle via env, Google Sheets API integration, JWT auth + middleware, charts (recharts, since replaced), skeleton loading, monthly chart filter fix (`a319d6f`).
