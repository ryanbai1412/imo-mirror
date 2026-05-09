import {
  loadResultsMatrix,
  loadTimeline,
  isIndividualContestant,
} from "$lib/utils/data";

export function load({ url }) {
  const matrix = loadResultsMatrix();
  const timeline = loadTimeline();

  const years = timeline
    .filter((t) => t.contestants_all && t.contestants_all > 0)
    .map((t) => t.year)
    .sort((a, b) => b - a);

  const codes = Object.keys(matrix)
    .filter((c) => !isIndividualContestant(c))
    .sort();
  const filterCode = url.searchParams.get("code") || "";
  const filteredCodes = filterCode
    ? codes.filter((c) => c === filterCode)
    : codes;

  return { matrix, years, filteredCodes };
}
