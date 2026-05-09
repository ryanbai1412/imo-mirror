import { redirect } from "@sveltejs/kit";
import { loadCountryResultsByYear, loadTimeline } from "$lib/utils/data";
import type { CountryDistBucket } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";

export async function load({ url }) {
  const year = url.searchParams.get("year") || "";
  if (!year) redirect(302, "/results_year.aspx");

  const [countryResults, timeline] = await Promise.all([
    loadCountryResultsByYear(),
    Promise.resolve(loadTimeline()),
  ]);

  const results = countryResults[year] || [];
  const yearNum = Number(year);
  const sortedYears = timeline.map((t) => t.year).sort((a, b) => a - b);
  const prevYear = timeline.find(
    (t) => t.year === sortedYears.filter((y) => y < yearNum).pop()
  );
  const nextYear = timeline.find(
    (t) => t.year === sortedYears.find((y) => y > yearNum)
  );
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column ? sortData(results, column, order) : results;

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
  for (const r of results) {
    if (r.total == null) continue;
    const bin = Math.min(Math.floor(r.total / binSize), numBins - 1);
    countryBins[bin]++;
    if (r.rank != null) {
      binRanks[bin].min = Math.min(binRanks[bin].min, r.rank);
      binRanks[bin].max = Math.max(binRanks[bin].max, r.rank);
    }
  }
  const countryDistData: CountryDistBucket[] = countryBins.map((count, i) => ({
    label: `${i * binSize}–${i * binSize + binSize - 1}`,
    lo: i * binSize,
    count,
    rankMin: binRanks[i].min === Infinity ? null : binRanks[i].min,
    rankMax: binRanks[i].max === -Infinity ? null : binRanks[i].max,
  }));

  const hasP7 = results.some((r) => r.p7 != null);

  return {
    year,
    entries: sorted,
    countryDistData,
    hasP7,
    prevYear,
    nextYear,
    column,
    order,
    url,
  };
}
