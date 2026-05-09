#!/usr/bin/env node
/**
 * Generates static/sitemap.xml from route dirs + data JSON.
 *
 * Runs automatically before every build via the "prebuild"
 * npm script, or manually via: pnpm sitemap
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "src", "lib", "data");
const MASSIVE_DIR = join(DATA_DIR, "massive");
const ROUTES_DIR = join(ROOT, "src", "routes");
const OUT = join(ROOT, "static", "sitemap.xml");
const BASE = "https://imo-mirror.org";
const TODAY = new Date().toISOString().slice(0, 10);

// --- Helpers ---

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

/** True when the route folder only contains a redirect server file. */
function isRedirectOnly(routeDir) {
  const serverFile = join(
    ROUTES_DIR, routeDir, "+page.server.ts"
  );
  if (!existsSync(serverFile)) return false;
  const src = readFileSync(serverFile, "utf-8");
  // Redirect-only routes have no +page.svelte
  const hasSvelte = existsSync(
    join(ROUTES_DIR, routeDir, "+page.svelte")
  );
  return /redirect\(/.test(src) && !hasSvelte;
}

// Pages that require query params to render.
// Bare URLs redirect, so exclude them from statics;
// they get entries via dynamicRoutes() instead.
const DYNAMIC_PAGES = new Set([
  "country_info.aspx",
  "country_hall.aspx",
  "country_individual_r.aspx",
  "country_team_r.aspx",
  "team_r.aspx",
  "year_info.aspx",
  "year_country_r.aspx",
  "year_individual_r.aspx",
  "year_statistics.aspx",
  "participant_r.aspx",
]);

// --- Static page routes ---

function staticRoutes() {
  const dirs = readdirSync(ROUTES_DIR, {
    withFileTypes: true,
  })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const routes = [];

  if (existsSync(join(ROUTES_DIR, "+page.svelte"))) {
    routes.push({
      loc: "/",
      priority: "1.0",
      changefreq: "monthly",
    });
  }

  for (const dir of dirs) {
    if (isRedirectOnly(dir)) continue;
    if (DYNAMIC_PAGES.has(dir)) continue;
    routes.push({
      loc: "/" + dir,
      priority: "0.8",
      changefreq: "monthly",
    });
  }

  return routes;
}

// --- Dynamic routes from data ---

function dynamicRoutes() {
  const routes = [];

  // -- Country pages (keyed by ?code=) --
  const countries = loadJson(
    join(DATA_DIR, "countries.json")
  );
  const codes = countries.map((c) => c.code);
  const countryPages = [
    "country_info.aspx",
    "country_hall.aspx",
    "country_individual_r.aspx",
    "country_team_r.aspx",
  ];
  for (const page of countryPages) {
    if (!existsSync(join(ROUTES_DIR, page))) continue;
    for (const code of codes) {
      routes.push({
        loc: `/${page}?code=${code}`,
        priority: "0.6",
        changefreq: "yearly",
      });
    }
  }

  // -- Year pages (keyed by ?year=) --
  const yearInfo = loadJson(
    join(DATA_DIR, "year_info.json")
  );
  const years = Object.keys(yearInfo).sort(
    (a, b) => Number(b) - Number(a)
  );
  const yearPages = [
    "year_info.aspx",
    "year_country_r.aspx",
    "year_individual_r.aspx",
    "year_statistics.aspx",
  ];
  for (const page of yearPages) {
    if (!existsSync(join(ROUTES_DIR, page))) continue;
    for (const year of years) {
      routes.push({
        loc: `/${page}?year=${year}`,
        priority: "0.6",
        changefreq: "yearly",
      });
    }
  }

  // -- Team result pages (?code= & ?year=) --
  // Only emit combos that actually exist in data
  if (existsSync(join(ROUTES_DIR, "team_r.aspx"))) {
    const countryResults = loadJson(
      join(MASSIVE_DIR, "country_results_by_year.json")
    );
    for (const [year, rows] of Object.entries(
      countryResults
    )) {
      for (const r of rows) {
        routes.push({
          loc: `/team_r.aspx?code=${r.code}&year=${year}`,
          priority: "0.4",
          changefreq: "yearly",
        });
      }
    }
  }

  // -- Participant pages (?id=) --
  // Extract unique participant IDs from the
  // individual results (no participants.json).
  if (existsSync(join(ROUTES_DIR, "participant_r.aspx"))) {
    const individual = loadJson(
      join(MASSIVE_DIR, "individual_results_by_year.json")
    );
    const ids = new Set();
    for (const rows of Object.values(individual)) {
      for (const r of rows) {
        if (r.participant_id != null) {
          ids.add(r.participant_id);
        }
      }
    }
    const sorted = [...ids].sort((a, b) => a - b);
    for (const id of sorted) {
      routes.push({
        loc: `/participant_r.aspx?id=${id}`,
        priority: "0.4",
        changefreq: "yearly",
      });
    }
  }

  return routes;
}

// --- Build XML ---

function buildXml(routes) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const r of routes) {
    const escapedLoc = `${BASE}${r.loc}`
      .replace(/&/g, "&amp;");
    lines.push(
      "  <url>",
      `    <loc>${escapedLoc}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      "  </url>"
    );
  }
  lines.push("</urlset>", "");
  return lines.join("\n");
}

// --- Main ---

const routes = [...staticRoutes(), ...dynamicRoutes()];
const xml = buildXml(routes);
writeFileSync(OUT, xml);
console.log(
  `sitemap.xml: ${routes.length} URLs → ${OUT}`
);
