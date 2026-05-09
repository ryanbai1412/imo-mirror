import { redirect } from "@sveltejs/kit";
import {
  loadYearStatistics,
  loadTimeline,
  loadIndividualResultsByYear,
  buildDistBuckets,
} from "$lib/utils/data";
import type { AwardType } from "$lib/utils/awardClass";

export interface DayPoint {
  name: string;
  award: AwardType[];
  day1: number;
  day2: number;
  day1rank: number;
  day2rank: number;
}

export async function load({ url }) {
  const year = url.searchParams.get("year") || "";
  if (!year) redirect(302, "/results_year.aspx");

  const [statsMap, timeline, individualResults] = await Promise.all([
    Promise.resolve(loadYearStatistics()),
    Promise.resolve(loadTimeline()),
    loadIndividualResultsByYear(),
  ]);
  const stats = statsMap[year];
  const results = individualResults[year] || [];
  const distBuckets = buildDistBuckets(results);

  const yearNum = Number(year);
  const sortedYears = timeline.map((t) => t.year).sort((a, b) => a - b);
  const prevYear = timeline.find(
    (t) => t.year === sortedYears.filter((y) => y < yearNum).pop()
  );
  const nextYear = timeline.find(
    (t) => t.year === sortedYears.find((y) => y > yearNum)
  );

  const firstRow = stats ? Object.values(stats.problems)[0] : undefined;
  const problemKeys = firstRow ? Object.keys(firstRow).sort() : [];
  const problemHeaders = problemKeys.map((k) => k.toUpperCase());

  const allRows = stats ? Object.entries(stats.problems) : [];
  const distributionRows = allRows.filter(([label]) =>
    label.startsWith("Num(")
  );
  const summaryRows = allRows.filter(
    ([label]) =>
      label.startsWith("Mean(") ||
      label.startsWith("Max(") ||
      label.startsWith("\u03c3(")
  );
  const correlationRows = allRows.filter(([label]) =>
    label.startsWith("Corr(")
  );

  const problemDistData: Record<string, { score: number; count: number }[]> =
    {};
  for (const key of problemKeys) {
    const buckets: { score: number; count: number }[] = [];
    for (const [label, values] of distributionRows) {
      const m = label.match(/Num\(\s*P#\s*=\s*(\d+)\s*\)/);
      if (m)
        buckets.push({
          score: parseInt(m[1], 10),
          count: parseInt(values[key] || "0", 10) || 0,
        });
    }
    buckets.sort((a, b) => a.score - b.score);
    if (buckets.length > 0) problemDistData[key] = buckets;
  }

  const hasSixProblems =
    problemKeys.length === 6 && !problemKeys.includes("p7");
  let dayPoints: DayPoint[] = [];
  let dayScoreCorr = 0;
  let dayRankCorr = 0;
  if (hasSixProblems && results.length > 0) {
    const raw: DayPoint[] = results
      .filter(
        (r) =>
          r.p1 != null &&
          r.p2 != null &&
          r.p3 != null &&
          r.p4 != null &&
          r.p5 != null &&
          r.p6 != null
      )
      .map((r) => ({
        name: r.name,
        award: r.award,
        day1: r.p1! + r.p2! + r.p3!,
        day2: r.p4! + r.p5! + r.p6!,
        day1rank: 0,
        day2rank: 0,
      }));
    const assignRanks = (
      sorted: DayPoint[],
      key: "day1rank" | "day2rank",
      scoreKey: "day1" | "day2"
    ) => {
      let rank = 1;
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i][scoreKey] < sorted[i - 1][scoreKey])
          rank = i + 1;
        sorted[i][key] = rank;
      }
    };
    assignRanks(
      [...raw].sort((a, b) => b.day1 - a.day1),
      "day1rank",
      "day1"
    );
    assignRanks(
      [...raw].sort((a, b) => b.day2 - a.day2),
      "day2rank",
      "day2"
    );
    dayPoints = raw;
    const pearson = (xs: number[], ys: number[]) => {
      const n = xs.length;
      if (n < 2) return 0;
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0,
        dx2 = 0,
        dy2 = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx,
          dy = ys[i] - my;
        num += dx * dy;
        dx2 += dx * dx;
        dy2 += dy * dy;
      }
      const denom = Math.sqrt(dx2 * dy2);
      return denom === 0 ? 0 : num / denom;
    };
    dayScoreCorr = pearson(
      raw.map((r) => r.day1),
      raw.map((r) => r.day2)
    );
    dayRankCorr = pearson(
      raw.map((r) => r.day1rank),
      raw.map((r) => r.day2rank)
    );
  }

  const dayScoreCorrVal =
    "r = " +
    dayScoreCorr.toFixed(3) +
    ", r\u00B2 = " +
    (dayScoreCorr * dayScoreCorr).toFixed(3);
  const dayRankCorrVal =
    "r = " +
    dayRankCorr.toFixed(3) +
    ", r\u00B2 = " +
    (dayRankCorr * dayRankCorr).toFixed(3);

  const sections = [
    { title: "Score Distribution", rows: distributionRows },
    { title: "Summary Statistics", rows: summaryRows },
    { title: "Correlations", rows: correlationRows },
  ].filter((s) => s.rows.length > 0);

  return {
    year,
    stats,
    distBuckets,
    problemKeys,
    problemHeaders,
    problemDistData,
    dayPoints,
    dayScoreCorrVal,
    dayRankCorrVal,
    sections,
    prevYear,
    nextYear,
    hasResults: results.length > 0,
  };
}
