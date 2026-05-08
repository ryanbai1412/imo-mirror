import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadResultsCountry, type ResultsCountryEntry } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';

const COLUMNS: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'country', label: 'Country' },
  { key: 'first_participation', label: 'First', align: 'right' },
  { key: 'participations', label: 'Part.', align: 'right' },
  { key: 'contestants_all', label: 'Cont.', align: 'right' },
  { key: 'contestants_male', label: 'Male', align: 'right' },
  { key: 'contestants_female', label: 'Female', align: 'right' },
  { key: 'gold', label: 'G', align: 'right' },
  { key: 'silver', label: 'S', align: 'right' },
  { key: 'bronze', label: 'B', align: 'right' },
  { key: 'hm', label: 'HM', align: 'right' },
];

export default function ResultsCountryPage() {
  const [data, setData] = useState<ResultsCountryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadResultsCountry().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column ? sortData(data, column, order) : data;

  return (
    <div className="page-content">
      <h2>Results by Country</h2>
      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as ResultsCountryEntry;
          if (col.key === 'code') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{entry.code}</Link>;
          }
          if (col.key === 'country') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{entry.country}</Link>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as ResultsCountryEntry).code)}
      />
    </div>
  );
}
