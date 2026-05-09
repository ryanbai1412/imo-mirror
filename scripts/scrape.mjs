#!/usr/bin/env node
/**
 * IMO Data Scraper — Node.js rewrite
 *
 * Fetches all data from imo-official.org via the Wayback Machine,
 * parses HTML tables with cheerio, applies early-year fixes inline,
 * and writes structured JSON to src/lib/data-new/.
 *
 * Usage:
 *   node scripts/scrape.mjs            # full scrape
 *   node scripts/scrape.mjs --year 2024  # single year only
 *   node scripts/scrape.mjs --skip-per-year  # index pages only
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import * as cheerio from "cheerio";

// ── paths ────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "src", "lib", "data");
const MASSIVE_DIR = join(DATA_DIR, "massive");
const CACHE_DIR = join(ROOT, ".cache");
for (const d of [DATA_DIR, MASSIVE_DIR, CACHE_DIR]) {
  mkdirSync(d, { recursive: true });
}

// ── constants ────────────────────────────────────
const BASE_URL = "https://www.imo-official.org";
const WB_BASE = "https://web.archive.org/web";
const WB_SNAPSHOTS = ["2026", "2025", "2024", "2023"];
const ALL_YEARS = [];
for (let y = 1959; y <= 2029; y++) {
  if (y !== 1980) ALL_YEARS.push(y);
}

// Years that had 7 problems (max 44 or 46 pts)
const SEVEN_PROBLEM_YEARS = new Set([1960, 1962]);

// Parse CLI args
const args = process.argv.slice(2);
const singleYear = args.includes("--year")
  ? Number(args[args.indexOf("--year") + 1])
  : null;
const skipPerYear = args.includes("--skip-per-year");

// ── fetch with cache ─────────────────────────────
function cachePath(url) {
  const h = createHash("md5").update(url).digest("hex");
  return join(CACHE_DIR, `${h}.html`);
}

async function fetchPage(path, { retries = 1 } = {}) {
  const url = `${BASE_URL}/${path}`;
  const cp = cachePath(url);
  if (existsSync(cp)) {
    return readFileSync(cp, "utf-8");
  }

  // Try each Wayback snapshot year
  for (const snap of WB_SNAPSHOTS) {
    const wbUrl = `${WB_BASE}/${snap}/${url}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await sleep(1000 * attempt);
        const resp = await fetch(wbUrl, {
          headers: {
            "User-Agent":
              "IMO-Mirror-Bot/2.0 (static mirror)",
          },
          signal: AbortSignal.timeout(30_000),
        });
        if (resp.ok) {
          const text = await resp.text();
          if (
            text.toLowerCase().includes("imo-official")
          ) {
            writeFileSync(cp, text, "utf-8");
            await sleep(350);
            return text;
          }
        } else {
          await resp.text();
        }
      } catch {
        // retry or try next snapshot
      }
    }
  }

  // Fallback to live site
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await sleep(1000 * attempt);
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "IMO-Mirror-Bot/2.0 (static mirror)",
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (resp.ok) {
        const text = await resp.text();
        writeFileSync(cp, text, "utf-8");
        await sleep(1000);
        return text;
      }
    } catch {
      // retry
    }
  }

  console.warn(`  ⚠ All sources failed for ${path}`);
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── HTML helpers ─────────────────────────────────
function cleanText(s) {
  if (!s) return "";
  return s.replace(/\s+/g, " ").trim();
}

function parseInt2(s) {
  if (s == null) return null;
  const c = s
    .toString()
    .trim()
    .replace(/\u00a0/g, "")
    .replace(/,/g, "");
  if (!c) return null;
  const n = Number.parseInt(c, 10);
  return Number.isNaN(n) ? null : n;
}

function parseFloat2(s) {
  if (s == null) return null;
  const c = s
    .toString()
    .trim()
    .replace(/\u00a0/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "");
  if (!c) return null;
  const n = Number.parseFloat(c);
  return Number.isNaN(n) ? null : n;
}

function stripWayback(href) {
  if (!href) return href;
  const m = href.match(
    /https?:\/\/web\.archive\.org\/web\/\d+\/(https?:\/\/.+)/
  );
  return m ? m[1] : href;
}

function parseAward(raw) {
  if (!raw) return [];
  const classify = (s) => {
    const a = s.toLowerCase();
    if (a.includes("gold")) return "gold";
    if (a.includes("silver")) return "silver";
    if (a.includes("bronze")) return "bronze";
    if (a.includes("honourable") || a === "hm")
      return "hm";
    if (a.includes("special")) return "special";
    return "none";
  };
  const parts = raw
    .split(/,\s*/)
    .map(classify)
    .filter((t) => t !== "none");
  return parts;
}

function cleanHref(href) {
  if (!href) return href;
  const m = href.match(
    /https?:\/\/www\.imo-official\.org\/(.+)/
  );
  if (m) return m[1];
  return stripWayback(href);
}

/**
 * Find the "main" data table — the one with the
 * most data rows (td-bearing rows ≥ minRows).
 */
function findDataTable($, minRows = 3) {
  let table = $("table.sortable").first();
  if (table.length) return table;

  let best = null;
  let bestCount = 0;
  $("table").each((_, t) => {
    const rows = $(t).find("tr");
    let tdRows = 0;
    rows.each((_, r) => {
      if ($(r).find("td").length) tdRows++;
    });
    if (tdRows > bestCount && tdRows >= minRows) {
      bestCount = tdRows;
      best = $(t);
    }
  });
  return best;
}

// ── JSON I/O ─────────────────────────────────────
function saveJson(name, data) {
  const p = join(DATA_DIR, name);
  writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✓ ${name}`);
}

function saveMassive(name, data) {
  const p = join(MASSIVE_DIR, name);
  writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✓ massive/${name}`);
}

// ══════════════════════════════════════════════════
//  SCRAPERS
// ══════════════════════════════════════════════════

// ── timeline (organizers.aspx) ───────────────────
async function scrapeTimeline() {
  console.log("Scraping timeline...");
  const html = await fetchPage("organizers.aspx");
  if (!html) return [];

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) {
    console.warn("  Could not find timeline table");
    return [];
  }

  const rows = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 3) return;
    const year = parseInt2($(cells[1]).text());
    if (!year) return;

    const countryCell = $(cells[2]);
    const linkEl = countryCell.find("a").first();
    let homepage = null;
    if (linkEl.length) {
      homepage = stripWayback(linkEl.attr("href") || "");
    }

    rows.push({
      edition: parseInt2($(cells[0]).text()),
      year,
      country: cleanText($(cells[2]).text()),
      city: cells.length > 3
        ? cleanText($(cells[3]).text())
        : "",
      date: cells.length > 4
        ? cleanText($(cells[4]).text())
        : "",
      num_countries: cells.length > 5
        ? parseInt2($(cells[5]).text())
        : null,
      contestants_all: cells.length > 6
        ? parseInt2($(cells[6]).text())
        : null,
      contestants_male: cells.length > 7
        ? parseInt2($(cells[7]).text())
        : null,
      contestants_female: cells.length > 8
        ? parseInt2($(cells[8]).text())
        : null,
      homepage,
    });
  });

  console.log(`  Found ${rows.length} editions`);
  return rows;
}

// ── countries (countries.aspx) ───────────────────
async function scrapeCountries() {
  console.log("Scraping countries...");
  const html = await fetchPage("countries.aspx");
  if (!html) return [];

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) return [];

  const rows = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 2) return;

    const code = cleanText($(cells[0]).text());
    if (!code || code.length !== 3) return;

    const website =
      cells.length > 3
        ? stripWayback(
            $(cells[3]).find("a").attr("href") || ""
          )
        : "";
    const hostText =
      cells.length > 4
        ? cleanText($(cells[4]).text())
        : "";
    const hostYears = hostText
      ? hostText
          .split(",")
          .map((s) => s.trim())
          .filter((s) => /^\d{4}$/.test(s))
          .map(Number)
          .sort((a, b) => a - b)
      : [];

    const flagImg = $(tr).find("img").first();
    const flagUrl = flagImg.length
      ? flagImg.attr("src") || ""
      : "";

    rows.push({
      code,
      name: cleanText($(cells[1]).text()),
      contact:
        cells.length > 2
          ? cleanText($(cells[2]).text())
          : "",
      website: website || "",
      host_years: hostYears,
      flag_url: flagUrl,
    });
  });

  console.log(`  Found ${rows.length} countries`);
  return rows;
}

// ── country results per year ─────────────────────
async function scrapeYearCountryResults(year) {
  const html = await fetchPage(
    `year_country_r.aspx?year=${year}`
  );
  if (!html) return [];

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) return [];

  // Detect column layout from header rows
  let hasP7 = false;
  let hasHM = false;
  table.find("tr").each((_, tr) => {
    $(tr)
      .find("th")
      .each((_, th) => {
        const t = cleanText($(th).text());
        if (t === "P7") hasP7 = true;
        if (t === "HM") hasHM = true;
      });
  });

  const results = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 5) return;

    const countryLink = $(cells[0]).find("a").first();
    if (!countryLink.length) return;
    const countryName = cleanText(countryLink.text());
    if (!countryName || countryName === "Country") return;

    const href = countryLink.attr("href") || "";
    const codeMatch = href.match(/code=([A-Z]+)/);
    const countryCode = codeMatch ? codeMatch[1] : "";

    // Column layout (from header):
    //   Country | All | M | F | P1..P6 [P7] | Total
    //   | Rank | G | S | B [| HM] | Leader | Deputy
    let idx = 1;
    const teamAll = parseInt2($(cells[idx]).text());
    idx++;
    const teamMale = parseInt2($(cells[idx]).text());
    idx++;
    const teamFemale = parseInt2($(cells[idx]).text());
    idx++;

    const scores = [];
    for (let p = 0; p < 6; p++) {
      scores.push(
        idx < cells.length
          ? parseInt2($(cells[idx]).text())
          : null
      );
      idx++;
    }

    let p7 = null;
    if (hasP7) {
      p7 = parseInt2(
        idx < cells.length
          ? $(cells[idx]).text()
          : ""
      );
      idx++;
    }

    const total = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    const rank = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    const gold = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    const silver = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    const bronze = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    let hm = null;
    if (hasHM) {
      hm = parseInt2(
        idx < cells.length ? $(cells[idx]).text() : ""
      );
      idx++;
    }
    const leader = cleanText(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    const deputy = cleanText(
      idx < cells.length ? $(cells[idx]).text() : ""
    );

    results.push({
      country: countryName,
      code: countryCode,
      team_size_all: teamAll,
      team_size_male: teamMale,
      team_size_female: teamFemale,
      p1: scores[0] ?? null,
      p2: scores[1] ?? null,
      p3: scores[2] ?? null,
      p4: scores[3] ?? null,
      p5: scores[4] ?? null,
      p6: scores[5] ?? null,
      p7,
      total,
      rank: rank === 0 ? null : rank,
      awards_gold: gold,
      awards_silver: silver,
      awards_bronze: bronze,
      awards_hm: hm,
      leader,
      deputy_leader: deputy,
    });
  });

  return results;
}

// ── individual results per year ──────────────────
async function scrapeYearIndividualResults(year) {
  const html = await fetchPage(
    `year_individual_r.aspx?year=${year}`
  );
  if (!html) return [];

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) return [];

  // Detect P7 column from header
  let hasP7 = false;
  table.find("tr").each((_, tr) => {
    $(tr)
      .find("th")
      .each((_, th) => {
        if (cleanText($(th).text()) === "P7")
          hasP7 = true;
      });
  });

  const results = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 5) return;

    const link = $(cells[0]).find("a").first();
    let name, participantId;
    if (link.length) {
      name = cleanText(link.text());
      const href = link.attr("href") || "";
      const idMatch = href.match(/id=(\d+)/);
      participantId = idMatch
        ? Number(idMatch[1])
        : null;
    } else {
      // Rows without links: ?/*/anonymous
      name = cleanText($(cells[0]).text());
      participantId = null;
    }
    if (!name || name === "Contestant") return;

    let idx = 1;
    const countryCell = $(cells[idx]);
    const countryName = cleanText(countryCell.text());
    const countryLink = countryCell.find("a").first();
    let countryCode = "";
    if (countryLink.length) {
      const m = (countryLink.attr("href") || "").match(
        /code=([A-Z0-9]+)/
      );
      countryCode = m ? m[1] : "";
    }
    idx++;

    // Problem scores: always read P1-P6
    const scores = [];
    for (let p = 0; p < 6; p++) {
      scores.push(
        idx < cells.length
          ? parseInt2($(cells[idx]).text())
          : null
      );
      idx++;
    }

    // P7: read from header detection
    let p7 = null;
    if (hasP7) {
      p7 = parseInt2(
        idx < cells.length
          ? $(cells[idx]).text()
          : ""
      );
      idx++;
    }

    const total = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    const rank = parseInt2(
      idx < cells.length ? $(cells[idx]).text() : ""
    );
    idx++;
    let award = cleanText(
      idx < cells.length ? $(cells[idx]).text() : ""
    );

    // Strip § footnote markers
    award = award.replace(/§/g, "").trim();

    results.push({
      name,
      participant_id: participantId,
      country: countryName,
      country_code: countryCode,
      p1: scores[0] ?? null,
      p2: scores[1] ?? null,
      p3: scores[2] ?? null,
      p4: scores[3] ?? null,
      p5: scores[4] ?? null,
      p6: scores[5] ?? null,
      p7,
      total,
      rank,
      award: parseAward(award),
    });
  });

  return results;
}

// ── year info (year_info.aspx) ───────────────────
async function scrapeYearInfo(year) {
  const html = await fetchPage(
    `year_info.aspx?year=${year}`
  );
  if (!html) return null;

  const $ = cheerio.load(html);
  const content =
    $("#content").text() ||
    $(".content").text() ||
    $.root().text();

  const info = { year };

  let m;
  m = content.match(
    /Number of participating countries:\s*(\d+)/
  );
  if (m) info.num_countries = Number(m[1]);

  m = content.match(
    /Number of contestants:\s*(\d+)/
  );
  if (m) info.num_contestants = Number(m[1]);

  m = content.match(
    /Gold medals?:\s*(\d+)\s*\(score\s*[≥>=]+\s*(\d+)/
  );
  if (m) {
    info.gold_count = Number(m[1]);
    info.gold_cutoff = Number(m[2]);
  }

  m = content.match(
    /Silver medals?:\s*(\d+)\s*\(score\s*[≥>=]+\s*(\d+)/
  );
  if (m) {
    info.silver_count = Number(m[1]);
    info.silver_cutoff = Number(m[2]);
  }

  m = content.match(
    /Bronze medals?:\s*(\d+)\s*\(score\s*[≥>=]+\s*(\d+)/
  );
  if (m) {
    info.bronze_count = Number(m[1]);
    info.bronze_cutoff = Number(m[2]);
  }

  m = content.match(/Honou?rable mentions?:\s*(\d+)/);
  if (m) info.hm_count = Number(m[1]);

  const hpLink = $("a")
    .filter((_, el) =>
      /Home\s*Page/i.test($(el).text())
    )
    .first();
  if (hpLink.length) {
    info.homepage = stripWayback(
      hpLink.attr("href") || ""
    );
  }

  const languages = [];
  $("select option").each((_, el) => {
    const lang = $(el).text().trim();
    if (lang) languages.push(lang);
  });
  info.problem_languages = languages;

  return info;
}

// ── year statistics ──────────────────────────────
async function scrapeYearStatistics(year) {
  const html = await fetchPage(
    `year_statistics.aspx?year=${year}`
  );
  if (!html) return null;

  const $ = cheerio.load(html);
  const table = findDataTable($, 2);
  if (!table) return null;

  const stats = { year, problems: {} };

  table.find("tr").each((_, tr) => {
    let cells = $(tr).find("td");
    if (!cells.length) cells = $(tr).find("th");
    if (cells.length < 2) return;

    const label = cleanText($(cells[0]).text());
    if (!label) return;

    const values = {};
    cells.each((i, cell) => {
      if (i === 0) return;
      values[`p${i}`] = cleanText($(cell).text());
    });
    stats.problems[label] = values;
  });

  return stats;
}

// ── hall of fame ─────────────────────────────────
async function scrapeHallOfFame() {
  console.log("Scraping hall of fame...");
  const allEntries = [];
  const html = await fetchPage("hall.aspx");
  if (!html) return allEntries;

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (table) {
    table.find("tr").each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 3) return;

      const link = $(cells[0]).find("a").first();
      if (!link.length) return;
      const name = cleanText(link.text());
      if (!name || name === "Contestant") return;

      const href = link.attr("href") || "";
      const idMatch = href.match(/id=(\d+)/);
      const participantId = idMatch
        ? Number(idMatch[1])
        : null;

      const code = cleanText($(cells[1]).text());

      let idx = 2;
      const g = parseInt2($(cells[idx]).text()) || 0;
      idx++;
      const s = parseInt2($(cells[idx]).text()) || 0;
      idx++;
      const b = parseInt2($(cells[idx]).text()) || 0;
      idx++;
      const hm = parseInt2($(cells[idx]).text()) || 0;
      idx++;
      const sp = parseInt2($(cells[idx]).text()) || 0;
      idx++;
      const pf = parseInt2($(cells[idx]).text()) || 0;
      idx++;
      const parts =
        parseInt2($(cells[idx]).text()) || 0;

      allEntries.push({
        name,
        participant_id: participantId,
        country_code: code,
        gold: g,
        silver: s,
        bronze: b,
        hm,
        special_prizes: sp,
        perfect_scores: pf,
        participations: parts,
      });
    });
  }

  console.log(`  Found ${allEntries.length} entries`);
  return allEntries;
}

// ── results matrix ───────────────────────────────
async function scrapeResultsMatrix() {
  console.log("Scraping results matrix...");
  const html = await fetchPage("results.aspx");
  if (!html) return {};

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) return {};

  const rows = table.find("tr");
  const headerRow = rows.first();
  const years = [];
  headerRow.find("th, td").each((_, cell) => {
    const text = $(cell).text().trim();
    const yr = parseInt2(text);
    if (yr != null) {
      if (yr >= 59 && yr <= 99) years.push(1900 + yr);
      else if (yr >= 0 && yr <= 30) years.push(2000 + yr);
    }
  });

  const matrix = {};
  rows.each((i, tr) => {
    if (i === 0) return;
    const cells = $(tr).find("td");
    if (cells.length < 3) return;
    const code = cleanText($(cells[0]).text());
    if (!code || code === "Year") return;

    const rankings = {};
    cells.each((j, cell) => {
      if (j === 0 || j === cells.length - 1) return;
      const yi = j - 1;
      if (yi < years.length) {
        const rank = parseInt2($(cell).text());
        if (rank != null) {
          rankings[String(years[yi])] = rank;
        }
      }
    });

    if (Object.keys(rankings).length > 0) {
      matrix[code] = rankings;
    }
  });

  console.log(
    `  Found rankings for ${Object.keys(matrix).length} countries`
  );
  return matrix;
}

// ── results by country ───────────────────────────
async function scrapeResultsCountry() {
  console.log("Scraping results by country...");
  const html = await fetchPage("results_country.aspx");
  if (!html) return [];

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) return [];

  const results = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 5) return;

    const codeLink = $(cells[0]).find("a").first();
    if (!codeLink.length) return;
    const code = cleanText(codeLink.text());
    if (!code || code.length > 4) return;

    let idx = 1;
    const country = cleanText($(cells[idx]).text());
    idx++;
    const firstPart = parseInt2($(cells[idx]).text());
    idx++;
    const parts = parseInt2($(cells[idx]).text());
    idx++;
    const cAll = parseInt2($(cells[idx]).text());
    idx++;
    const cMale = parseInt2($(cells[idx]).text());
    idx++;
    const cFemale = parseInt2($(cells[idx]).text());
    idx++;
    const distinct = parseInt2($(cells[idx]).text());
    idx++;
    const avgPersist = parseFloat2($(cells[idx]).text());
    idx++;
    const g = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const s = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const b = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const hm = parseInt2($(cells[idx]).text()) || 0;

    results.push({
      code,
      country,
      first_participation: firstPart,
      participations: parts,
      contestants_all: cAll,
      contestants_male: cMale,
      contestants_female: cFemale,
      distinct_contestants: distinct,
      avg_persistence: avgPersist,
      gold: g,
      silver: s,
      bronze: b,
      hm,
    });
  });

  console.log(`  Found ${results.length} countries`);
  return results;
}

// ── results by year ──────────────────────────────
async function scrapeResultsYear() {
  console.log("Scraping results by year...");
  const html = await fetchPage("results_year.aspx");
  if (!html) return [];

  const $ = cheerio.load(html);
  const table = findDataTable($);
  if (!table) return [];

  const results = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 5) return;

    const year = parseInt2($(cells[0]).text());
    if (!year) return;

    let idx = 1;
    const hostCountry = cleanText($(cells[idx]).text());
    idx++;
    const numCountries = parseInt2($(cells[idx]).text());
    idx++;
    const cAll = parseInt2($(cells[idx]).text());
    idx++;
    const cMale = parseInt2($(cells[idx]).text());
    idx++;
    const cFemale = parseInt2($(cells[idx]).text());
    idx++;
    const g = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const s = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const b = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const hm = parseInt2($(cells[idx]).text()) || 0;
    idx++;
    const maxPts = parseInt2($(cells[idx]).text());
    idx++;
    const eff = parseFloat2($(cells[idx]).text());
    idx++;
    const gcOff = parseInt2($(cells[idx]).text());
    idx++;
    const scOff = parseInt2($(cells[idx]).text());
    idx++;
    const bcOff = parseInt2($(cells[idx]).text());

    results.push({
      year,
      host_country: hostCountry,
      num_countries: numCountries,
      contestants_all: cAll,
      contestants_male: cMale,
      contestants_female: cFemale,
      gold: g,
      silver: s,
      bronze: b,
      hm,
      max_points: maxPts,
      efficiency: eff,
      gold_cutoff: gcOff,
      silver_cutoff: scOff,
      bronze_cutoff: bcOff,
    });
  });

  console.log(`  Found ${results.length} years`);
  return results;
}

// ══════════════════════════════════════════════════
//  POST-SCRAPE FIXES (replaces fix_early_years.py)
// ══════════════════════════════════════════════════

function assignRanks(entries, key = "total") {
  const sorted = [...entries].sort(
    (a, b) => (b[key] ?? -1) - (a[key] ?? -1)
  );
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i][key] == null) {
      sorted[i].rank = null;
      continue;
    }
    if (i > 0 && sorted[i][key] < sorted[i - 1][key]) {
      rank = i + 1;
    }
    sorted[i].rank = rank;
  }
}

function fixIndividualResults(iby) {
  let changes = 0;

  for (const yrStr of Object.keys(iby).sort(
    (a, b) => Number(a) - Number(b)
  )) {
    const yr = Number(yrStr);
    const entries = iby[yrStr];

    // Fix swapped years: rank=score, award=ordinal
    const numericAwards = entries.filter((e) => {
      const a = String(e.award ?? "").trim();
      return /^\d+$/.test(a);
    }).length;

    if (numericAwards > entries.length * 0.8) {
      console.log(
        `  ${yr}: SWAPPED — rank→total, award→null`
      );
      for (const e of entries) {
        e.total = e.rank;
        e.award = null;
        e.rank = null;
        changes++;
      }
      assignRanks(entries);
      changes += entries.length;
    }

    // Fix rank=0 → null
    for (const e of entries) {
      if (e.rank === 0) {
        e.rank = null;
        changes++;
      }
    }

    // Fix placeholder country codes (C01, C02, ...)
    for (const e of entries) {
      const cc = e.country_code || "";
      if (
        cc &&
        cc.startsWith("C") &&
        cc.length <= 3 &&
        /^\d+$/.test(cc.slice(1))
      ) {
        e.country = "Individual Participant";
        changes++;
      }
    }
  }

  // Recover P7 for 7-problem years
  for (const yrStr of ["1960", "1962"]) {
    const entries = iby[yrStr] || [];
    for (const e of entries) {
      if (e.p7 != null) continue;
      const scores = [e.p1, e.p2, e.p3, e.p4, e.p5, e.p6];
      if (e.total == null || scores.some((s) => s == null))
        continue;
      const implied = e.total - scores.reduce((a, b) => a + b, 0);
      if (implied >= 0) {
        e.p7 = implied;
        changes++;
      }
    }
  }

  console.log(`  Individual fixes: ${changes}`);
  return iby;
}

function fixCountryResults(cby, iby) {
  let changes = 0;

  for (const yrStr of Object.keys(cby).sort(
    (a, b) => Number(a) - Number(b)
  )) {
    const yr = Number(yrStr);
    const entries = cby[yrStr];
    const indivs = iby[yrStr] || [];
    const n = entries.length;

    // Detect ordinal years (total is small ordinal
    // placement, not actual team score)
    const nonNullTotals = entries
      .map((e) => e.total)
      .filter((t) => t != null);
    const maxT =
      nonNullTotals.length > 0
        ? Math.max(...nonNullTotals)
        : null;
    const isOrdinal =
      nonNullTotals.length > 0 &&
      maxT != null &&
      maxT <= n + 2 &&
      n >= 3;

    // Detect swapped years
    const nullTotalCount = entries.filter(
      (e) => e.total == null
    ).length;
    const hasLargeRanks = entries.some(
      (e) => (e.rank ?? 0) > n + 5
    );
    const isSwapped =
      nullTotalCount >= n - 1 &&
      hasLargeRanks &&
      !isOrdinal;

    if (isSwapped) {
      console.log(
        `  ${yr}: SWAPPED — unshifting columns`
      );
      for (const e of entries) {
        const hasP7 = e.p7 != null;
        if (hasP7) {
          // 1962 CZS: real p7, columns are aligned
          changes++;
        } else {
          const realGold = e.awards_silver;
          const realSilver = e.awards_bronze;
          const realBronze = e.awards_hm;
          e.total =
            (e.rank ?? 0) > n + 5 ? e.rank : null;
          e.rank = null;
          e.awards_gold = realGold;
          e.awards_silver = realSilver;
          e.awards_bronze = realBronze;
          e.awards_hm = null;
          changes++;
        }
      }

      // Fill missing totals from individuals
      for (const e of entries) {
        if (e.total == null) {
          const team = indivs.filter(
            (i) => i.country_code === e.code
          );
          if (team.length > 0) {
            const computed = team.reduce(
              (a, i) => a + (i.total ?? 0),
              0
            );
            if (computed > 0) {
              e.total = computed;
              changes++;
            }
          }
        }
      }
      assignRanks(entries);
      changes += entries.length;
    } else if (isOrdinal) {
      console.log(
        `  ${yr}: ORDINAL — unshifting columns`
      );
      for (const e of entries) {
        const savedP7 = e.p7; // was team total
        const realGold = e.rank;
        const realSilver = e.awards_gold;
        const realBronze = e.awards_silver;
        const realHM = e.awards_bronze;

        e.awards_gold = realGold;
        e.awards_silver = realSilver;
        e.awards_bronze = realBronze;
        e.awards_hm = realHM;
        e.p7 = null;
        e.rank = null;
        changes++;

        // Compute real total: use p-sum if we have
        // all problem scores, else use savedP7
        const pScores = [e.p1, e.p2, e.p3, e.p4, e.p5, e.p6];
        if (pScores.every((s) => s != null)) {
          e.total = pScores.reduce((a, b) => a + b, 0);
        } else {
          // Try individual sum
          const team = indivs.filter(
            (i) => i.country_code === e.code
          );
          const computed = team.reduce(
            (a, i) => a + (i.total ?? 0),
            0
          );
          if (computed > 0) {
            e.total = computed;
          } else {
            e.total = savedP7;
          }
        }
        changes++;
      }
      assignRanks(entries);
      changes += entries.length;
    }

    // Fix rank=0 → null for all years
    for (const e of entries) {
      if (e.rank === 0) {
        e.rank = null;
        changes++;
      }
    }
  }

  console.log(`  Country fixes: ${changes}`);
  return cby;
}

// ══════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════
async function main() {
  console.log("═".repeat(55));
  console.log("  IMO Data Scraper (Node.js)");
  console.log("═".repeat(55));

  // Stage 1: Index pages
  const timeline = await scrapeTimeline();
  saveJson("timeline.json", timeline);

  const countries = await scrapeCountries();
  saveJson("countries.json", countries);

  const resultsMatrix = await scrapeResultsMatrix();
  saveJson("results_matrix.json", resultsMatrix);

  const resultsCountry = await scrapeResultsCountry();
  saveJson("results_country.json", resultsCountry);

  const resultsYear = await scrapeResultsYear();
  saveJson("results_year.json", resultsYear);

  const hall = await scrapeHallOfFame();
  saveJson("hall_of_fame.json", hall);

  if (skipPerYear) {
    console.log("\nSkipping per-year scraping.");
    return;
  }

  // Stage 2: Per-year data
  let yearsToScrape;
  if (singleYear) {
    yearsToScrape = [singleYear];
  } else {
    yearsToScrape = timeline
      .filter(
        (t) => t.contestants_all && t.year <= 2025
      )
      .map((t) => t.year);
    if (yearsToScrape.length === 0) {
      yearsToScrape = ALL_YEARS.filter(
        (y) => y <= 2025
      );
    }
  }

  const allCountryResults = {};
  const allIndividualResults = {};
  const allYearInfo = {};
  const allYearStats = {};

  for (const year of yearsToScrape) {
    console.log(`\nScraping year ${year}...`);

    const cr = await scrapeYearCountryResults(year);
    if (cr.length > 0) {
      allCountryResults[String(year)] = cr;
      console.log(
        `  Country results: ${cr.length} countries`
      );
    }

    const ir =
      await scrapeYearIndividualResults(year);
    if (ir.length > 0) {
      allIndividualResults[String(year)] = ir;
      console.log(
        `  Individual results: ${ir.length} contestants`
      );
    }

    const yi = await scrapeYearInfo(year);
    if (yi) {
      allYearInfo[String(year)] = yi;
    }

    const ys = await scrapeYearStatistics(year);
    if (ys) {
      allYearStats[String(year)] = ys;
    }
  }

  // Stage 3: Apply fixes
  console.log("\n" + "═".repeat(55));
  console.log("  Applying fixes...");
  console.log("═".repeat(55));

  const fixedIndiv = fixIndividualResults(
    allIndividualResults
  );
  const fixedCountry = fixCountryResults(
    allCountryResults,
    fixedIndiv
  );

  // Stage 4: Save
  console.log("\n" + "═".repeat(55));
  console.log("  Saving data...");
  console.log("═".repeat(55));

  saveMassive(
    "individual_results_by_year.json",
    fixedIndiv
  );
  saveMassive(
    "country_results_by_year.json",
    fixedCountry
  );
  saveJson("year_info.json", allYearInfo);
  saveJson("year_statistics.json", allYearStats);

  console.log("\n" + "═".repeat(55));
  console.log("  Scraping complete!");
  console.log(
    `  Data saved to ${DATA_DIR}`
  );
  console.log("═".repeat(55));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
