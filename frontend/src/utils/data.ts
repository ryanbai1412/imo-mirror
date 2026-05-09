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
  team_size_all: number | null;
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
  gender: string | null;
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
  award: string;
}

export interface YearInfo {
  year: number;
  num_countries: number | null;
  num_contestants: number | null;
  gold_count: number | null;
  gold_cutoff: number | null;
  silver_count: number | null;
  silver_cutoff: number | null;
  bronze_count: number | null;
  bronze_cutoff: number | null;
  hm_count: number | null;
  homepage: string;
  problem_languages: string[];
}

export interface YearStatistics {
  year: number;
  problems: ProblemStat[];
}

export interface ProblemStat {
  number: number;
  avg: number | null;
  distribution: Record<string, number>;
}

export interface HallOfFameEntry {
  name: string;
  participant_id: number | null;
  country_code: string;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  special_prizes: number;
  perfect_scores: number;
  participations: number;
}

export interface ProblemYear {
  year: number;
  languages: string[];
  pdf_url: string;
  shortlist_url: string;
}

export interface ParticipantInfo {
  id: number;
  name: string;
  results: ParticipantResult[];
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
  award: string;
}

export interface ResultsCountryEntry {
  code: string;
  country: string;
  first_participation: number | null;
  participations: number;
  contestants_all: number;
  contestants_male: number;
  contestants_female: number;
  distinct_contestants: number | null;
  avg_persistence: number | null;
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
  [countryCode: string]: {
    name: string;
    years: Record<string, number | null>;
  };
}

export interface StaticPageData {
  title: string;
  content: string;
}

async function fetchJson<T>(filename: string, origin: string): Promise<T> {
  const resp = await fetch(`${origin}/data/${filename}`);
  if (!resp.ok) throw new Error(`Failed to load ${filename}: ${resp.status}`);
  return resp.json() as Promise<T>;
}

export const loadTimeline = (o: string) => fetchJson<TimelineEntry[]>("timeline.json", o);
export const loadCountries = (o: string) => fetchJson<Country[]>("countries.json", o);
export const loadCountryResultsByYear = (o: string) => fetchJson<Record<string, CountryResult[]>>("country_results_by_year.json", o);
export const loadIndividualResultsByYear = (o: string) => fetchJson<Record<string, IndividualResult[]>>("individual_results_by_year.json", o);
export const loadYearInfo = (o: string) => fetchJson<Record<string, YearInfo>>("year_info.json", o);
export const loadYearStatistics = (o: string) => fetchJson<Record<string, YearStatistics>>("year_statistics.json", o);
export const loadHallOfFame = (o: string) => fetchJson<HallOfFameEntry[]>("hall_of_fame.json", o);
export const loadProblems = (o: string) => fetchJson<ProblemYear[]>("problems.json", o);
export const loadParticipants = (o: string) => fetchJson<Record<string, ParticipantInfo>>("participants.json", o);
export const loadResultsCountry = (o: string) => fetchJson<ResultsCountryEntry[]>("results_country.json", o);
export const loadResultsYear = (o: string) => fetchJson<ResultsYearEntry[]>("results_year.json", o);
export const loadResultsMatrix = (o: string) => fetchJson<ResultsMatrixData>("results_matrix.json", o);
export const loadStaticPages = (o: string) => fetchJson<Record<string, StaticPageData>>("static_pages.json", o);
