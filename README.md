# IMO Mirror

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A fast, server-rendered mirror of [imo-official.org](https://www.imo-official.org/) — the official website of the International Mathematical Olympiad.

The original site is notoriously slow despite being essentially static content updated once a year. This project provides a complete, URL-compatible mirror built with modern web technologies.

## Features

- **100% URL compatible** — every original `.aspx` URL works with a simple domain swap, including all query parameters
- **Server-side rendered** — complete HTML on every request (SEO, social sharing, AI crawlers)
- **SPA-like navigation** — client-side routing with link preloading for instant page transitions
- **All data bundled** — 66 IMO editions (1959–2025), 145 countries, 15,000+ participants as static JSON (no runtime API calls)
- **18 pages** — timeline, countries, year/country info, individual & team results, statistics, hall of fame, participant profiles, results matrix, and more
- **Interactive charts** — custom SVG chart library (bar, line, scatter) with tooltips
- **Command palette search** — fuzzy search across participants, countries, and years (⌘K)
- **Sortable tables** — click any column header to sort
- **Comprehensive SEO** — per-page `<title>`, meta descriptions, Open Graph tags, canonical URLs
- **Responsive design** — mobile-first layout

## Tech Stack

- **Framework:** [SvelteKit 2](https://svelte.dev/) with [Svelte 5](https://svelte.dev/blog/svelte-5-is-alive) (runes API)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/) via `@sveltejs/adapter-cloudflare`
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + scoped `<style>` blocks + CSS custom properties
- **Charts:** Custom SVG components (`src/lib/charts/`) — no external chart dependencies
- **Typography:** DM Serif Display (headings) + DM Sans (body)
- **Data:** Static JSON files bundled at build time (small files imported directly, large files code-split via dynamic `import()`)
- **Package manager:** pnpm

## Project Structure

```
src/
├── routes/                # SvelteKit pages
│   ├── *.aspx/            # URL-compatible route folders
│   │   ├── +page.svelte   # Page component
│   │   └── +page.ts       # Universal load() function
│   ├── +layout.svelte     # Header, nav, footer
│   └── +layout.ts         # Data prefetch trigger
├── lib/
│   ├── charts/            # Custom SVG chart components
│   ├── components/        # Shared UI components
│   ├── data/              # Small JSON (static import)
│   ├── data/massive/      # Large JSON (dynamic import)
│   ├── styles/            # Shared CSS modules
│   ├── utils/             # TypeScript utilities
│   └── data-store.ts      # Module-scope data promises
├── app.css                # Global styles + design tokens
└── app.html               # HTML shell
static/
├── flags/                 # Country flag images (webp)
scripts/                   # Data scraping & audit scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Development

```bash
pnpm install
pnpm dev
```

Dev server starts at `http://localhost:5173`.

### Build & Preview

```bash
pnpm build
pnpm preview
```

### Type Checking

```bash
pnpm check
```

## URL Compatibility

Every original `imo-official.org` URL works:

| Original | Mirror |
|---|---|
| `imo-official.org/year_info.aspx?year=2024` | `mirror/year_info.aspx?year=2024` |
| `imo-official.org/participant_r.aspx?id=1234` | `mirror/participant_r.aspx?id=1234` |
| `imo-official.org/country_info.aspx?code=USA` | `mirror/country_info.aspx?code=USA` |
| `imo-official.org/hall.aspx` | `mirror/hall.aspx` |

Route folders are named `*.aspx/` to preserve the original URL structure. Query parameters (`?year=`, `?code=`, `?id=`, etc.) are read via `url.searchParams` in `load()` functions.

## Deployment

### Cloudflare Pages

1. Connect the repository to Cloudflare Pages
2. Set build command: `pnpm install && pnpm build`
3. Cloudflare auto-detects `@sveltejs/adapter-cloudflare` and deploys as a Workers site

No `wrangler.toml` is required — the adapter generates the necessary configuration at build time.

## License

MIT — see [LICENSE](LICENSE) for details.
