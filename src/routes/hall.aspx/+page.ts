import { loadHallOfFame } from "$lib/utils/data";
import { sortData, parseSortParams, pageUrl } from "$lib/utils/sort";

export function load({ url: rawUrl }) {
  const url = pageUrl(rawUrl);
  const hallOfFame = loadHallOfFame();
  const { column, order } = parseSortParams(url.searchParams);
  const sorted = column ? sortData(hallOfFame, column, order) : hallOfFame;
  return { entries: sorted, column, order, url };
}
