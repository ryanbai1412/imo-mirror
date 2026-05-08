import { useSearchParams } from 'react-router-dom';
import { type SortDirection } from '../utils/sort';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface SortableTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  currentSort: string;
  currentOrder: SortDirection;
  renderCell?: (row: Record<string, unknown>, col: Column, index: number) => React.ReactNode;
  rowKey?: (row: Record<string, unknown>, index: number) => string;
  className?: string;
}

export default function SortableTable({
  columns,
  data,
  currentSort,
  currentOrder,
  renderCell,
  rowKey,
  className = '',
}: SortableTableProps) {
  const [, setSearchParams] = useSearchParams();

  function handleSort(colKey: string) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (params.get('column') === colKey) {
        params.set('order', params.get('order') === 'asc' ? 'desc' : 'asc');
      } else {
        params.set('column', colKey);
        params.set('order', 'asc');
      }
      return params;
    });
  }

  function sortIndicator(colKey: string) {
    if (currentSort !== colKey) return ' ⇅';
    return currentOrder === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <table className={`data-table sortable ${className}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''} ${col.sortable !== false ? 'sortable-header' : ''}`}
              onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
              style={col.sortable !== false ? { cursor: 'pointer' } : undefined}
            >
              {col.label}
              {col.sortable !== false && <span className="sort-indicator">{sortIndicator(col.key)}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={rowKey ? rowKey(row, idx) : idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
            {columns.map((col) => (
              <td
                key={col.key}
                className={`${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
              >
                {renderCell ? renderCell(row, col, idx) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type { Column };
