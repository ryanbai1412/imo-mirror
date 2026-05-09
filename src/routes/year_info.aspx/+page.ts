import { redirect } from "@sveltejs/kit";
import { loadYearInfo, loadTimeline } from "$lib/utils/data";

export function load({ url }) {
  const year = url.searchParams.get("year") || "";
  if (!year) redirect(302, "/organizers.aspx");

  const yearInfoMap = loadYearInfo();
  const timeline = loadTimeline();

  const info = yearInfoMap[year];
  const entry = timeline.find((t) => t.year === Number(year));
  if (!info && !entry) redirect(302, "/organizers.aspx");

  const yearNum = Number(year);
  const sortedYears = timeline.map((t) => t.year).sort((a, b) => a - b);
  const prevYear = timeline.find(
    (t) => t.year === sortedYears.filter((y) => y < yearNum).pop()
  );
  const nextYear = timeline.find(
    (t) => t.year === sortedYears.find((y) => y > yearNum)
  );

  return { year, info, entry, prevYear, nextYear };
}
