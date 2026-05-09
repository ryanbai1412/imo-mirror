export type SortDirection = "asc" | "desc";

export function sortData<T>(
  data: T[],
  column: string,
  direction: SortDirection,
): T[] {
  const sorted = [...data];
  sorted.sort((a, b) => {
    const va = (a as Record<string, unknown>)[column];
    const vb = (b as Record<string, unknown>)[column];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") {
      return direction === "asc" ? va - vb : vb - va;
    }
    const sa = String(va).toLowerCase();
    const sb = String(vb).toLowerCase();
    if (sa < sb) return direction === "asc" ? -1 : 1;
    if (sa > sb) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function parseSortParams(searchParams: URLSearchParams): { column: string; order: SortDirection } {
  const column = searchParams.get("column") || "";
  const order = (searchParams.get("order") || "asc") as SortDirection;
  return { column, order: order === "desc" ? "desc" : "asc" };
}

export function getSortUrl(url: URL, colKey: string, currentSort: string, currentOrder: string): string {
  const params = new URLSearchParams(url.search);
  if (params.get("column") === colKey) {
    params.set("order", params.get("order") === "asc" ? "desc" : "asc");
  } else {
    params.set("column", colKey);
    params.set("order", "asc");
  }
  return `${url.pathname}?${params.toString()}`;
}

export function sortIndicator(colKey: string, currentSort: string, currentOrder: string): string {
  if (currentSort !== colKey) return "";
  return currentOrder === "asc" ? " \u2191" : " \u2193";
}
