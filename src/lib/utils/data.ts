import { awardType, type AwardType } from "./awardClass";

// --- Static imports (small files baked into JS bundle) ---
import timelineData from "$lib/data/timeline.json";
import countriesData from "$lib/data/countries.json";
import yearInfoData from "$lib/data/year_info.json";
import yearStatisticsData from "$lib/data/year_statistics.json";
import hallOfFameData from "$lib/data/hall_of_fame.json";
import resultsCountryData from "$lib/data/results_country.json";
import resultsYearData from "$lib/data/results_year.json";
import resultsMatrixData from "$lib/data/results_matrix.json";

// --- Dynamic imports (large files, Vite code-splits + hashes) ---
import { individualResults, countryResults } from "$lib/data-store";

export interface TimelineEntry {
  edition: number;
  year: number;
  country: string;
  city: string;
  date: string;
  num_countries: number | null;
  contestants_all: number | null;
  contestants_male: number | null;
  contestants_female: number | null;
  homepage: string;
}

export interface Country {
  code: string;
  name: string;
  contact: string;
  website: string;
  host_years: number[];
  flag_url: string;
}

export interface CountryResult {
  country: string;
  code: string;
  team_size_all: number;
  team_size_male: number | null;
  team_size_female: number | null;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  p7: number | null;
  total: number | null;
  rank: number | null;
  awards_gold: number | null;
  awards_silver: number | null;
  awards_bronze: number | null;
  awards_hm: number | null;
  leader: string;
  deputy_leader: string;
}

export interface IndividualResult {
  name: string;
  participant_id: number | null;
  country: string;
  country_code: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  p7: number | null;
  total: number;
  rank: number | null;
  award: AwardType[];
}

export interface YearInfo {
  year: number;
  num_countries: number;
  num_contestants: number;
  gold_count: number;
  gold_cutoff: number;
  silver_count: number;
  silver_cutoff: number;
  bronze_count: number;
  bronze_cutoff: number;
  hm_count?: number;
  homepage?: string;
  problem_languages: string[];
}

export interface YearStatistics {
  year: number;
  problems: Record<string, Record<string, string>>;
}

export interface HallOfFameEntry {
  name: string;
  participant_id: number;
  country_code: string;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  special_prizes: number;
  perfect_scores: number;
  participations: number;
}

export interface ParticipantResult {
  year: number;
  country: string;
  country_code: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  p7: number | null;
  total: number | null;
  rank: number | null;
  award: AwardType[];
}

export interface ResultsCountryEntry {
  code: string;
  country: string;
  first_participation: number | null;
  participations: number;
  contestants_all: number;
  contestants_male: number | null;
  contestants_female: number | null;
  distinct_contestants: number;
  avg_persistence: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
}

export interface ResultsYearEntry {
  year: number;
  host_country: string;
  num_countries: number | null;
  contestants_all: number | null;
  contestants_male: number | null;
  contestants_female: number | null;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  max_points: number | null;
  efficiency: number | null;
  gold_cutoff: number | null;
  silver_cutoff: number | null;
  bronze_cutoff: number | null;
}

export interface ResultsMatrixData {
  [countryCode: string]: Record<string, number>;
}

export interface CountryTeamRow {
  year: number;
  team_size_all: number;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  p7: number | null;
  total: number | null;
  rank: number | null;
  awards_gold: number | null;
  awards_silver: number | null;
  awards_bronze: number | null;
  awards_hm: number | null;
  leader: string;
  deputy_leader: string;
}

export interface CountryIndivRow {
  year: number;
  name: string;
  participant_id: number | null;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  p7: number | null;
  total: number | null;
  rank: number | null;
  award: AwardType[];
}

/**
 * Format a date string like "10.7. - 20.7." into
 * locale-specific format without the year, e.g.
 * "Jul 10 – Jul 20" in en-US.
 * Uses a fixed reference year internally for parsing.
 */
export function formatDate(raw: string, locale?: string): string {
  if (!raw) return "";
  const fmt = (d: number, m: number) => {
    const date = new Date(2000, m - 1, d);
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  };
  // pattern: "10.7. - 20.7." or "10.7."
  const parts = raw.split("-").map((s) => s.trim());
  const parse = (s: string) => {
    const m = s.match(/^(\d+)\.(\d+)\./);
    return m ? ([Number(m[1]), Number(m[2])] as const) : null;
  };
  const a = parse(parts[0]);
  if (!a) return raw;
  if (parts.length === 2) {
    const b = parse(parts[1]);
    if (b) return `${fmt(a[0], a[1])} – ${fmt(b[0], b[1])}`;
  }
  return fmt(a[0], a[1]);
}

export function isIndividualContestant(code: string): boolean {
  return /^C\d+$/.test(code);
}

export interface RankChartEntry {
  year: number;
  edition: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  none: number;
  ranks: number[];
  cg: number;
  cs: number;
  cb: number;
  ch: number;
}

export interface ParticipantRankChartEntry {
  year: number;
  edition: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  none: number;
  rank: number | null;
}

export interface DistBucket {
  score: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  none: number;
  rankMin: number | null;
  rankMax: number | null;
}

export interface CountryDistBucket {
  label: string;
  lo: number;
  count: number;
  rankMin: number | null;
  rankMax: number | null;
}

export function buildDistBuckets(
  results: IndividualResult[],
  maxScore?: number
): DistBucket[] {
  if (maxScore == null) {
    maxScore = 42;
    for (const r of results) {
      if (r.total != null && r.total > maxScore) maxScore = r.total;
    }
  }
  const buckets: DistBucket[] = [];
  for (let s = 0; s <= maxScore; s++) {
    buckets.push({
      score: s,
      gold: 0,
      silver: 0,
      bronze: 0,
      hm: 0,
      none: 0,
      rankMin: null,
      rankMax: null,
    });
  }
  for (const r of results) {
    if (r.total == null || r.total < 0 || r.total > maxScore) continue;
    const bucket = buckets[r.total];
    const t = awardType(r.award);
    if (t === "gold") bucket.gold++;
    else if (t === "silver") bucket.silver++;
    else if (t === "bronze") bucket.bronze++;
    else if (t === "hm") bucket.hm++;
    else bucket.none++;
    if (r.rank != null) {
      bucket.rankMin =
        bucket.rankMin == null ? r.rank : Math.min(bucket.rankMin, r.rank);
      bucket.rankMax =
        bucket.rankMax == null ? r.rank : Math.max(bucket.rankMax, r.rank);
    }
  }
  return buckets;
}

export interface OfficialMedalCounts {
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  none: number;
}

/**
 * Official medal counts per year from
 * results_year.json (the authoritative source).
 *
 * Use this instead of counting individual awards
 * when you need "how many golds did IMO award?"
 * — the individual results page can include
 * guests/unofficial contestants whose awards
 * inflate the count.
 */
export function officialMedalsByYear(): Map<number, OfficialMedalCounts> {
  const map = new Map<number, OfficialMedalCounts>();
  for (const r of resultsYearData as ResultsYearEntry[]) {
    if (r.year == null) continue;
    const total = r.contestants_all ?? 0;
    const g = r.gold ?? 0;
    const s = r.silver ?? 0;
    const b = r.bronze ?? 0;
    const h = r.hm ?? 0;
    map.set(r.year, {
      gold: g,
      silver: s,
      bronze: b,
      hm: h,
      none: Math.max(0, total - g - s - b - h),
    });
  }
  return map;
}

// --- Typed loaders (no origin param needed) ---
export const loadTimeline = (): TimelineEntry[] => timelineData;
export const loadCountries = (): Country[] => countriesData;
export const loadYearInfo = (): Record<string, YearInfo> => yearInfoData;
export const loadYearStatistics = (): Record<string, YearStatistics> =>
  yearStatisticsData;
export const loadHallOfFame = (): HallOfFameEntry[] => hallOfFameData;
export const loadResultsCountry = (): ResultsCountryEntry[] =>
  resultsCountryData;
export const loadResultsYear = (): ResultsYearEntry[] => resultsYearData;
export const loadResultsMatrix = (): ResultsMatrixData => resultsMatrixData;
export const loadCountryResultsByYear = () => countryResults;
export const loadIndividualResultsByYear = () => individualResults;
