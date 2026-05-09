import { redirect } from "@sveltejs/kit";
import {
  loadIndividualResultsByYear,
  loadCountryResultsByYear,
  loadCountries,
  loadTimeline,
  buildDistBuckets,
} from "$lib/utils/data";
import type { CountryDistBucket } from "$lib/utils/data";

export async function load({ url }) {
  const code = url.searchParams.get("code") || "";
  const year = url.searchParams.get("year") || "";

  if (!code && !year) redirect(302, "/results_country.aspx");
  if (!year) redirect(302, `/country_team_r.aspx?code=${code}`);
  if (!code) redirect(302, `/year_country_r.aspx?year=${year}`);

  const [individualResults, countryResults, countries, timeline] =
    await Promise.all([
      loadIndividualResultsByYear(),
      loadCountryResultsByYear(),
      Promise.resolve(loadCountries()),
      Promise.resolve(loadTimeline()),
    ]);

  const country = countries.find((c) => c.code === code);
  const yearNum = Number(year);
  const allIndividual = individualResults[year] || [];
  const teamMembers = allIndividual
    .filter((r) => r.country_code === code)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

  const countryYearResults = countryResults[year] || [];
  const teamResult = countryYearResults.find((r) => r.code === code);

  const sortedYears = timeline.map((t) => t.year).sort((a, b) => a - b);
  const prevYearNum = sortedYears
    .filter((y) => y < yearNum)
    .reverse()
    .find((y) =>
      (countryResults[String(y)] || []).some((r) => r.code === code)
    );
  const nextYearNum = sortedYears
    .filter((y) => y > yearNum)
    .find((y) =>
      (countryResults[String(y)] || []).some((r) => r.code === code)
    );
  const prevYear = prevYearNum
    ? timeline.find((t) => t.year === prevYearNum)
    : undefined;
  const nextYear = nextYearNum
    ? timeline.find((t) => t.year === nextYearNum)
    : undefined;

  const distBuckets =
    allIndividual.length > 0 ? buildDistBuckets(allIndividual) : [];
  const teamScores = teamMembers.map((m) => m.total ?? -1);
  const hasP7 = teamMembers.some((m) => m.p7 != null) || teamResult?.p7 != null;
  const teamTotal = teamMembers.reduce((s, m) => s + (m.total ?? 0), 0);

  const binSize = 10;
  const maxPossible = 252;
  const numBins = Math.ceil(maxPossible / binSize) + 1;
  const countryBins: number[] = Array(numBins).fill(0);
  const binRanks: { min: number; max: number }[] = Array.from(
    { length: numBins },
    () => ({
      min: Infinity,
      max: -Infinity,
    })
  );
  for (const r of countryYearResults) {
    if (r.total == null) continue;
    const bin = Math.min(Math.floor(r.total / binSize), numBins - 1);
    countryBins[bin]++;
    if (r.rank != null) {
      binRanks[bin].min = Math.min(binRanks[bin].min, r.rank);
      binRanks[bin].max = Math.max(binRanks[bin].max, r.rank);
    }
  }
  const countryDistData: CountryDistBucket[] = countryBins.map((count, i) => ({
    label: `${i * binSize}\u2013${i * binSize + binSize - 1}`,
    lo: i * binSize,
    count,
    rankMin: binRanks[i].min === Infinity ? null : binRanks[i].min,
    rankMax: binRanks[i].max === -Infinity ? null : binRanks[i].max,
  }));
  const teamBin =
    teamTotal != null
      ? Math.min(Math.floor(teamTotal / binSize), numBins - 1)
      : -1;

  return {
    code,
    year,
    country,
    teamMembers,
    teamResult,
    teamTotal,
    hasP7,
    prevYear: prevYear ?? null,
    nextYear: nextYear ?? null,
    distBuckets,
    teamScores,
    countryDistData,
    teamBin,
    hasCountryResults: countryYearResults.length > 0,
  };
}
