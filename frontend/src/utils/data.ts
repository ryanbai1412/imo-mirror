const DATA_BASE = '/data';

async function fetchJson<T>(path: string): Promise<T> {
  const resp = await fetch(`${DATA_BASE}/${path}`);
  if (!resp.ok) throw new Error(`Failed to fetch ${path}: ${resp.status}`);
  return resp.json();
}

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

export function loadTimeline(): Promise<TimelineEntry[]> {
  return fetchJson('timeline.json');
}

export function loadCountries(): Promise<Country[]> {
  return fetchJson('countries.json');
}

export function loadCountryResultsByYear(): Promise<Record<string, CountryResult[]>> {
  return fetchJson('country_results_by_year.json');
}

export function loadIndividualResultsByYear(): Promise<Record<string, IndividualResult[]>> {
  return fetchJson('individual_results_by_year.json');
}

export function loadYearInfo(): Promise<Record<string, YearInfo>> {
  return fetchJson('year_info.json');
}

export function loadYearStatistics(): Promise<Record<string, YearStatistics>> {
  return fetchJson('year_statistics.json');
}

export function loadHallOfFame(): Promise<HallOfFameEntry[]> {
  return fetchJson('hall_of_fame.json');
}

export function loadProblems(): Promise<ProblemYear[]> {
  return fetchJson('problems.json');
}

export function loadParticipants(): Promise<Record<string, ParticipantInfo>> {
  return fetchJson('participants.json');
}

export function loadResultsCountry(): Promise<ResultsCountryEntry[]> {
  return fetchJson('results_country.json');
}

export function loadResultsYear(): Promise<ResultsYearEntry[]> {
  return fetchJson('results_year.json');
}

export function loadResultsMatrix(): Promise<ResultsMatrixData> {
  return fetchJson('results_matrix.json');
}
