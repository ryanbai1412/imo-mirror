import { loadResultsCountry, isIndividualContestant } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";

export function load({ url }) {
  const raw = loadResultsCountry();
  const countryData = raw.filter((r) => !isIndividualContestant(r.code));
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column
    ? sortData(countryData, column, order)
    : sortData(countryData, "gold", "desc");
  return { entries: sorted, column, order, url };
}
