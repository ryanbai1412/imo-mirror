import { loadTimeline, loadCountries } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";
export function load({ url }) {
  const timeline = loadTimeline();
  const countries = loadCountries();
  const nameToCode = Object.fromEntries(countries.map((c) => [c.name, c.code]));
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column ? sortData(timeline, column, order) : timeline;

  const chrono = [...timeline]
    .filter((t) => t.num_countries != null)
    .sort((a, b) => a.year - b.year);
  const growthData = chrono.map((t) => ({
    year: t.year,
    countries: t.num_countries ?? 0,
    contestants: t.contestants_all ?? 0,
  }));

  return {
    timeline: sorted,
    nameToCode,
    growthData,
    column,
    order,
    url,
  };
}
