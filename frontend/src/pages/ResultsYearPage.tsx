import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadResultsYear, type ResultsYearEntry } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';

const COLUMNS: Column[] = [
  { key: 'year', label: 'Year', align: 'right' },
  { key: 'host_country', label: 'Host' },
  { key: 'num_countries', label: 'Countries', align: 'right' },
  { key: 'contestants_all', label: 'Cont.', align: 'right' },
  { key: 'contestants_male', label: 'Male', align: 'right' },
  { key: 'contestants_female', label: 'Female', align: 'right' },
  { key: 'gold', label: 'G', align: 'right' },
  { key: 'silver', label: 'S', align: 'right' },
  { key: 'bronze', label: 'B', align: 'right' },
  { key: 'hm', label: 'HM', align: 'right' },
  { key: 'gold_cutoff', label: 'G≥', align: 'right' },
  { key: 'silver_cutoff', label: 'S≥', align: 'right' },
  { key: 'bronze_cutoff', label: 'B≥', align: 'right' },
];

export default function ResultsYearPage() {
  const [data, setData] = useState<ResultsYearEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadResultsYear().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column ? sortData(data, column, order) : data;

  return (
    <div className="page-content">
      <h2>Results by Year</h2>
      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as ResultsYearEntry;
          if (col.key === 'year') {
            return <Link to={`/year_info.aspx?year=${entry.year}`}>{entry.year}</Link>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as ResultsYearEntry).year)}
      />
    </div>
  );
}
