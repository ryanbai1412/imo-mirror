import { redirect } from "@sveltejs/kit";
import { loadIndividualResultsByYear, loadCountries } from "$lib/utils/data";
import { sortData, parseSortParams } from "$lib/utils/sort";
import { awardType } from "$lib/utils/awardClass";

export async function load({ url }) {
  const code = url.searchParams.get("code") || "";
  if (!code) redirect(302, "/countries.aspx");

  const individualResults = await loadIndividualResultsByYear();
  const countries = loadCountries();
  const country = countries.find((c) => c.code === code);
  const { column, order } = parseSortParams(url.searchParams);

  interface HallRow {
    id: number;
    name: string;
    participations: number;
    gold: number;
    silver: number;
    bronze: number;
    hm: number;
    total_medals: number;
  }
  const hallMap = new Map<number, HallRow>();
  for (const results of Object.values(individualResults)) {
    for (const r of results) {
      if (r.country_code !== code || !r.participant_id) continue;
      let entry = hallMap.get(r.participant_id);
      if (!entry) {
        entry = {
          id: r.participant_id,
          name: r.name,
          participations: 0,
          gold: 0,
          silver: 0,
          bronze: 0,
          hm: 0,
          total_medals: 0,
        };
        hallMap.set(r.participant_id, entry);
      }
      entry.participations++;
      const t = awardType(r.award);
      if (t === "gold") entry.gold++;
      else if (t === "silver") entry.silver++;
      else if (t === "bronze") entry.bronze++;
      else if (t === "hm") entry.hm++;
      entry.total_medals = entry.gold + entry.silver + entry.bronze + entry.hm;
    }
  }
  let rows = Array.from(hallMap.values()).sort(
    (a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze
  );
  if (column) rows = sortData(rows, column, order);

  return { code, country, rows, column, order, url };
}
