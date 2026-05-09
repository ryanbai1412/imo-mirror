# Tailwind CSS + Mobile Support Plan

## Overview

Replace `app.css` (463 LOC) with Tailwind
utility classes and simultaneously fix every
mobile UX issue. The key principle: **write
every class mobile-first** — the base styles
target phones, `md:` / `lg:` overrides add
desktop layout.

This plan corresponds to **Phase A** in
`MIGRATION.md`. It assumes v0 (SvelteKit
port) is complete and stable.

---

## Current Mobile Problems

### 1. Nav wraps into a messy blob

The header stacks vertically at 768px but
5 nav links + search button still flex-wrap
into 2–3 rows. No hamburger, no collapse.

### 2. Tables overflow the viewport

`.table-container` has **no `overflow-x`**.
Pages like `year_individual_r` have 11
columns — they clip on any phone.

### 3. Charts are fixed-width, mouse-only

Many `<canvas>` tags hardcode `width="700"`
or `width="900"`. Tooltips use `mousemove`
only — no touch support.

### 4. Scatter plots are 400×400 fixed

Two side-by-side 400px canvases in a 2-col
grid. Below 768px the grid goes to 1-col
but the canvas still wants 400px.

### 5. Only one responsive breakpoint

The entire global stylesheet has a single
`@media (max-width: 768px)` block. No
intermediate breakpoint, no ultra-small
handling.

### 6. Sticky table header offset is wrong

`position: sticky; top: 56px` assumes a
56px header. On mobile the header wraps
taller, so table headers slide under it.

### 7. Tap targets are too small

Table sort headers, pill nav links, and
chart tooltip hit areas are all < 44px —
below Apple HIG and WCAG 2.5.8 minimums.

---

## Pre-Tailwind Quick Fixes (do in v0)

These are trivial patches to the current
CSS that shouldn't wait for Phase A.

### P0: Table horizontal scroll

```css
/* app.css — change existing rule */
.table-container {
  margin: 0 0 16px;
  overflow-x: auto;       /* ← add */
  -webkit-overflow-scrolling: touch;
}
```

One line. Fixes every table page on mobile.

### P0: Remove hardcoded canvas widths

In every page template, change:
```html
<!-- before -->
<canvas id="growth-chart"
  width="900" height="320" />

<!-- after -->
<canvas id="growth-chart" height="320" />
```

And always pass `W = 0` to `chartSetup()`
so `initCanvas` measures the parent's
`clientWidth`. ~10 edits across 4 chart
pages.

### P1: Touch events for chart tooltips

In `chart-utils.js` `setupTooltip()`, add
`touchstart` / `touchend` listeners that
mirror the existing `mousemove` /
`mouseleave` behavior. ~20 LOC.

---

## Tailwind Setup

### Install

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

### Vite plugin

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
})
```

### Import in app.css

```css
/* src/app.css — top of file */
@import "tailwindcss";
```

### Theme config

Map the existing CSS custom properties
into Tailwind's theme system. Use the
CSS-based `@theme` directive in `app.css`
so no separate config file is needed
(Tailwind v4 pattern):

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-navy: #0f172a;
  --color-navy-light: #1e293b;
  --color-navy-mid: #334155;
  --color-gold: #c9a84c;
  --color-gold-light: #e8d48b;
  --color-cream: #faf9f6;
  --color-surface: #ffffff;
  --color-border: #e2e0db;
  --color-border-light: #f0eeea;
  --color-text-primary: #1e1e1e;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-link: #2563eb;
  --color-link-hover: #1d4ed8;

  --color-medal-gold: #b8860b;
  --color-medal-silver: #6b7280;
  --color-medal-bronze: #92400e;
  --color-medal-hm: #047857;
  --color-medal-gold-bg: #fef3c7;
  --color-medal-gold-fg: #92400e;
  --color-medal-silver-bg: #f1f5f9;
  --color-medal-silver-fg: #475569;
  --color-medal-bronze-bg: #fef2e8;
  --color-medal-bronze-fg: #9a3412;
  --color-medal-hm-bg: #ecfdf5;
  --color-medal-hm-fg: #065f46;

  --color-table-stripe: #f8f6f1;
  --color-table-hover: #f0ede6;
  --color-surface-hover: #f8f7f4;
  --color-kbd-bg: #f1f5f9;
  --color-kbd-border: #e2e8f0;

  /* Fonts */
  --font-display: 'DM Serif Display',
    Georgia, serif;
  --font-body: 'DM Sans', -apple-system,
    BlinkMacSystemFont, 'Segoe UI',
    sans-serif;

  /* Radii */
  --radius-default: 6px;
  --radius-pill: 20px;
  --radius-badge: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-default: 0 1px 3px
    rgba(0,0,0,0.08),
    0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px -1px
    rgba(0,0,0,0.08),
    0 2px 4px -1px rgba(0,0,0,0.04);

  /* Layout */
  --max-width-site: 1140px;

  /* Transitions */
  --transition-default: 150ms ease;
}
```

This gives us utilities like `bg-navy`,
`text-gold-light`, `font-display`,
`rounded-pill`, `shadow-default`, etc.

---

## Residual app.css

After Tailwind is set up, `app.css` shrinks
to only things that can't be utility classes:

```css
@import "tailwindcss";

@theme { /* ... tokens above ... */ }

/* === Base reset === */
@layer base {
  *:focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 2px;
    border-radius: 2px;
  }

  body {
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
}

/* === Animations === */
@keyframes fadeIn {
  from { opacity: 0; translateY(4px); }
  to   { opacity: 1; translateY(0); }
}

/* === Chart tooltip (JS-positioned) === */
.chart-tooltip { /* keep as-is */ }
.chart-tooltip.visible { opacity: 1; }
.chart-tooltip-row { /* keep */ }
.chart-tooltip-swatch { /* keep */ }

/* === Canvas HiDPI === */
.chart-wrapper canvas {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}
```

Everything else moves into component markup
as Tailwind classes.

---

## Conversion Strategy

### Order of conversion

Convert **layout shell first**, then shared
UI primitives, then page-by-page. Each step
can be merged independently.

| # | What | Scope |
|---|------|-------|
| 1 | Layout shell (header, footer, site-main) | `+layout.svelte` |
| 2 | Mobile nav (hamburger) | `+layout.svelte` |
| 3 | Global primitives (tables, cards, badges, buttons, pills, stat cards, notices, forms) | `app.css` → component classes or shared snippets |
| 4 | Chart wrappers + legends | `ChartLegend.svelte`, page `<style>` blocks |
| 5 | Page-by-page scoped styles | Each `+page.svelte` |
| 6 | Command palette | `CommandPalette.svelte` |
| 7 | Delete old CSS, clean up | `app.css` residual only |

### Parallel-safe

Because Tailwind utilities and old CSS
classes can coexist, you can convert one
component at a time without breaking
anything. The old `.data-table` class still
works while you add `class="w-full
border-collapse"` to a new table.

---

## Mobile-First Component Patterns

### Header + Mobile Nav

**Desktop** (≥768px): horizontal nav bar,
search box inline.

**Mobile** (<768px): logo + hamburger icon.
Tapping hamburger opens a slide-down panel
with nav links stacked vertically, search
at top.

```svelte
<!-- +layout.svelte (pseudocode) -->
<header class="sticky top-0 z-50
  bg-navy text-white shadow-lg">
  <div class="max-w-site mx-auto px-4
    h-14 flex items-center justify-between">

    <!-- Logo -->
    <a href="/" class="flex items-center
      gap-2.5">
      <img src="/imo-logo.gif"
        class="h-9 w-auto rounded-sm" />
      <h1 class="font-display text-xl
        hidden sm:block">
        International Mathematical Olympiad
      </h1>
      <h1 class="font-display text-base
        sm:hidden">IMO</h1>
    </a>

    <!-- Desktop nav -->
    <nav class="hidden md:flex
      items-center gap-0">
      {#each NAV_ITEMS as item}
        <a href={item.href}
          class="px-3.5 py-1.5 text-sm
            text-white/75 rounded
            hover:text-white
            hover:bg-white/8
            transition-all">
          {item.label}
        </a>
      {/each}
      <SearchButton />
    </nav>

    <!-- Mobile hamburger -->
    <button class="md:hidden p-2"
      on:click={toggleMenu}>
      <Menu size={20} />
    </button>
  </div>

  <!-- Mobile menu panel -->
  {#if menuOpen}
    <nav class="md:hidden border-t
      border-white/10 px-4 py-3
      flex flex-col gap-1">
      {#each NAV_ITEMS as item}
        <a href={item.href}
          class="px-3 py-2.5 text-sm
            rounded-lg
            hover:bg-white/8
            min-h-[44px]
            flex items-center">
          {item.label}
        </a>
      {/each}
    </nav>
  {/if}
</header>
```

Key decisions:
- Logo text shortens to "IMO" below `sm:`
- `min-h-[44px]` on mobile nav links for
  tap-target compliance
- Menu is a simple conditional block, not
  a drawer (keeps it simple)

### Tables

```svelte
<!-- Shared table wrapper pattern -->
<div class="overflow-x-auto -mx-4 px-4
  md:mx-0 md:px-0">
  <table class="w-full border-collapse
    text-sm tabular-nums min-w-[600px]">
    ...
  </table>
</div>
```

- Negative margin lets the table bleed to
  screen edges on mobile for more room
- `min-w-[600px]` ensures columns don't
  crush — horizontal scroll kicks in
- Tables with many columns (11+ like
  `year_individual_r`) get `min-w-[800px]`

### Stat Cards

```html
<div class="grid grid-cols-2 sm:grid-cols-3
  lg:grid-cols-5 gap-2 md:gap-3 mb-6">
  <div class="flex flex-col items-center
    p-3 md:p-4 border border-border
    rounded-default bg-surface">
    <span class="text-2xl font-bold
      font-display">42</span>
    <span class="text-xs text-text-secondary
      uppercase tracking-wide mt-0.5">
      Gold
    </span>
  </div>
</div>
```

- 2 columns on phones, 3 on tablets, 5 on
  desktop
- Padding reduces on mobile

### Charts

```svelte
<div class="bg-white border border-border
  rounded-default shadow-sm p-3 md:p-4
  overflow-visible mb-3">
  <canvas bind:this={el} class="w-full" />
</div>
```

- No explicit `width` attribute
- `onMount` → `initCanvas(id, 0, H)` so
  width is always measured from parent
- On window resize, redraw (debounced)

### Charts Row (side-by-side charts)

```html
<div class="grid grid-cols-1 md:grid-cols-2
  gap-4 md:gap-6 my-4 mb-6">
  <!-- chart sections -->
</div>
```

Stacked on mobile, side-by-side on desktop.

### Scatter Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2
  gap-5 mb-3">
  <!-- scatter cells -->
</div>
```

Same pattern — stacked on mobile.

### Pill Nav

```html
<div class="flex flex-wrap w-fit
  rounded-default border border-border
  overflow-hidden">
  <a class="px-4 py-2 text-sm font-medium
    bg-surface text-text-secondary
    border-l border-border first:border-l-0
    hover:bg-surface-hover
    min-h-[44px] flex items-center
    transition-all">
    Tab Label
  </a>
</div>
```

`min-h-[44px]` for tap targets. `flex-wrap`
handles overflow on tiny screens.

### Command Palette (mobile)

```svelte
<!-- Responsive dialog -->
<div class="cmd-dialog w-full
  max-w-[580px] mx-4
  md:mx-auto
  max-h-[80vh] md:max-h-[500px]
  flex flex-col">

  <!-- Hide keyboard hints on touch -->
  <div class="cmd-footer
    hidden md:flex ...">
    ...
  </div>
</div>
```

- Cap height to `80vh` on mobile so it
  doesn't exceed the screen
- Hide keyboard shortcut footer on mobile
  (useless on touch)
- Increase result row padding for touch:
  `py-3 md:py-2.5`

### Page Content

```html
<main class="flex-1 w-full max-w-site
  mx-auto px-4 md:px-6
  pt-5 pb-8 md:pt-8 md:pb-12">
  <slot />
</main>
```

Tighter padding on mobile, more room on
desktop.

---

## Sticky Header Height Fix

The current `position: sticky; top: 56px`
on table headers assumes a fixed header
height. On mobile the header is taller.

**Solution**: Use a CSS variable set by JS:

```svelte
<!-- +layout.svelte -->
<script>
  let headerEl
  onMount(() => {
    const update = () => {
      document.documentElement.style
        .setProperty(
          '--header-h',
          headerEl.offsetHeight + 'px'
        )
    }
    update()
    window.addEventListener('resize', update)
    return () =>
      window.removeEventListener(
        'resize', update
      )
  })
</script>

<header bind:this={headerEl} ...>
```

Then in the table head styles:
```css
.data-table th {
  position: sticky;
  top: var(--header-h, 56px);
}
```

---

## Touch Tooltip Support

Add to `setupTooltip()` in `chart-utils.js`:

```js
canvas._ttTouch = function(e) {
  e.preventDefault();
  var touch = e.touches[0];
  if (!touch) return;
  // Reuse mousemove handler with
  // synthetic coordinates
  canvas._ttMove({
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY,
  });
};
canvas._ttTouchEnd = function() {
  canvas._ttLeave();
};
canvas.addEventListener(
  'touchstart', canvas._ttTouch,
  { passive: false }
);
canvas.addEventListener(
  'touchmove', canvas._ttTouch,
  { passive: false }
);
canvas.addEventListener(
  'touchend', canvas._ttTouchEnd
);
```

This gets deleted entirely once Layerchart
replaces canvas charts (Phase B).

---

## Breakpoint Strategy

| Token | Width | Target |
|-------|-------|--------|
| (base) | 0 – 639px | Phones |
| `sm:` | ≥ 640px | Large phones / small tablets |
| `md:` | ≥ 768px | Tablets / small laptops |
| `lg:` | ≥ 1024px | Desktops |

These are Tailwind's defaults. No custom
breakpoints needed — the site's max-width
is 1140px so `lg:` covers desktop and `xl:`
is unnecessary.

**Rule**: every component starts with the
mobile layout as the base class. Desktop
overrides use `md:` or `lg:` prefixes.

---

## Migration Checklist

### Setup
- [ ] Install `tailwindcss`, `@tailwindcss/vite`
- [ ] Add Tailwind plugin to `vite.config.ts`
- [ ] Add `@import "tailwindcss"` + `@theme`
      block to `app.css`
- [ ] Verify dev server works with both old
      CSS classes and new utilities

### Layout shell
- [ ] Convert `.site-header` → Tailwind
- [ ] Add mobile hamburger nav
- [ ] Convert `.site-footer` → Tailwind
- [ ] Convert `.site-main` → Tailwind
- [ ] Dynamic `--header-h` CSS variable

### Global primitives
- [ ] `.data-table` → Tailwind + keep as
      `@apply` component (too many pages to
      inline every cell class)
- [ ] `.table-container` → add
      `overflow-x-auto`
- [ ] `.stat-card` / `.stats-row` → Tailwind
- [ ] `.card` → Tailwind
- [ ] `.badge` → Tailwind
- [ ] `.btn` / `.btn-primary` → Tailwind
- [ ] `.pill-nav` → Tailwind
- [ ] `.notice` → Tailwind
- [ ] `.info-grid` → Tailwind
- [ ] `.form-input` / `.form-label` →
      Tailwind
- [ ] `.chart-wrapper` → Tailwind
- [ ] `.chart-legend` → Tailwind
- [ ] `.problem-picker` / `.problem-pill` →
      Tailwind
- [ ] Award classes (`.award-gold-medal`,
      etc.) → Tailwind
- [ ] Medal background classes → Tailwind

### Chart fixes
- [ ] Remove all hardcoded `width` attrs
      from `<canvas>` tags
- [ ] Always pass `W = 0` to `chartSetup()`
- [ ] Add touch events to `setupTooltip()`
- [ ] Add debounced resize → redraw

### Pages (convert scoped styles)
- [ ] `index` (homepage hero, home-grid)
- [ ] `country_info` (medal cards)
- [ ] `participant_r` (participant header)
- [ ] `results_matrix` (matrix container,
      sticky col)
- [ ] `statistics` (range picker, all
      chart sections)
- [ ] `year_statistics` (chart sections)
- [ ] `team_r` (chart sections)
- [ ] `organizers` (chart + table)
- [ ] All remaining simple table pages

### Command palette
- [ ] Hide keyboard footer on mobile
- [ ] Cap height to `80vh` on mobile
- [ ] Increase touch targets on result rows
- [ ] Test virtual keyboard interaction

### Cleanup
- [ ] Delete all converted CSS from
      `app.css`
- [ ] Delete all scoped `<style>` blocks
      that are now pure Tailwind
- [ ] Verify no unused CSS remains
- [ ] Test on real devices: iPhone SE
      (375px), iPhone 14 (390px),
      iPad Mini (768px), desktop

---

## Effort Estimate

| Task | Time |
|------|------|
| Tailwind setup + theme | 0.25 day |
| Layout shell + mobile nav | 0.5 day |
| Global primitives | 0.5 day |
| Chart fixes (canvas + touch) | 0.25 day |
| Page-by-page conversion | 0.75 day |
| Command palette mobile | 0.25 day |
| Testing + polish | 0.5 day |
| **Total** | **~3 days** |

---

## What This Does NOT Cover

- **Layerchart migration** (Phase B) —
  replaces canvas charts with responsive
  SVG. That's a separate ~3 day project
  but eliminates all canvas sizing and
  touch tooltip issues permanently.

- **Dark mode** — The token system above
  makes this trivial to add later. Define
  a second set of color values under
  `@media (prefers-color-scheme: dark)`
  or a `.dark` class toggle.

- **Component extraction** (Phase F) —
  `DataTable.svelte`, `StatsCard.svelte`,
  etc. Wait until Tailwind patterns
  stabilize before abstracting.

---

## Notes on `@apply` vs Inline

Prefer inline utilities everywhere. Use
`@apply` only for:

1. **`.data-table`** — the `th`/`td` styles
   repeat across 15+ pages with identical
   markup. One `@apply` component is
   cleaner than 200 table cells with
   identical class strings.

2. **`.chart-tooltip`** — JS-positioned,
   dynamically created by `chart-utils.js`.
   Can't use inline Tailwind on elements
   created in vanilla JS.

3. **Award color classes** — used in many
   pages via `AwardLabel.svelte`. Keep as
   tiny `@apply` components.

Everything else: inline utilities.
