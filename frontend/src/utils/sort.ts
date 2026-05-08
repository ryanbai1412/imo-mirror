export type SortDirection = 'asc' | 'desc';

export function sortData<T>(
  data: T[],
  column: string,
  direction: SortDirection,
  accessor?: (item: T, col: string) => string | number | null
): T[] {
  const sorted = [...data];
  sorted.sort((a, b) => {
    const va = accessor ? accessor(a, column) : (a as Record<string, unknown>)[column];
    const vb = accessor ? accessor(b, column) : (b as Record<string, unknown>)[column];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') {
      return direction === 'asc' ? va - vb : vb - va;
    }
    const sa = String(va).toLowerCase();
    const sb = String(vb).toLowerCase();
    if (sa < sb) return direction === 'asc' ? -1 : 1;
    if (sa > sb) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function getNextDirection(current: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc';
}

export function parseSortParams(searchParams: URLSearchParams): { column: string; order: SortDirection } {
  const column = searchParams.get('column') || '';
  const order = (searchParams.get('order') || 'asc') as SortDirection;
  return { column, order: order === 'desc' ? 'desc' : 'asc' };
}
