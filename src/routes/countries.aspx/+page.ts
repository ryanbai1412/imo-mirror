import { loadCountries } from "$lib/utils/data";
import { sortData, parseSortParams, pageUrl } from "$lib/utils/sort";

export function load({ url: rawUrl }) {
  const url = pageUrl(rawUrl);
  const countries = loadCountries();
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column ? sortData(countries, column, order) : countries;
  return { countries: sorted, column, order, url };
}
