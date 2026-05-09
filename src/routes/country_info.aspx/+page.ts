import { redirect } from "@sveltejs/kit";
import {
  loadCountries,
  loadCountryResultsByYear,
  loadIndividualResultsByYear,
  loadTimeline,
} from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";
import type { AwardType } from "$lib/utils/awardClass";

interface CountryYearRow {
  year: number;
  rank: number | null;
  total: number | null;
  gold: number | null;
  silver: number | null;
  bronze: number | null;
  hm: number | null;
  leader: string;
  deputy_leader: string;
}

interface CountryIndivSummaryRow {
  year: number;
  name: string;
  participant_id: number | null;
  total: number | null;
  rank: number | null;
  award: AwardType[];
}

export async function load({ url }) {
  const code = url.searchParams.get("code") || "";
  if (!code) redirect(302, "/countries.aspx");

  const [countries, countryResults, individualResults, timeline] =
    await Promise.all([
      Promise.resolve(loadCountries()),
      loadCountryResultsByYear(),
      loadIndividualResultsByYear(),
      Promise.resolve(loadTimeline()),
    ]);

  const country = countries.find((c) => c.code === code);
  if (!country) redirect(302, "/countries.aspx");

  const { column, order } = parseSortParams(url.searchParams);

  const yearRows: CountryYearRow[] = [];
  for (const [year, results] of Object.entries(countryResults)) {
    const match = results.find((r) => r.code === code);
    if (match) {
      yearRows.push({
        year: Number(year),
        rank: match.rank,
        total: match.total,
        gold: match.awards_gold,
        silver: match.awards_silver,
        bronze: match.awards_bronze,
        hm: match.awards_hm,
        leader: match.leader || "",
        deputy_leader: match.deputy_leader || "",
      });
    }
  }
  yearRows.sort((a, b) => b.year - a.year);
  const sortedYearRows = column ? sortData(yearRows, column, order) : yearRows;

  const indivRows: CountryIndivSummaryRow[] = [];
  for (const [year, results] of Object.entries(individualResults)) {
    for (const r of results) {
      if (r.country_code === code) {
        indivRows.push({
          year: Number(year),
          name: r.name,
          participant_id: r.participant_id,
          total: r.total,
          rank: r.rank,
          award: r.award,
        });
      }
    }
  }
  indivRows.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));

  const hostYears = timeline.filter((t) => country.host_years.includes(t.year));

  const medalTotals = {
    gold: 0,
    silver: 0,
    bronze: 0,
    hm: 0,
    participations: yearRows.length,
  };
  for (const row of yearRows) {
    medalTotals.gold += row.gold ?? 0;
    medalTotals.silver += row.silver ?? 0;
    medalTotals.bronze += row.bronze ?? 0;
    medalTotals.hm += row.hm ?? 0;
  }

  return {
    code,
    country,
    sortedYearRows,
    indivRows,
    hostYears,
    medalTotals,
    column,
    order,
    url,
  };
}
