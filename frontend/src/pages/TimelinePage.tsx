import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadTimeline, type TimelineEntry } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';

const COLUMNS: Column[] = [
  { key: 'edition', label: '#', align: 'right' },
  { key: 'year', label: 'Year', align: 'right' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'date', label: 'Date' },
  { key: 'num_countries', label: 'Countries', align: 'right' },
  { key: 'contestants_all', label: 'Contestants', align: 'right' },
  { key: 'contestants_male', label: 'Male', align: 'right' },
  { key: 'contestants_female', label: 'Female', align: 'right' },
];

export default function TimelinePage() {
  const [data, setData] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadTimeline().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column
    ? sortData(data, column, order)
    : data;

  return (
    <div className="page-content">
      <h2>Timeline</h2>
      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as TimelineEntry;
          if (col.key === 'year') {
            return <Link to={`/year_info.aspx?year=${entry.year}`}>{entry.year}</Link>;
          }
          if (col.key === 'country') {
            return entry.country;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as TimelineEntry).year)}
      />
    </div>
  );
}
