import { redirect } from "@sveltejs/kit";
import {
  loadCountryResultsByYear,
  loadCountries,
  loadTimeline,
} from "$lib/utils/data";
import type { CountryTeamRow } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";

export async function load({ url }) {
  const code = url.searchParams.get("code") || "";
  if (!code) redirect(302, "/countries.aspx");

  const [countryResults, countries, timeline] = await Promise.all([
    loadCountryResultsByYear(),
    Promise.resolve(loadCountries()),
    Promise.resolve(loadTimeline()),
  ]);
  const country = countries.find((c) => c.code === code);
  const { column, order } = parseSortParams(url.searchParams);

  const allRows: CountryTeamRow[] = [];
  for (const [year, results] of Object.entries(countryResults)) {
    const match = results.find((r) => r.code === code);
    if (match) {
      allRows.push({
        year: Number(year),
        team_size_all: match.team_size_all,
        p1: match.p1,
        p2: match.p2,
        p3: match.p3,
        p4: match.p4,
        p5: match.p5,
        p6: match.p6,
        p7: match.p7,
        total: match.total,
        rank: match.rank,
        awards_gold: match.awards_gold,
        awards_silver: match.awards_silver,
        awards_bronze: match.awards_bronze,
        awards_hm: match.awards_hm,
        leader: match.leader,
        deputy_leader: match.deputy_leader,
      });
    }
  }
  allRows.sort((a, b) => b.year - a.year);
  const rows = column ? sortData(allRows, column, order) : allRows;
  const hasP7 = allRows.some((r) => r.p7 != null);
  const timelineByYear = new Map(timeline.map((t) => [t.year, t]));
  const chartPoints = allRows
    .map((r) => ({
      year: r.year,
      edition: timelineByYear.get(r.year)?.edition ?? null,
      numCountries: timelineByYear.get(r.year)?.num_countries ?? null,
      rank: r.rank,
    }))
    .filter((p) => p.edition != null)
    .sort((a, b) => a.edition! - b.edition!);

  const medalPoints = allRows
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((r) => ({
      year: r.year,
      gold: r.awards_gold ?? 0,
      silver: r.awards_silver ?? 0,
      bronze: r.awards_bronze ?? 0,
      hm: r.awards_hm ?? 0,
    }));

  return {
    code,
    country,
    rows,
    hasP7,
    chartPoints,
    medalPoints,
    column,
    order,
    url,
  };
}
