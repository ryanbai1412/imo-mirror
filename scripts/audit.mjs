#!/usr/bin/env node
/**
 * Audit IMO JSON data files for anomalies.
 *
 * Usage:
 *   node scripts/audit.mjs          # audit data-new/
 *   node scripts/audit.mjs --prod   # audit data/ (production)
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const useProd = process.argv.includes("--prod");
const DATA = join(
  ROOT,
  "src",
  "lib",
  useProd ? "data" : "data-new"
);
const MASSIVE = join(DATA, "massive");

function load(name) {
  const dir = [
    "country_results_by_year.json",
    "individual_results_by_year.json",
  ].includes(name)
    ? MASSIVE
    : DATA;
  const p = join(dir, name);
  if (!existsSync(p)) {
    console.warn(`  ⚠ Missing: ${p}`);
    return name.endsWith(".json") && name.includes("by_year")
      ? {}
      : [];
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}

const issues = [];
function warn(cat, msg) {
  issues.push({ cat, msg });
}

// ── Load ─────────────────────────────────────────
const iby = load("individual_results_by_year.json");
const cby = load("country_results_by_year.json");
const ry = load("results_year.json");
const rc = load("results_country.json");
const tl = load("timeline.json");
const yi = load("year_info.json");
const hof = load("hall_of_fame.json");
const ys = load("year_statistics.json");
const rm = load("results_matrix.json");

const NO_IMO = new Set([1980]);
const ALL_YEARS = new Set();
for (let y = 1959; y <= 2025; y++) {
  if (!NO_IMO.has(y)) ALL_YEARS.add(y);
}

// Pre-1979: problems could be scored > 7
// (1978 was the transition year, still had
// some problems scored on non-0..7 scales)
const PRE1979_YEARS = new Set();
for (let y = 1959; y <= 1978; y++) PRE1979_YEARS.add(y);

// ══════════════════════════════════════════════════
//  1. INDIVIDUAL RESULTS
// ══════════════════════════════════════════════════
console.log("=== Individual Results ===");
for (const [yrStr, entries] of Object.entries(iby).sort(
  (a, b) => Number(a[0]) - Number(b[0])
)) {
  const yr = Number(yrStr);
  if (!entries.length) {
    warn("indiv", `${yr}: no entries`);
    continue;
  }

  const maxPerProblem = PRE1979_YEARS.has(yr)
    ? 10
    : 7;

  const seenIds = new Map();
  for (const e of entries) {
    const pid = e.participant_id;
    if (pid) seenIds.set(pid, (seenIds.get(pid) || 0) + 1);

    for (const p of ["p1","p2","p3","p4","p5","p6"]) {
      const v = e[p];
      if (v != null && (v < 0 || v > maxPerProblem)) {
        warn("indiv", `${yr} ${e.name}: ${p}=${v} out of [0,${maxPerProblem}]`);
      }
    }
    if (e.p7 != null && yr >= 1978) {
      warn("indiv", `${yr} ${e.name}: p7 in modern year`);
    }

    // Sum check
    const scores = [e.p1, e.p2, e.p3, e.p4, e.p5, e.p6];
    if (e.p7 != null) scores.push(e.p7);
    if (scores.every((s) => s != null)) {
      const computed = scores.reduce((a, b) => a + b, 0);
      if (e.total != null && computed !== e.total) {
        warn("indiv", `${yr} ${e.name}: sum=${computed} != total=${e.total}`);
      }
    }

    if (e.total == null) {
      warn("indiv", `${yr} ${e.name}: total is null`);
    }

    // Award validation
    const award = (e.award || "").trim();
    const validAwards = new Set([
      "",
      "Gold medal",
      "Silver medal",
      "Bronze medal",
      "Honourable mention",
      "Honourable Mention",
      "Special prize",
      "Gold medal, Special prize",
      "Gold medal, Special prize (2)",
      "Silver medal, Special prize",
      "Silver medal, Special prize (2)",
      "Bronze medal, Special prize",
      "Bronze medal, Special prize (2)",
    ]);
    if (award && !validAwards.has(award)) {
      warn("indiv", `${yr} ${e.name}: weird award '${award}'`);
    }

    if (!e.name) {
      warn("indiv", `${yr} pid=${pid}: missing name`);
    }

    if (e.rank != null && e.rank <= 0) {
      warn("indiv", `${yr} ${e.name}: rank=${e.rank} <= 0`);
    }
  }

  for (const [pid, cnt] of seenIds) {
    if (cnt > 1) {
      warn("indiv", `${yr}: participant_id ${pid} appears ${cnt} times`);
    }
  }
}

// ══════════════════════════════════════════════════
//  2. COUNTRY RESULTS
// ══════════════════════════════════════════════════
console.log("=== Country Results ===");
for (const [yrStr, entries] of Object.entries(cby).sort(
  (a, b) => Number(a[0]) - Number(b[0])
)) {
  const yr = Number(yrStr);
  if (!entries.length) {
    warn("country", `${yr}: no entries`);
    continue;
  }

  const indivs = iby[yrStr] || [];
  const maxPerProblem = PRE1979_YEARS.has(yr) ? 10 : 7;

  for (const e of entries) {
    const code = e.code || "?";
    const ts = e.team_size_all;

    if (ts && ts > 0) {
      for (const p of ["p1","p2","p3","p4","p5","p6"]) {
        const v = e[p];
        if (v != null && v > maxPerProblem * ts) {
          warn("country", `${yr} ${code}: ${p}=${v} > ${maxPerProblem}*${ts}`);
        }
        if (v != null && v < 0) {
          warn("country", `${yr} ${code}: ${p}=${v} < 0`);
        }
      }
    }

    if (e.p7 != null && yr >= 1978) {
      warn("country", `${yr} ${code}: p7 in modern year`);
    }

    // Total vs p-sum
    const pScores = [e.p1, e.p2, e.p3, e.p4, e.p5, e.p6];
    if (e.p7 != null) pScores.push(e.p7);
    if (pScores.every((s) => s != null)) {
      const csum = pScores.reduce((a, b) => a + b, 0);
      if (e.total != null && csum !== e.total) {
        warn("country", `${yr} ${code}: p-sum=${csum} != total=${e.total}`);
      }
    }

    // Cross-check total vs individual sums
    if (indivs.length > 0) {
      const team = indivs.filter(
        (i) => i.country_code === code
      );
      if (team.length > 0) {
        const itotal = team.reduce(
          (a, i) => a + (i.total ?? 0),
          0
        );
        if (
          e.total != null &&
          itotal > 0 &&
          Math.abs(e.total - itotal) > 0
        ) {
          warn(
            "country",
            `${yr} ${code}: total=${e.total} != sum(indiv)=${itotal}`
          );
        }
        if (ts && ts !== team.length) {
          warn(
            "country",
            `${yr} ${code}: team_size=${ts} but ${team.length} individuals`
          );
        }
      }
    }

    // Awards <= team_size
    const aTotal =
      (e.awards_gold || 0) +
      (e.awards_silver || 0) +
      (e.awards_bronze || 0) +
      (e.awards_hm || 0);
    if (ts && aTotal > ts) {
      warn("country", `${yr} ${code}: awards(${aTotal}) > team_size(${ts})`);
    }

    // male+female=all
    if (
      ts != null &&
      e.team_size_male != null &&
      e.team_size_female != null &&
      e.team_size_male + e.team_size_female !== ts
    ) {
      warn(
        "country",
        `${yr} ${code}: male(${e.team_size_male})+female(${e.team_size_female}) != all(${ts})`
      );
    }

    if (e.rank != null && e.rank <= 0) {
      warn("country", `${yr} ${code}: rank=${e.rank} <= 0`);
    }
  }

  // Duplicate codes
  const codes = entries
    .map((e) => e.code)
    .filter(Boolean);
  const codeCounts = {};
  for (const c of codes)
    codeCounts[c] = (codeCounts[c] || 0) + 1;
  const dups = Object.entries(codeCounts)
    .filter(([, n]) => n > 1)
    .map(([c]) => c);
  if (dups.length) {
    warn("country", `${yr}: duplicate codes ${dups}`);
  }
}

// ══════════════════════════════════════════════════
//  3. RESULTS_YEAR
// ══════════════════════════════════════════════════
console.log("=== Results Year ===");
for (const entry of ry) {
  const yr = entry.year;
  if (!yr) {
    warn("ry", "entry with no year");
    continue;
  }

  // male+female=all
  const a = entry.contestants_all;
  const m = entry.contestants_male;
  const f = entry.contestants_female;
  if (a && m != null && f != null && m + f !== a) {
    warn("ry", `${yr}: male(${m})+female(${f}) != all(${a})`);
  }

  // Cutoff ordering
  const gc = entry.gold_cutoff;
  const sc = entry.silver_cutoff;
  const bc = entry.bronze_cutoff;
  if (gc && sc && bc && !(gc >= sc && sc >= bc)) {
    warn("ry", `${yr}: cutoffs not ordered G=${gc} S=${sc} B=${bc}`);
  }

  // Medal counts
  const g = entry.gold || 0;
  const s = entry.silver || 0;
  const b = entry.bronze || 0;
  const h = entry.hm || 0;
  if (a && g + s + b + h > a) {
    warn("ry", `${yr}: medals(${g+s+b+h}) > contestants(${a})`);
  }

  // Cross-check with individual data
  const indivs = iby[String(yr)] || [];
  if (indivs.length > 0 && a) {
    if (indivs.length !== a) {
      warn(
        "ry",
        `${yr}: results_year says ${a} but ${indivs.length} individuals`
      );
    }
  }

  // Medal counts vs individual awards
  if (indivs.length > 0) {
    const ig = indivs.filter((i) =>
      (i.award || "").includes("Gold")
    ).length;
    const is = indivs.filter((i) =>
      (i.award || "").includes("Silver")
    ).length;
    const ib = indivs.filter((i) =>
      (i.award || "").includes("Bronze")
    ).length;
    if (g && ig !== g)
      warn("ry", `${yr}: gold ${g} != indiv golds ${ig}`);
    if (s && is !== s)
      warn("ry", `${yr}: silver ${s} != indiv silvers ${is}`);
    if (b && ib !== b)
      warn("ry", `${yr}: bronze ${b} != indiv bronzes ${ib}`);
  }

  if (entry.efficiency != null && (entry.efficiency < 0 || entry.efficiency > 100)) {
    warn("ry", `${yr}: efficiency=${entry.efficiency} out of [0,100]`);
  }
}

// ══════════════════════════════════════════════════
//  4. TIMELINE
// ══════════════════════════════════════════════════
console.log("=== Timeline ===");
for (const e of tl) {
  const yr = e.year;
  const ed = e.edition;
  if (yr && ed) {
    let expected = yr - 1959 + 1;
    if (yr > 1980) expected -= 1;
    if (ed !== expected) {
      warn("timeline", `${yr}: edition=${ed}, expected=${expected}`);
    }
  }

  const a = e.contestants_all;
  const m = e.contestants_male;
  const f = e.contestants_female;
  if (a != null && m != null && f != null && m + f !== a) {
    warn("timeline", `${yr}: male(${m})+female(${f}) != all(${a})`);
  }
}

// ══════════════════════════════════════════════════
//  5. YEAR STATISTICS
// ══════════════════════════════════════════════════
console.log("=== Year Statistics ===");
for (const [yrStr, stats] of Object.entries(ys).sort(
  (a, b) => Number(a[0]) - Number(b[0])
)) {
  const yr = Number(yrStr);
  const probs = stats.problems || {};
  if (!Object.keys(probs).length) {
    warn("ystats", `${yr}: empty statistics`);
    continue;
  }

  const indivs = iby[yrStr] || [];
  const nScored = indivs.filter((e) => e.p1 != null).length;

  for (let pi = 1; pi <= 6; pi++) {
    const pk = `p${pi}`;
    let totalByScore = 0;
    for (let score = 0; score <= 10; score++) {
      const key = `Num( P# = ${score} )`;
      const row = probs[key] || {};
      const val = row[pk];
      if (val) {
        const n = Number.parseInt(val, 10);
        if (!Number.isNaN(n)) totalByScore += n;
      }
    }
    if (
      nScored > 0 &&
      totalByScore > 0 &&
      totalByScore !== nScored
    ) {
      warn(
        "ystats",
        `${yr} ${pk}: dist sums to ${totalByScore}, expected ${nScored}`
      );
    }
  }
}

// ══════════════════════════════════════════════════
//  REPORT
// ══════════════════════════════════════════════════
console.log();
console.log("═".repeat(55));
console.log(`AUDIT COMPLETE: ${issues.length} issues found`);
console.log("═".repeat(55));

const byCat = {};
for (const { cat, msg } of issues) {
  (byCat[cat] ??= []).push(msg);
}

for (const cat of Object.keys(byCat).sort()) {
  const msgs = byCat[cat];
  console.log(`\n── ${cat} (${msgs.length} issues) ──`);
  for (const m of msgs.slice(0, 80)) {
    console.log(`  • ${m}`);
  }
  if (msgs.length > 80) {
    console.log(`  ... and ${msgs.length - 80} more`);
  }
}

console.log();
if (issues.length > 0) process.exit(0);
