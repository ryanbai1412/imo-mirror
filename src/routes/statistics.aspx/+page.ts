import {
  loadResultsYear,
  loadYearStatistics,
  loadIndividualResultsByYear,
} from "$lib/utils/data";
import { awardType, type AwardType } from "$lib/utils/awardClass";

// ─── Re-export types for the page ────────────
export type AwardKey = AwardType;
type BgKey = AwardKey | "na";

export interface CutoffPoint {
  year: number;
  gold: number;
  silver: number;
  bronze: number;
}

export interface DayScatterPoint {
  year: number;
  name: string;
  award: AwardType[];
  day1: number;
  day2: number;
  day1rank: number;
  day2rank: number;
}

export interface TransitionEntry {
  fromYear: number;
  toYear: number;
  name: string;
  from: AwardKey;
  to: AwardKey;
}

export interface BackgroundEntry {
  year: number;
  name: string;
  current: AwardKey;
  previous: BgKey;
}

export interface ProblemSolveEntry {
  year: number;
  problem: number;
  solves: number;
  total: number;
}

export interface MedalCountPoint {
  year: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  total: number;
}

export interface GrowthPoint {
  year: number;
  countries: number;
  contestants: number;
}

export async function load() {
  const [resultsYear, individualResults, yearStats] = await Promise.all([
    Promise.resolve(loadResultsYear()),
    loadIndividualResultsByYear(),
    Promise.resolve(loadYearStatistics()),
  ]);

  // ─── Medal cutoff data ───────────────────
  const cutoffData: CutoffPoint[] = resultsYear
    .filter((r) => r.gold_cutoff != null && r.year != null)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({
      year: r.year,
      gold: r.gold_cutoff!,
      silver: r.silver_cutoff!,
      bronze: r.bronze_cutoff!,
    }));

  // ─── Day 1 vs Day 2 scatter data ────────
  const dayScatterAll: DayScatterPoint[] = [];
  for (const [yearStr, results] of Object.entries(individualResults)) {
    const yr = parseInt(yearStr, 10);
    if (isNaN(yr)) continue;
    const stat = yearStats[yearStr];
    if (!stat) continue;
    const firstRow = Object.values(stat.problems)[0];
    if (!firstRow) continue;
    const pKeys = Object.keys(firstRow).sort();
    if (pKeys.length !== 6 || pKeys.includes("p7")) continue;

    const valid = results.filter(
      (r) =>
        r.p1 != null &&
        r.p2 != null &&
        r.p3 != null &&
        r.p4 != null &&
        r.p5 != null &&
        r.p6 != null
    );
    for (const r of valid) {
      dayScatterAll.push({
        year: yr,
        name: r.name,
        award: r.award,
        day1: r.p1! + r.p2! + r.p3!,
        day2: r.p4! + r.p5! + r.p6!,
        day1rank: 0,
        day2rank: 0,
      });
    }
  }

  // ─── Repeat contestant transition matrix ─
  const transitionsAll: TransitionEntry[] = [];
  const participantMap = new Map<
    number,
    { year: number; award: AwardType[]; name: string }[]
  >();
  for (const [yearStr, results] of Object.entries(individualResults)) {
    const yr = parseInt(yearStr, 10);
    if (isNaN(yr)) continue;
    for (const r of results) {
      if (!r.participant_id) continue;
      if (!participantMap.has(r.participant_id)) {
        participantMap.set(r.participant_id, []);
      }
      participantMap.get(r.participant_id)!.push({
        year: yr,
        award: r.award,
        name: r.name,
      });
    }
  }
  for (const appearances of participantMap.values()) {
    if (appearances.length < 2) continue;
    appearances.sort((a, b) => a.year - b.year);
    for (let i = 0; i < appearances.length - 1; i++) {
      transitionsAll.push({
        fromYear: appearances[i].year,
        toYear: appearances[i + 1].year,
        name: appearances[i].name,
        from: awardType(appearances[i].award),
        to: awardType(appearances[i + 1].award),
      });
    }
  }

  // ─── Background table data ──────────────
  const backgroundAll: BackgroundEntry[] = [];
  for (const appearances of participantMap.values()) {
    appearances.sort((a, b) => a.year - b.year);
    backgroundAll.push({
      year: appearances[0].year,
      name: appearances[0].name,
      current: awardType(appearances[0].award),
      previous: "na",
    });
    for (let i = 1; i < appearances.length; i++) {
      backgroundAll.push({
        year: appearances[i].year,
        name: appearances[i].name,
        current: awardType(appearances[i].award),
        previous: awardType(appearances[i - 1].award),
      });
    }
  }

  // ─── Per-problem solve counts ───────────
  const problemSolvesAll: ProblemSolveEntry[] = [];
  for (const [yearStr, stat] of Object.entries(yearStats)) {
    const yr = parseInt(yearStr, 10);
    if (isNaN(yr)) continue;
    const probs = stat.problems;
    const row0 = probs["Num( P# = 0 )"];
    if (!row0) continue;
    const pKeys = Object.keys(row0).sort();
    if (pKeys.length !== 6 || pKeys.includes("p7")) continue;
    let totalContestants = 0;
    for (let s = 0; s <= 10; s++) {
      const row = probs[`Num( P# = ${s} )`];
      if (row && row.p1) totalContestants += parseInt(row.p1, 10) || 0;
    }
    for (let p = 1; p <= 6; p++) {
      const key = `p${p}`;
      let solves = 0;
      for (let s = 5; s <= 10; s++) {
        const row = probs[`Num( P# = ${s} )`];
        if (row && row[key]) solves += parseInt(row[key], 10) || 0;
      }
      problemSolvesAll.push({
        year: yr,
        problem: p,
        solves,
        total: totalContestants,
      });
    }
  }

  // ─── Medal count data ──────────────────
  const medalCountData: MedalCountPoint[] = resultsYear
    .filter((r) => r.year != null && r.gold != null)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({
      year: r.year,
      gold: r.gold ?? 0,
      silver: r.silver ?? 0,
      bronze: r.bronze ?? 0,
      hm: r.hm ?? 0,
      total: r.contestants_all ?? 0,
    }));

  // ─── Participation growth data ─────────
  const growthData: GrowthPoint[] = resultsYear
    .filter((r) => r.num_countries != null && r.year != null)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({
      year: r.year,
      countries: r.num_countries ?? 0,
      contestants: r.contestants_all ?? 0,
    }));

  // ─── Year range ────────────────────────
  const allYears = cutoffData.map((d) => d.year);
  const minYear = allYears.length ? Math.min(...allYears) : 2000;
  const maxYear = allYears.length ? Math.max(...allYears) : 2025;

  // ─── Day scatter: compute overall corr ──
  // Rank computation per year
  const byYear = new Map<number, DayScatterPoint[]>();
  for (const d of dayScatterAll) {
    if (!byYear.has(d.year)) byYear.set(d.year, []);
    byYear.get(d.year)!.push(d);
  }
  for (const group of byYear.values()) {
    const s1 = [...group].sort((a, b) => b.day1 - a.day1);
    let rank = 1;
    for (let i = 0; i < s1.length; i++) {
      if (i > 0 && s1[i].day1 < s1[i - 1].day1) rank = i + 1;
      s1[i].day1rank = rank;
    }
    const s2 = [...group].sort((a, b) => b.day2 - a.day2);
    rank = 1;
    for (let i = 0; i < s2.length; i++) {
      if (i > 0 && s2[i].day2 < s2[i - 1].day2) rank = i + 1;
      s2[i].day2rank = rank;
    }
  }

  let maxRankPerYear = 1;
  for (const group of byYear.values()) {
    if (group.length > maxRankPerYear) maxRankPerYear = group.length;
  }

  return {
    cutoffData,
    dayScatterAll,
    transitionsAll,
    backgroundAll,
    problemSolvesAll,
    medalCountData,
    growthData,
    minYear,
    maxYear,
    maxRankPerYear,
  };
}
