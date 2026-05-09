import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadHallOfFame, type HallOfFameEntry } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'country_code', label: 'Country' },
  { key: 'participations', label: 'Part.', align: 'right' },
  { key: 'gold', label: 'Gold', align: 'right' },
  { key: 'silver', label: 'Silver', align: 'right' },
  { key: 'bronze', label: 'Bronze', align: 'right' },
  { key: 'hm', label: 'HM', align: 'right' },
  { key: 'special_prizes', label: 'SP', align: 'right' },
  { key: 'perfect_scores', label: 'PS', align: 'right' },
];

export default function HallOfFamePage() {
  const [data, setData] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadHallOfFame().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column ? sortData(data, column, order) : data;

  return (
    <div className="page-content">
      <SEO title="Hall of Fame" description="Top performers in the history of the International Mathematical Olympiad. Ranked by gold, silver, bronze medals, and special prizes." path="/hall.aspx" />
      <h2>Hall of Fame</h2>
      <p>Top performers in the history of the International Mathematical Olympiad.</p>

      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as HallOfFameEntry;
          if (col.key === 'name') {
            return entry.participant_id ? (
              <Link to={`/participant_r.aspx?id=${entry.participant_id}`}>{entry.name}</Link>
            ) : (
              entry.name
            );
          }
          if (col.key === 'country_code') {
            return <Link to={`/country_info.aspx?code=${entry.country_code}`}>{entry.country_code}</Link>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row, idx) => `${(row as unknown as HallOfFameEntry).participant_id || idx}`}
      />
    </div>
  );
}
