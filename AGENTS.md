# AGENTS.md — IMO Mirror

## Project Overview

A fast, server-rendered mirror of
[imo-official.org](https://www.imo-official.org/)
built with **SvelteKit** + **Cloudflare Workers**.
All IMO data (1959–present) is bundled as
static JSON — no external API calls at runtime.

## Tech Stack

- **Framework:** SvelteKit 2 with **Svelte 5**
- **Styling:** Tailwind CSS v4
  (`@import "tailwindcss"` in `src/app.css`)
- **Charts:** Custom SVG chart library (no
  external deps) in `src/lib/charts/`
- **Icons:** `lucide-static` — raw SVG strings,
  rendered via `Icon.svelte` + `resizeSvg()`
- **Deployment:** Cloudflare Workers
  (`@sveltejs/adapter-cloudflare`)
- **Package manager:** pnpm (monorepo with
  `pnpm-workspace.yaml`)
- **TypeScript:** enabled, non-strict
- **Linting:** ESLint + eslint-plugin-svelte +
  Prettier + prettier-plugin-svelte
- **Git hooks:** Husky + lint-staged
  (auto-format + lint on commit)

## Svelte 5 — Mandatory

This project uses **Svelte 5 runes**. All
components already use the runes API.

- **Props:** use `$props()`, never `export let`
- **Reactivity:** use `$derived()` and
  `$effect()`, never `$:` reactive statements
- **Snippets:** use `Snippet` type for slot-like
  patterns, not `<slot />`
- **State:** use `$state()` for mutable local
  state
- **Lifecycle:** `onMount` / `onDestroy` are
  still valid in Svelte 5

```svelte
<!-- ✅ correct -->
<script lang="ts">
  let { code, label = undefined }: {
    code: string;
    label?: string;
  } = $props();

  let derived = $derived(code.toUpperCase());
</script>

<!-- ❌ wrong — Svelte 4 syntax -->
<script lang="ts">
  export let code: string;
  $: derived = code.toUpperCase();
</script>
```

## Project Structure

```
src/
  routes/              # SvelteKit pages
    *.aspx/            # URL-compat folders
      +page.svelte     # View
      +page.ts         # Universal load()
    +layout.svelte     # Header, nav, CommandPalette
    +layout.ts         # Prefetch trigger
  lib/
    charts/            # Custom SVG chart components
    components/        # Shared UI components
    data/              # Small JSON (static import)
    data/massive/      # Large JSON (dynamic import)
    styles/            # Shared CSS modules
    data-store.ts      # Module-scope promises
    utils/             # TS utilities
static/
  flags/               # Country flag WebP images
```

## Data Layer

### Static imports (small, baked into JS bundle)
Files in `src/lib/data/*.json` are imported
directly via `import X from "$lib/data/X.json"`.
Includes: `countries.json`, `timeline.json`,
`hall_of_fame.json`, `year_info.json`,
`results_country.json`, `results_year.json`,
`results_matrix.json`, `year_statistics.json`.

### Dynamic imports (large, code-split by Vite)
`src/lib/data/massive/` contains two large files:
- `individual_results_by_year.json` (~594 KB gz)
- `country_results_by_year.json` (~188 KB gz)

These are loaded via module-scope promises in
`src/lib/data-store.ts`:
```ts
export const individualResults =
  import("./data/massive/...json")
    .then(m => m.default)
```

The root `+layout.ts` imports `data-store` to
begin prefetching on first page load. Page
`load()` functions `await` these promises.

### Vite JSON handling
`vite.config.ts` sets `json: { stringify: true }`
so large JSON imports are tree-shaken and
pre-stringified for faster parsing at runtime.

**Rules:**
- Never `fetch()` JSON at runtime — always use
  `import` or `import()` through the data store.
- Never duplicate data loading. If data is
  already available via the store, reuse it.

### Typed loaders
All data access goes through typed loader
functions in `$lib/utils/data.ts`:
- `loadTimeline()`, `loadCountries()`,
  `loadYearInfo()`, `loadYearStatistics()`,
  `loadHallOfFame()`, `loadResultsCountry()`,
  `loadResultsYear()`, `loadResultsMatrix()`
  — synchronous (static imports)
- `loadIndividualResultsByYear()`,
  `loadCountryResultsByYear()`
  — return promises (dynamic imports)

TypeScript interfaces for all data shapes are
defined in `$lib/utils/data.ts`. Use these
types — never use `any` for IMO data.

## URL Compatibility

Every original `imo-official.org` URL must work:
- Route folders are named `*.aspx/` to match
  the original URL structure
- Query params (`?year=`, `?code=`, `?id=`, etc.)
  are read via `url.searchParams` in `load()`
- Redirects (e.g. `default.aspx` → `/`) use
  `redirect()` in `+page.server.ts`
- **Never rename or restructure route folders**
  without preserving URL compatibility

## IMO Country Code "C01" (Individual Participants)

The IMO occasionally allows individuals to
compete outside any national team. These
participants are assigned synthetic country codes
like `C01`, `C02`, etc. In the data:

- `country_code: "C01"` with
  `country: "Individual Participant"`
- They appear in `individual_results_by_year.json`
  and `results_country.json`
- They do **not** appear in `countries.json`
  (no flag, no country info page)

**How to handle C01 codes:**
- Use `isIndividualContestant(code)` from
  `$lib/utils/data` — it matches `/^C\d+$/`
- `CountryLink.svelte` filters these out via
  `isIndividualContestant()` so they don't render
  as broken links
- Never link to `/country_info.aspx?code=C01` —
  there is no country page for these codes
- When displaying country names, show the raw
  `country` field ("Individual Participant"),
  not the code
- These codes may appear in result tables and
  charts — handle them gracefully (no flag
  image, no country link)

## Charts

All charts are in `src/lib/charts/` — custom
SVG components with no external chart deps.

- `_core.ts` — scales, grid math, tooltip
  positioning, hit-testing (no D3)
- `ChartTooltip.svelte` — shared fixed-position
  HTML tooltip
- `BarChart.svelte` — simple, stacked,
  highlight, overlay line, dot overlays
- `LineChart.svelte` — multi-line + dual-axis
  (right axis support)
- `ScatterChart.svelte` — jitter + weighted
  modes, award-based coloring

Key patterns:
- Pure SVG — SSR-safe, no `{#if browser}`
  guard needed
- `ResizeObserver` for responsive width
- All three chart components import
  `$lib/styles/chart.css` for shared styles
  (.chart-container, .chart-title, .chart-svg,
  .axis-label, .chart-loading + shimmer)
- Component-specific rules stay in scoped
  `<style>` blocks
- Tooltip callbacks are page-defined via
  `tooltipFn` prop
- **Colors:** defined in
  `$lib/utils/chartColors.ts` — mirrors
  `--color-chart-*` tokens in `app.css`.
  Keep both in sync when changing values.
- `STACKED_BAR_ORDER` in `chartColors.ts`
  defines the standard medal stacking order

## Components

Shared components live in `src/lib/components/`.

### Layout & Navigation
- `PageHeader.svelte` — page title with
  pill-nav tabs and optional prev/next arrows.
  Uses `ArrowLink` internally.
- `ArrowLink.svelte` — prev/next arrow link
- `CommandPalette.svelte` — global search
  (Cmd+K / Ctrl+K). Progressive index:
  phase 1 = pages + countries + years (instant),
  phase 2 = participants + country@year (async
  from dynamic imports). Supports prefix
  filters: `p:` people, `c:` countries,
  `y:` years, `pg:` pages.
- `LinkCard.svelte` — clickable card with
  `href`, `title`, `description` for nav grids.

### Data Display
- `DataTable.svelte` — sortable table using
  snippet-based rows. Imports `table.css`.
- `SortableTableHead.svelte` — reusable `<thead>`
  with sort links. Works with `sort.ts` utils.
- `InfoGrid.svelte` — key-value grid layout
  for info pages. Use `grouped` prop for
  subgrid sections with headings.
- `StatCard.svelte` — stat display card with
  `value`, `label`, optional `class` for color.
- `AwardLabel.svelte` — renders medal award
  text with `.award-*` color classes.
- `MedalBadge.svelte` — colored pill badge
  for medal counts.

### Charts & Pickers
- `ChartSection.svelte` — wraps chart in
  `.stats-section` + `.chart-wrapper`. Imports
  `chart-layout.css`.
- `ChartLegend.svelte` — swatch + label legend
  for charts.
- `ScatterGrid.svelte` — two-column grid for
  paired scatter charts. Imports
  `chart-layout.css`.
- `PillPicker.svelte` — toggle-button picker
  for switching data views. Props: `items`,
  `active`, `onSelect`, optional `wide`.
- `RangePicker.svelte` — year range selector
  with preset buttons. Uses `$bindable()` for
  `start`/`end`.

### Atoms
- `Icon.svelte` — renders `lucide-static` SVG
  by name. Props: `name` (icon key), `size`,
  `class`. Uses `resizeSvg()` from
  `$lib/utils/svgResize.ts`.
- `FlagImg.svelte` — lazy-loaded country flag.
  Props: `src`, `alt`, `size` ("sm" | "lg").
- `CountryLink.svelte` — flag + country name
  link. Filters out individual contestants
  via `isIndividualContestant()`.

## Utilities

All in `src/lib/utils/`:
- `data.ts` — typed loaders, interfaces,
  `isIndividualContestant()`, `formatDate()`,
  `buildDistBuckets()`, `officialMedalsByYear()`
- `sort.ts` — `sortData()`, `parseSortParams()`,
  `getSortUrl()`, `sortIndicator()`
- `awardClass.ts` — `AwardType` type,
  `awardType()` (resolves award array),
  `awardClass()` (maps to CSS class)
- `chartColors.ts` — `CHART_COLORS` object +
  `STACKED_BAR_ORDER` for medal bar charts
- `seo.ts` — `SITE_NAME`, `BASE_URL`,
  `DEFAULT_DESCRIPTION` constants
- `nav.ts` — `resultsNavItems`,
  `countryNavItems(code)`, `yearNavItems(year)`
  for consistent nav pill menus
- `svgResize.ts` — `resizeSvg()` for
  lucide-static SVG dimension patching
- `linkifyEmails.ts` — `linkifyEmails()`
  splits text around emails for mailto: links

## Coding Conventions

1. **Always use `lang="ts"` in `<script>` tags**
2. **Keep `+page.ts` for data loading** — all
   data fetching / transformation happens in
   universal `load()` functions, not in
   components
3. **No inline styles** — use Tailwind classes
   (exception: dynamic `style=` for tooltip
   positioning and chart-legend swatches)
4. **Design tokens** are defined as CSS custom
   properties in `src/app.css` under `@theme`.
   Never hardcode hex colors — always use
   tokens or Tailwind classes. Warning palette
   available: `--color-warning-bg/border/
   accent/text/link`.
5. **Sort logic** lives in `$lib/utils/sort.ts`
   — reuse `sortData()` and `parseSortParams()`.
   Use `SortableTableHead.svelte` for tables.
6. **SEO:** every page needs `<svelte:head>` with
   `<title>`, `<meta name="description">`, and
   OG tags. Use constants from `seo.ts`.
7. **Keep pages self-contained** — each route
   has its own `+page.svelte` and `+page.ts`;
   don't create shared page-level abstractions
   without good reason
8. **Preserve comment style** — don't add or
   remove comments unless explicitly asked

### CSS Architecture

**`app.css`** — only truly global styles:
- `@theme` design tokens (colors, spacing,
  fonts, shadows, radii)
- `@layer base` — focus-visible, body, links
- `@layer components`:
  - `.page-content` — fade-in + heading defaults
  - `.award-*` — medal color classes (8+ pages)

**`src/lib/styles/` — shared CSS modules**
(imported where needed, not global):
- `table.css` — shared table theme. Imported
  by `DataTable.svelte` and standalone table
  pages.
- `chart.css` — shared chart styles
  (.chart-container, .chart-title, .chart-svg,
  .axis-label, .chart-loading, shimmer
  keyframes). Imported by BarChart, LineChart,
  ScatterChart.
- `chart-layout.css` — layout classes
  (.stats-row, .stats-section, .chart-wrapper,
  .charts-row + responsive breakpoint).
  Imported by ChartSection, ScatterGrid, and
  pages that use these classes directly.
- `buttons.css` — .btn family (.btn-primary,
  .btn--pill, .btn--ghost). Imported by
  homepage (+page.svelte) and +error.svelte.

**Scoped `<style>` blocks** — preferred for
component-specific visuals.

**Rule of thumb:**
- Tailwind utilities → layout, spacing,
  responsive
- Scoped `<style>` → component-specific
  visual styles
- Shared CSS modules in `src/lib/styles/` →
  styles used across multiple components/pages
- Global `app.css` → only things used
  across many pages without a wrapper component

## Sitemap

`scripts/generate_sitemap.mjs` generates
`static/sitemap.xml` at build time.

- Runs automatically via `prebuild` npm script
  (every `pnpm build` regenerates it)
- Manual: `pnpm sitemap`
- **Static routes:** auto-discovered from
  `src/routes/` dirs, excluding redirect-only
  routes and param-required dynamic pages
- **Dynamic routes:** generated from data JSON:
  - `?code=` pages from `countries.json`
  - `?year=` pages from `year_info.json`
  - `?code=&year=` combos for `team_r.aspx`
    from `country_results_by_year.json`
  - `?id=` participant pages from
    `individual_results_by_year.json`
- Output goes to `static/sitemap.xml` (served
  as a static asset by Cloudflare)

## Build & Dev

```bash
pnpm install          # install deps
pnpm dev              # dev server (localhost:5173)
pnpm build            # production build
pnpm sitemap          # regenerate sitemap only
pnpm preview          # preview production build
pnpm check            # svelte-check + TypeScript
pnpm format           # prettier --write
pnpm lint             # eslint
pnpm lint:fix         # eslint --fix
```
