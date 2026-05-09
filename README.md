# IMO Mirror

[![Built with Devin](https://img.shields.io/badge/Built%20with-Devin-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48L3N2Zz4=)](https://devin.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A fast, static mirror of [imo-official.org](https://www.imo-official.org/) — the official website of the International Mathematical Olympiad.

The original site is notoriously slow despite being essentially static content updated once a year. This project provides a complete, URL-compatible mirror built with modern web technologies.

## Features

- **100% URL compatible** — replace `imo-official.org` with the mirror domain and every `.aspx` URL works, including all query parameters
- **All data included** — 66 IMO editions (1959–2025), 145 countries, 15,000+ participants
- **Fast** — static site served from CDN, sub-second page loads
- **All pages supported:**
  - Timeline, country list, country info, year info
  - Individual & team results, statistics
  - Hall of fame (global and per-country)
  - Participant profiles with full competition history
  - Search by participant name
  - Problems archive
  - Results matrix
  - Static content (about, links, advisory board, ethics, documents)
- **Full query parameter support** — `year`, `code`, `id`, `column`, `order`, `view`, `name`
- **Sortable tables** — click any column header to sort ascending/descending
- **Responsive design** — works on desktop and mobile

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** React Router (client-side `.aspx` URL handling)
- **Styling:** Custom CSS with CSS variables
- **Data:** Static JSON files (pre-scraped from the original site)
- **Scraper:** Python + BeautifulSoup (via Wayback Machine)
- **Hosting:** Cloudflare Pages compatible (SPA with `_redirects`)

## Project Structure

```
imo-mirror/
├── frontend/           # React application
│   ├── public/data/    # Static JSON data files
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components (one per .aspx URL)
│   │   ├── utils/      # Data loading and sorting utilities
│   │   └── styles.css  # Global styles
│   └── ...
├── scripts/            # Python data scraper
├── data/               # Raw scraped data
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Development

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Build

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`, ready to deploy to any static hosting.

### Scraping Data (optional)

To re-scrape data from the original site or Wayback Machine:

```bash
pip install requests beautifulsoup4
python scripts/scrape.py
```

## URL Compatibility

Every URL from the original site works with a simple domain swap:

| Original | Mirror |
|---|---|
| `imo-official.org/year_info.aspx?year=2024` | `mirror-domain/year_info.aspx?year=2024` |
| `imo-official.org/participant_r.aspx?id=1234` | `mirror-domain/participant_r.aspx?id=1234` |
| `imo-official.org/country_info.aspx?code=USA` | `mirror-domain/country_info.aspx?code=USA` |
| `imo-official.org/hall.aspx` | `mirror-domain/hall.aspx` |

**Excluded:** `forum_login.aspx` (authentication) and `download_file.aspx` (file downloads).

## Deployment

### Cloudflare Pages

1. Connect the repository to Cloudflare Pages
2. Set build command: `cd frontend && npm install && npm run build`
3. Set output directory: `frontend/dist`

The included `_redirects` file handles SPA routing automatically.

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with [Devin](https://devin.ai) — the AI software engineer.*
