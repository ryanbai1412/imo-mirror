export interface TimelineEntry {
  year: number;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  num_contestants: number | null;
  num_countries: number | null;
  link: string;
}

export interface Country {
  code: string;
  name: string;
  flag_url: string;
  contact_name: string;
  contact_email: string;
  website: string;
}

export interface CountryResult {
  country: string;
  country_code: string;
  team_size: number | null;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  total: number | null;
  rank: number | null;
  gold: number | null;
  silver: number | null;
  bronze: number | null;
  honourable_mention: number | null;
  leader: string;
  deputy_leader: string;
}

export interface IndividualResult {
  name: string;
  participant_id: number | null;
  gender: string;
  country: string;
  country_code: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  total: number | null;
  rank: number | null;
  award: string;
}

export interface YearInfo {
  year: number;
  gold_cutoff: number | null;
  silver_cutoff: number | null;
  bronze_cutoff: number | null;
  num_contestants: number | null;
  num_countries: number | null;
  num_gold: number | null;
  num_silver: number | null;
  num_bronze: number | null;
  num_honourable_mention: number | null;
  max_score: number | null;
}

export interface YearStatistic {
  problem: string;
  p_number: number;
  avg: number | null;
  scores: Record<string, number>;
}

export interface HallOfFameEntry {
  rank: number | null;
  name: string;
  participant_id: number | null;
  country: string;
  country_code: string;
  years_participated: number;
  gold: number;
  silver: number;
  bronze: number;
  honourable_mention: number;
  total_score: number | null;
}

export interface Problem {
  year: number;
  problem_number: number;
  day: number;
  languages: string[];
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
  total: number | null;
  rank: number | null;
  award: string;
}

export interface ResultsCountryEntry {
  country: string;
  country_code: string;
  years: number;
  gold: number;
  silver: number;
  bronze: number;
  honourable_mention: number;
  total_contestants: number;
}

export interface ResultsYearEntry {
  year: number;
  country: string;
  city: string;
  num_countries: number | null;
  num_contestants: number | null;
  gold: number | null;
  silver: number | null;
  bronze: number | null;
  honourable_mention: number | null;
}

export interface ResultsMatrixEntry {
  country: string;
  country_code: string;
  years: Record<string, number | null>;
}

export type SortOrder = 'asc' | 'desc';
