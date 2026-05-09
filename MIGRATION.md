# IMO Mirror — Migration Plan

## End-State Goals

1. **SSR for first load** — full HTML for SEO
2. **Client-side SPA after hydration** — instant
   navigation, no server round-trips
3. **Prefetch large data in background** — ~780 KB
   gz, Vite content-hashed
4. **Fast repeat visits** — after prefetch, every
   page renders from cache (true offline
   requires a service worker — see Future
   Improvements)
5. **Deduplicate data** — drop `participants.json`
6. **Modern DX** — Tailwind, proper charting lib,
   clean component model, full TypeScript

## Architecture Overview

```
First visit:
  Browser → CF Worker → SvelteKit SSR →
    full HTML
  Client hydrates, prefetches big JSON
    in background via import()

SPA navigation:
  Client intercepts click
  → load() reads from resolved promise
  → Svelte renders new page client-side
  → No server round-trip
```

### Why SvelteKit over Astro

Astro already gives us SPA-like navigation via
`ClientRouter` (View Transitions API). The real
win from SvelteKit is the **data layer**.

Today, every page re-fetches JSON on every SSR
request via `fetchJson()` — a custom wrapper
that handles Cloudflare's `ASSETS.fetch` vs
global `fetch`. There's no caching, no
deduplication, no singleton promises. Every
navigation triggers a full data round-trip.

SvelteKit + Vite's `import()` gives us:
- Module-scope singleton promises (fetch once,
  resolve everywhere)
- Automatic content-hashed chunks (immutable
  caching for free)
- Universal `load()` that runs on server for
  SSR and client for SPA nav
- No custom `fetchJson` / `ASSETS.fetch`
  workaround needed

---

# v0: Minimal SvelteKit Swap

**Goal:** exact feature parity with the current
Astro site. No new libraries, no redesigns. Just
swap the framework so we unlock the Vite
`import()` data pattern and eliminate the
custom `fetchJson` / `ASSETS.fetch` layer.

## What v0 includes

- Flatten repo: delete `frontend/` nesting,
  root is the SvelteKit package
- Migrate from npm → pnpm
- SvelteKit scaffold + Cloudflare adapter
- All 24 pages ported 1:1 (same HTML output)
- `global.css` carried over verbatim
- `chart-utils.js` carried over verbatim
  (loaded via `<svelte:head>`)
- CommandPalette rewritten for SvelteKit
  (cannot wrap as-is — depends on
  `astro:transitions` APIs)
- All 8 components ported to `.svelte`
- All utils ported to `$lib/` (same TS, relaxed
  strictness OK for now)
- Data layer: Vite `import()` for all JSON —
  small files statically imported, large files
  dynamically imported with auto content-hashing
- SSR on all pages
- SEO parity (title, meta, OG, JSON-LD,
  canonical, sitemap)
- Redirect routes preserved
- Scraper updated to write directly into
  `src/lib/data/`

## What v0 explicitly defers

| Deferred | Why wait |
|---|---|
| Tailwind CSS | `global.css` works fine; converting 462 LOC of styles while also swapping frameworks is unnecessary risk |
| Chart library | `chart-utils.js` (740 LOC) is self-contained Canvas code; it works in Svelte via `onMount` + `<canvas>`. Rewriting to SVG/Layerchart is a separate project |
| Command palette *redesign* | A Svelte-native rewrite with `search_index.json` is nice but not required. v0 rewrites the minimum to work in SvelteKit — the Astro-specific APIs (`navigate()`, `astro:after-swap`) must go, but the search index and UX stay the same |
| Data deduplication | Dropping `participants.json` changes data flow on 2 pages (`participant_r`, CommandPalette). Do it after the framework is stable |
| Strict TypeScript | Existing types in `data.ts` are fine. Enforcing strict mode across all pages adds friction during the port |
| Component redesign | No `DataTable.svelte` abstraction yet — just copy the `<table>` markup per page as-is. Extract shared components later |

---

## v0.0 Repo Restructure

### Flatten to a single package

Kill the `frontend/` nesting. The repo root
*is* the SvelteKit project.

**Before:**
```
/
  data/               ← scraper output
  frontend/           ← actual app
    public/data/      ← copy of /data
    src/
    package.json
  scripts/
```

**After:**
```
/
  src/                ← SvelteKit app
    lib/
      data/           ← small JSON (static import)
      data/massive/   ← big JSON (dynamic import)
      components/
      utils/
    routes/
  static/             ← flags, favicons, js/
  scripts/            ← scraper, sitemap, etc.
  package.json        ← single pnpm package
  svelte.config.js
  vite.config.ts
```

### Migrate to pnpm

Why pnpm: stricter dependency resolution
(catches phantom deps that npm silently
resolves), faster installs via content-
addressable store, better disk usage.

- Delete `frontend/package-lock.json`
- Move `frontend/package.json` → root
  `package.json`
- `pnpm install` to generate `pnpm-lock.yaml`
- Update `.gitignore`
- Update any CI / deploy scripts

### Update scraper output paths

`scripts/scrape.py` currently writes to
`data/` at repo root, which then gets copied
to `frontend/public/data/`. Change the scraper
to write directly into two locations:

```python
# scripts/scrape.py
DATA_DIR = Path(__file__).parent / "src" \
  / "lib" / "data"
MASSIVE_DIR = DATA_DIR / "massive"
```

- Small files → `src/lib/data/*.json`
  (static imports, baked into JS bundle)
- Large files → `src/lib/data/massive/*.json`
  (dynamic `import()`, Vite code-splits +
  content-hashes automatically)
- Delete old `data/` directory
- Delete `frontend/public/data/` directory

### Audit data files before flattening

The two copies of JSON are not byte-identical:
- `data/country_results_by_year.json`
  — 1,806,009 B
- `frontend/public/data/country_results_by_year.json`
  — 1,805,987 B
- Similar delta for
  `individual_results_by_year.json`

Either the scraper ran twice with slightly
different results or there was a manual edit.
**Run `scripts/audit_data.py` on both copies
and diff them** to determine which is canonical
before deleting one.

Similarly update `scripts/audit_data.py` and
`scripts/generate_sitemap.mjs` to read from
`src/lib/data/`.

---

## v0.1 Data Layer

### All JSON lives in `src/lib/data/`

Vite handles everything — no custom manifest,
no hash script, no fetch wrapper. Files in
`src/` get content-hashed automatically at
build time.

**Static imports** (~57 KB total in JS bundle):
```
src/lib/data/
  problems.json               0.4 KB gz
  hall_of_fame.json              2 KB gz
  static_pages.json              2 KB gz
  timeline.json                  3 KB gz
  results_year.json              3 KB gz
  year_info.json                 3 KB gz
  results_country.json           4 KB gz
  countries.json                 7 KB gz
  results_matrix.json           12 KB gz
  year_statistics.json          20 KB gz
```

**Dynamic `import()`** (~782 KB gz,
Vite code-splits + hashes automatically):
```
src/lib/data/massive/
  country_results_by_year.json   ~188 KB gz
  individual_results_by_year.json ~594 KB gz
```

### Why `import()` instead of `fetch()`

Vite's dynamic `import()` gives us everything
the old singleton-promise data-store gave us,
with zero custom code:

| Requirement | How `import()` handles it |
|---|---|
| **Content-hash filenames** | Vite does this automatically for code-split chunks — no manifest needed |
| **Immutable caching** | Hashed chunk URLs are immutable by default |
| **Module-scope singleton** | `import()` returns the same promise for the same module — built into the JS spec |
| **No duplicate fetches** | Second `import()` of same module returns cached promise |
| **SSR** | SvelteKit runs `import()` on server too — it's just a local file read |
| **Code splitting** | Vite splits `massive/*.json` into separate chunks, not in main bundle |

### Data store (just re-exports)

```ts
// src/lib/data-store.ts

// Module-scope promises — start loading
// the moment this module is imported.
// Vite code-splits these into separate
// hashed chunks automatically.
export const individualResults = import(
  './data/massive/individual_results_by_year.json'
).then(m => m.default)

export const countryResults = import(
  './data/massive/country_results_by_year.json'
).then(m => m.default)
```

That's it. No manifest, no hash script, no
custom fetch wrapper. Vite handles everything.

### Prefetch trigger (root layout)

```ts
// src/routes/+layout.ts
import '$lib/data-store'

// Just importing starts both import()s.
// Root layout runs on every page →
// both promises begin on first visit
// regardless of route.

export async function load() {
  return {}
}
```

### Page load example

```ts
// src/routes/year_info.aspx/+page.ts
import {
  individualResults
} from '$lib/data-store'

export async function load({ url }) {
  const year = url.searchParams.get('year')
  const all = await individualResults
  return { year, results: all[year] ?? [] }
}
```
- SSR: `import()` resolves from local FS
- Client first visit: waits for in-flight
  chunk download
- Client SPA nav: promise already resolved →
  instant

### Data prefetch lifecycle

```
First visit (any page):
  1. Server: +layout.ts imports data-store
     → both import()s resolve from FS
  2. Server: +page.ts awaits what it needs
     → SSR HTML
  3. Client hydrates → +layout.ts re-imports
     data-store → both chunk fetches start
  4. Browser caches hashed chunks

SPA navigation:
  1. +page.ts → await individualResults
  2. Promise already resolved → instant

Return visit (new tab / refresh):
  1. Hashed chunk URL → browser cache hit
  2. Promise resolves immediately
```

---

## v0.2 SvelteKit Scaffold

### Project setup
- `npx sv create` at repo root with
  TypeScript, `@sveltejs/adapter-cloudflare`
- `pnpm install`
- Copy `global.css` into `src/app.css`
  (imported in root `+layout.svelte`)
- Move `Layout.astro`'s 104 lines of scoped
  `<style>` (header, footer, nav, search box,
  responsive breakpoints) into
  `+layout.svelte`'s `<style>` block
- Copy `chart-utils.js` into `static/js/`
  (loaded via `<svelte:head>`)
- Copy static assets: `flags/`, favicons,
  `imo-logo.gif` → `static/`

### Route structure

```
src/routes/
  +layout.svelte        ← header, nav, footer
  +layout.ts            ← prefetch trigger
  +page.svelte          ← index (homepage)
  +error.svelte         ← 404
  year_info.aspx/
    +page.svelte
    +page.ts
  country_info.aspx/
    +page.svelte
    +page.ts
  ... (19 content pages)
  default.aspx/
    +page.server.ts     ← redirect → /
  results.aspx/
    +page.server.ts     ← redirect
  timeline.aspx/
    +page.server.ts     ← redirect
  hall_of_fame.aspx/
    +page.server.ts     ← redirect
  country_team.aspx/
    +page.server.ts     ← redirect
```

**24 pages total:**
- 5 redirects (1-line `+page.server.ts`)
- 19 content pages (each with `+page.svelte`
  + `+page.ts`)

### URL compatibility
- Folder `year_info.aspx/` → `/year_info.aspx`
- Query params via `url.searchParams` in `load()`
- Redirects via `redirect(301, ...)` in
  `+page.server.ts`

---

## v0.3 Page Migration

### Page inventory (by complexity)

**Redirects** (5 pages, ~1 LOC each):
- `default.aspx` → `/`
- `results.aspx` → `/results_country.aspx`
- `timeline.aspx` → `/organizers.aspx`
- `hall_of_fame.aspx` → `/hall.aspx`
- `country_team.aspx` → `/country_team_r.aspx`

**Simple table pages** (8 pages, 39–143 LOC):
- `countries.aspx` — sortable table
- `organizers.aspx` — sortable table
- `hall.aspx` — sortable table
- `country_hall.aspx` — table + pill nav
- `results_country.aspx` — sortable table +
  pill nav
- `country_individual_r.aspx` — table +
  pill nav
- `country_info.aspx` — detail + stats cards
- `year_info.aspx` — detail + stats cards

**Parameterized table pages** (4 pages,
110–205 LOC):
- `year_country_r.aspx` — table + pill nav
- `year_individual_r.aspx` — table + pill nav
- `country_team_r.aspx` — table + pill nav
- `participant_r.aspx` — multi-year table

**Complex pages** (1 page, 93 LOC):
- `results_matrix.aspx` — sticky-col matrix

**Homepage** (1 page, 165 LOC):
- `index` — stats cards + recent results

**Chart pages** (4 pages, 159–1217 LOC):
- `results_year.aspx` (159 LOC) — stacked bar
- `team_r.aspx` (383 LOC) — dist + country
  dist charts
- `year_statistics.aspx` (376 LOC) — dist +
  per-problem + scatter
- `statistics.aspx` (1217 LOC) — 8 charts,
  year range picker, transition tables,
  scatter plots

### Migration order

| # | What | Pages | Effort |
|---|------|-------|--------|
| 1 | Redirects | 5 | 0.5 hr |
| 2 | Simple tables | 8 | 1 day |
| 3 | Parameterized tables | 4 | 1 day |
| 4 | Matrix + homepage | 2 | 0.5 day |
| 5a | `results_year.aspx` (159 LOC) | 1 | 0.25 day |
| 5b | `team_r.aspx` (383 LOC) | 1 | 0.5 day |
| 5c | `year_statistics.aspx` (376 LOC) | 1 | 0.5 day |
| 5d | `statistics.aspx` (1217 LOC, 8 charts) | 1 | 1.5 days |

### Chart pages strategy (v0)

**Do not rewrite charts.** Port `chart-utils.js`
as a global script, same as today. Each chart
page uses `onMount()` to call the same canvas
drawing functions.

### Replacing `define:vars`

Astro's `define:vars` serializes server data
into inline `<script>` tags. SvelteKit has no
equivalent, but it doesn't need one — data
from `load()` is available directly in the
component scope via `export let data`.

The pattern:

```svelte
<!-- +page.svelte (chart page, v0) -->
<script>
  import { onMount } from 'svelte'
  // data comes from +page.ts load()
  export let data

  onMount(() => {
    // data is already in scope — no
    // serialization needed. Just pass
    // it directly to chart-utils.js
    // global functions.
    drawDistChart(
      'dist-chart',
      data.distBuckets,
      data.stackedBarOrder,
      data.chartColors
    )
  })
</script>

<canvas id="dist-chart"
  width="700" height="320" />
```

Key difference from Astro: in Astro,
`define:vars` serializes to JSON strings that
get `JSON.parse()`d in inline scripts. In
Svelte, `data` is already a JS object in the
component — no parse step. The `onMount`
callback has direct access.

This is ugly but gives us exact parity with
zero risk. Chart library migration happens in
a later phase.

---

## v0.4 Component Migration

### Port 1:1 from Astro → Svelte

```
src/lib/components/
  PageHeader.svelte     ← PageHeader.astro
  CountryLink.svelte    ← CountryLink.astro
  AwardLabel.svelte     ← AwardLabel.astro
  MedalBadge.svelte     ← MedalBadge.astro
  ChartLegend.svelte    ← ChartLegend.astro
  Icon.svelte           ← Icon.astro
  SortableTableHead.svelte
                        ← SortableTableHead.astro
  CommandPalette.svelte ← CommandPalette.astro
```

These are all simple prop-driven components.
The Astro `interface Props` → Svelte
`export let` props. Scoped `<style>` blocks
carry over directly.

**CommandPalette** is the highest-risk item
in v0 (722 LOC). It cannot be wrapped as-is
because it depends on Astro-specific APIs:
- `navigate()` from `astro:transitions`
  → replace with `goto()` from `$app/navigation`
- Cleanup via `astro:after-swap` event
  → replace with Svelte `onDestroy()`
- Fetches 4 JSON files to build search index
  → keep the same `fetch()` logic for now

The rewrite keeps the same UX and search
index but replaces Astro plumbing with
SvelteKit equivalents. Not a full redesign
— that's Phase C.

### Utils ported to `$lib/`

```
src/lib/
  utils/
    data.ts           ← types only (fetchJson
                        replaced by import())
    sort.ts           ← sortData, parseSortParams
    seo.ts            ← constants
    awardClass.ts     ← awardType, awardClass
    chartColors.ts    ← CHART_COLORS
    linkifyEmails.ts  ← linkifyEmails
    nav.ts            ← nav item generators
    svgResize.ts      ← resizeSvg
```

Mostly copy-paste. `fetchJson` goes away since
data is loaded via `import()` / `import` — no
more Cloudflare `ASSETS.fetch` workaround.

---

## v0.5 SEO & Polish

### SEO parity
- `<svelte:head>` for `<title>`, meta, OG, etc.
- JSON-LD via `{@html}` in `<svelte:head>`
- Canonical URLs
- Sitemap generation (update script paths)

### Navigation
- SvelteKit client-side routing gives us SPA
  nav for free (no `ClientRouter` needed)
- `$page.url.pathname` for active nav detection

---

## v0 Migration Order

| Step | What | Risk | Effort |
|------|------|------|--------|
| 0 | Flatten repo + pnpm | Low | 0.5 day |
| 1 | Scaffold + data layer | Low | 1 day |
| 2 | Layout + components | Low | 1 day |
| 3 | Redirect pages (5) | Low | 0.5 hr |
| 4 | Simple tables (8) | Low | 1 day |
| 5 | Param tables (4) | Low | 1 day |
| 6 | Matrix + homepage (2) | Low | 0.5 day |
| 7 | Chart pages (4, canvas) | Med | 2.75 days |
| 8 | CommandPalette rewrite | **High** | 1.5 days |
| 9 | SEO + redirects + test | Med | 1 day |
|  | **Total** | | **~10 days** |

---

# Future Phases

Everything below happens **after v0 ships and
is stable.** Each phase is independent and can
be done in any order.

---

## Phase A: Tailwind CSS

Replace `global.css` (462 LOC) with Tailwind.

- Design tokens already exist as CSS vars →
  map to `theme.extend`
- Convert components one at a time
- Keep a small `app.css` for base resets
- **Effort:** ~2 days

## Phase B: Chart Library (Layerchart)

Replace `chart-utils.js` (740 LOC of Canvas 2D)
with **Layerchart** — a Svelte-native charting
library built on D3 scales.

### Why Layerchart
- Svelte-native components (reactive,
  composable)
- SVG output (accessible, SSR-compatible,
  responsive)
- Handles all current chart types: stacked
  bar, line, multi-line, scatter, overlays
- Chart.js is Canvas-based (same as what we
  have) and uPlot lacks stacked bars — neither
  is a meaningful upgrade

### Current chart types
- Stacked bar (score dist, medal counts)
- Line chart (trends over time)
- Multi-line (gold/silver/bronze cutoffs)
- Scatter plot (day 1 vs day 2)
- Rank overlay (rank line on stacked bars)

### Approach
- Create `src/lib/charts/` with reusable Svelte
  chart components
- Migrate one chart type at a time
- Delete `chart-utils.js` when done
- **Effort:** ~3 days

## Phase C: Command Palette Rewrite

Replace 722-LOC vanilla JS palette with a
Svelte-native component.

- Generate `search_index.json` (~50 KB) at
  build time instead of fetching 800 KB of
  raw JSON client-side
- Proper Svelte reactivity, keyboard handling,
  accessibility
- Consider Pagefind as an alternative
- **Effort:** ~1.5 days

## Phase D: Data Deduplication

- Drop `participants.json` (7.8 MB)
- Derive participant data from
  `individual_results_by_year.json` at runtime
- Generate lightweight `participant_index.json`
  at build time for search
- **Effort:** ~1 day

## Phase E: TypeScript Strictness

- Enable `strict: true` in `tsconfig.json`
- Add proper types to all `load()` return values
- Type chart data flows end-to-end
- Remove `any` casts from chart pages
- **Effort:** ~1 day

## Phase F: Component Extraction

After patterns stabilize, extract shared
components:

- `DataTable.svelte` — generic sortable table
  with sticky headers
- `StatsCard.svelte` — stat value + label
- `YearNav.svelte` — prev/next year arrows
- Better page-level composition
- **Effort:** ~1 day

---

# Future Improvements (Lower Priority)

- [ ] **Service worker** — true offline support
- [ ] **Split large JSON** — per-year chunks if
  800 KB feels too heavy
- [ ] **Dark mode** — design tokens in CSS vars
  make this easy
- [ ] **i18n** — problem statements exist in
  multiple languages
- [ ] **Performance monitoring** — Core Web
  Vitals, CF Analytics

---

## Open Questions

- [x] Chart library → **Layerchart**
- [ ] Service worker or just HTTP cache?
- [ ] Split `individual_results_by_year.json`
  per-year or keep as one file?
- [ ] Pagefind for search instead of custom
  command palette?
