import { redirect } from "@sveltejs/kit";
import {
  loadIndividualResultsByYear,
  loadCountries,
  loadTimeline,
  officialMedalsByYear,
} from "$lib/utils/data";
import type { CountryIndivRow, RankChartEntry } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";
import { awardType } from "$lib/utils/awardClass";

export async function load({ url }) {
  const code = url.searchParams.get("code") || "";
  if (!code) redirect(302, "/countries.aspx");

  const [individualResults, countries, timeline] = await Promise.all([
    loadIndividualResultsByYear(),
    Promise.resolve(loadCountries()),
    Promise.resolve(loadTimeline()),
  ]);

  const country = countries.find((c) => c.code === code);
  const { column, order } = parseSortParams(url.searchParams);

  const allRows: CountryIndivRow[] = [];
  for (const [year, results] of Object.entries(individualResults)) {
    for (const r of results) {
      if (r.country_code === code) {
        allRows.push({
          year: Number(year),
          name: r.name,
          participant_id: r.participant_id,
          p1: r.p1,
          p2: r.p2,
          p3: r.p3,
          p4: r.p4,
          p5: r.p5,
          p6: r.p6,
          p7: r.p7,
          total: r.total,
          rank: r.rank,
          award: r.award,
        });
      }
    }
  }
  allRows.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
  const rows = column ? sortData(allRows, column, order) : allRows;
  const hasP7 = allRows.some((r) => r.p7 != null);

  const timelineByYear = new Map(timeline.map((t) => [t.year, t]));
  const countryYears = new Set(allRows.map((r) => r.year));
  const officialMedals = officialMedalsByYear();
  const rankChartData: RankChartEntry[] = [];
  for (const [yearStr] of Object.entries(individualResults)) {
    const yr = Number(yearStr);
    const tl = timelineByYear.get(yr);
    if (!tl) continue;
    const om = officialMedals.get(yr) ?? {
      gold: 0,
      silver: 0,
      bronze: 0,
      hm: 0,
      none: 0,
    };
    const countryRanks: number[] = [];
    let cg = 0,
      cs = 0,
      cb = 0,
      ch = 0;
    if (countryYears.has(yr)) {
      for (const r of allRows) {
        if (r.year !== yr) continue;
        if (r.rank != null) countryRanks.push(r.rank);
        const t = awardType(r.award);
        if (t === "gold") cg++;
        else if (t === "silver") cs++;
        else if (t === "bronze") cb++;
        else if (t === "hm") ch++;
      }
    }
    rankChartData.push({
      year: yr,
      edition: tl.edition,
      gold: om.gold,
      silver: om.silver,
      bronze: om.bronze,
      hm: om.hm,
      none: om.none,
      ranks: countryRanks,
      cg,
      cs,
      cb,
      ch,
    });
  }
  rankChartData.sort((a, b) => a.edition - b.edition);

  return {
    code,
    country,
    rows,
    hasP7,
    rankChartData,
    column,
    order,
    url,
  };
}
