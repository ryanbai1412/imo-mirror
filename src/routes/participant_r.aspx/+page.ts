import { redirect } from "@sveltejs/kit";
import {
  loadIndividualResultsByYear,
  loadTimeline,
  officialMedalsByYear,
} from "$lib/utils/data";
import type {
  ParticipantResult,
  ParticipantRankChartEntry,
} from "$lib/utils/data";
import { awardType } from "$lib/utils/awardClass";

export async function load({ url }) {
  const id = url.searchParams.get("id") || "";
  if (!id) redirect(302, "/");

  const [individualResults, timeline] = await Promise.all([
    loadIndividualResultsByYear(),
    Promise.resolve(loadTimeline()),
  ]);

  // Build participant from individual results
  const idNum = Number(id);
  let name = "";
  const results: ParticipantResult[] = [];
  for (const [yearStr, rows] of Object.entries(individualResults)) {
    for (const r of rows) {
      if (r.participant_id === idNum) {
        name = r.name;
        results.push({
          year: Number(yearStr),
          country: r.country,
          country_code: r.country_code,
          p1: r.p1,
          p2: r.p2,
          p3: r.p3,
          p4: r.p4,
          p5: r.p5,
          p6: r.p6,
          p7: r.p7 ?? null,
          total: r.total,
          rank: r.rank,
          award: r.award,
        });
      }
    }
  }
  if (!results.length) redirect(302, "/");

  const p = { id: idNum, name, results };
  const totalGold = results.filter((r) => awardType(r.award) === "gold").length;
  const totalSilver = results.filter(
    (r) => awardType(r.award) === "silver"
  ).length;
  const totalBronze = results.filter(
    (r) => awardType(r.award) === "bronze"
  ).length;
  const totalHM = results.filter((r) => awardType(r.award) === "hm").length;
  const perfectScores = results.filter((r) => {
    if (r.total == null) return false;
    const yearRows = individualResults[String(r.year)];
    if (!yearRows || yearRows.length === 0) return r.total === 42;
    const pKeys =
      yearRows[0].p7 != null
        ? ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]
        : ["p1", "p2", "p3", "p4", "p5", "p6"];
    const maxes: Record<string, number> = {};
    for (const k of pKeys) maxes[k] = 0;
    for (const yr of yearRows) {
      for (const k of pKeys) {
        const v = (yr as unknown as Record<string, number | null>)[k];
        if (v != null && v > maxes[k]) maxes[k] = v;
      }
    }
    const maxTotal = Object.values(maxes).reduce((a, b) => a + b, 0);
    return r.total === maxTotal;
  }).length;
  const specialPrizes = results.filter((r) =>
    r.award.includes("special")
  ).length;
  const hasP7 = results.some((r) => r.p7 != null);

  const timelineByYear = new Map(timeline.map((t) => [t.year, t]));
  const participantYears = new Set(results.map((r) => r.year));
  const officialMedals = officialMedalsByYear();
  const rankChartData: ParticipantRankChartEntry[] = [];
  for (const [yearStr] of Object.entries(individualResults)) {
    const yr = Number(yearStr);
    const tl = timelineByYear.get(yr);
    if (!tl) continue;
    const om = officialMedals.get(yr) ?? {
      gold: 0,
      silver: 0,
      bronze: 0,
      hm: 0,
      none: 0,
    };
    const pResult = participantYears.has(yr)
      ? results.find((r) => r.year === yr)
      : null;
    rankChartData.push({
      year: yr,
      edition: tl.edition,
      gold: om.gold,
      silver: om.silver,
      bronze: om.bronze,
      hm: om.hm,
      none: om.none,
      rank: pResult?.rank ?? null,
    });
  }
  rankChartData.sort((a, b) => a.edition - b.edition);

  return {
    id,
    participant: p,
    totalGold,
    totalSilver,
    totalBronze,
    totalHM,
    perfectScores,
    specialPrizes,
    hasP7,
    rankChartData,
  };
}
