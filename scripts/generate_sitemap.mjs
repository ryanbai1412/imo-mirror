#!/usr/bin/env node
/**
 * Generates static/sitemap.xml from route dirs + data JSON.
 * Run via: pnpm run sitemap
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "src", "lib", "data");
const ROUTES_DIR = join(ROOT, "src", "routes");
const OUT = join(ROOT, "static", "sitemap.xml");
const BASE = "https://imo-mirror.org";
const TODAY = new Date().toISOString().slice(0, 10);

// --- Detect redirect-only routes (+page.server.ts with redirect) ---
function isRedirectOnly(routeDir) {
  const serverFile = join(ROUTES_DIR, routeDir, "+page.server.ts");
  if (!existsSync(serverFile)) return false;
  const src = readFileSync(serverFile, "utf-8");
  return /redirect\(/.test(src);
}

// Pages that require query params to show content;
// they redirect when accessed without params, so exclude
// the bare URL from the sitemap. They get entries via
// dynamicRoutes() with proper ?code=, ?year=, ?id= params.
const DYNAMIC_PAGES = new Set([
  "country_info.aspx",
  "country_hall.aspx",
  "country_individual_r.aspx",
  "country_team_r.aspx",
  "year_info.aspx",
  "year_country_r.aspx",
  "year_individual_r.aspx",
  "year_statistics.aspx",
  "participant_r.aspx",
]);

// --- Collect static page routes ---
function staticRoutes() {
  const dirs = readdirSync(ROUTES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const routes = [];
  // Root page
  if (existsSync(join(ROUTES_DIR, "+page.svelte"))) {
    routes.push({ loc: "/", priority: "1.0", changefreq: "monthly" });
  }
  for (const dir of dirs) {
    if (isRedirectOnly(dir)) continue;
    const page = dir; // e.g. "countries.aspx"
    if (DYNAMIC_PAGES.has(page)) continue;
    routes.push({ loc: "/" + page, priority: "0.8", changefreq: "monthly" });
  }
  return routes;
}

// --- Load JSON helper ---
function loadJson(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf-8"));
}

// --- Dynamic routes from data ---
function dynamicRoutes() {
  const routes = [];

  // Country pages
  const countries = loadJson("countries.json");
  const codes = countries.map((c) => c.code);
  const countryPages = [
    "country_info.aspx",
    "country_hall.aspx",
    "country_individual_r.aspx",
    "country_team_r.aspx",
  ];
  for (const page of countryPages) {
    // Only include if the route dir exists
    if (!existsSync(join(ROUTES_DIR, page))) continue;
    for (const code of codes) {
      routes.push({
        loc: `/${page}?code=${code}`,
        priority: "0.6",
        changefreq: "yearly",
      });
    }
  }

  // Year pages
  const yearInfo = loadJson("year_info.json");
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

  // Participant pages
  const participants = loadJson("participants.json");
  const ids = Object.keys(participants).sort(
    (a, b) => Number(a) - Number(b)
  );
  for (const id of ids) {
    routes.push({
      loc: `/participant_r.aspx?id=${id}`,
      priority: "0.4",
      changefreq: "yearly",
    });
  }

  return routes;
}

// --- Build XML ---
function buildXml(routes) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const r of routes) {
    xml += "  <url>\n";
    xml += `    <loc>${BASE}${r.loc}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
    xml += `    <priority>${r.priority}</priority>\n`;
    xml += "  </url>\n";
  }
  xml += "</urlset>\n";
  return xml;
}

// --- Main ---
const routes = [...staticRoutes(), ...dynamicRoutes()];
const xml = buildXml(routes);
writeFileSync(OUT, xml);
console.log(
  `sitemap.xml: ${routes.length} URLs written to ${OUT}`
);
