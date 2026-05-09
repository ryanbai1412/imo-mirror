import { loadCountries } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";

export function load({ url }) {
  const countries = loadCountries();
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column ? sortData(countries, column, order) : countries;
  return { countries: sorted, column, order, url };
}
