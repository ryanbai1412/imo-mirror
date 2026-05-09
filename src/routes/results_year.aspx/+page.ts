import { loadResultsYear } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";

export function load({ url }) {
  const yearData = loadResultsYear();
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column ? sortData(yearData, column, order) : yearData;

  const chronoYear = [...yearData]
    .filter((r) => r.year && r.gold != null)
    .sort((a, b) => a.year - b.year);
  const medalChartData = chronoYear.map((r) => ({
    year: r.year,
    gold: r.gold ?? 0,
    silver: r.silver ?? 0,
    bronze: r.bronze ?? 0,
    hm: r.hm ?? 0,
  }));
  const cutoffChartData = chronoYear
    .filter((r) => r.gold_cutoff != null)
    .map((r) => ({
      year: r.year,
      gold: r.gold_cutoff,
      silver: r.silver_cutoff,
      bronze: r.bronze_cutoff,
    }));

  return {
    entries: sorted,
    medalChartData,
    cutoffChartData,
    column,
    order,
    url,
  };
}
