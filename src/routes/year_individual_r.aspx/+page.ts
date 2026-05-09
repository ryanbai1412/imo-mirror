import { redirect } from "@sveltejs/kit";
import {
  loadIndividualResultsByYear,
  loadTimeline,
  buildDistBuckets,
} from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";

export async function load({ url }) {
  const year = url.searchParams.get("year") || "";
  if (!year) redirect(302, "/results_year.aspx");

  const [individualResults, timeline] = await Promise.all([
    loadIndividualResultsByYear(),
    Promise.resolve(loadTimeline()),
  ]);

  const results = individualResults[year] || [];
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

  const distBuckets = buildDistBuckets(results);
  const hasP7 = results.some((r) => r.p7 != null);

  return {
    year,
    entries: sorted,
    distBuckets,
    hasP7,
    prevYear,
    nextYear,
    column,
    order,
    url,
  };
}
