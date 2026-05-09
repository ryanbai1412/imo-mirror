import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadIndividualResultsByYear, loadYearInfo, type IndividualResult, type YearInfo } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';

const COLUMNS: Column[] = [
  { key: 'name', label: 'Contestant' },
  { key: 'country', label: 'Country' },
  { key: 'p1', label: 'P1', align: 'right' },
  { key: 'p2', label: 'P2', align: 'right' },
  { key: 'p3', label: 'P3', align: 'right' },
  { key: 'p4', label: 'P4', align: 'right' },
  { key: 'p5', label: 'P5', align: 'right' },
  { key: 'p6', label: 'P6', align: 'right' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'rank', label: 'Rank', align: 'right' },
  { key: 'award', label: 'Award' },
];

export default function YearIndividualResultsPage() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get('year') || '';
  const [data, setData] = useState<IndividualResult[]>([]);
  const [yearInfo, setYearInfo] = useState<YearInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    if (!year) { setLoading(false); return; }
    Promise.all([loadIndividualResultsByYear(), loadYearInfo()]).then(([results, info]) => {
      setData(results[year] || []);
      setYearInfo(info[year] || null);
      setLoading(false);
    });
  }, [year]);

  if (loading) return <Loading />;

  if (!year) {
    return (
      <div className="page-content">
        <h2>Please select a year</h2>
        <p><Link to="/organizers.aspx">View timeline</Link></p>
      </div>
    );
  }

  const sorted = column ? sortData(data, column, order) : data;

  return (
    <div className="page-content">
      <h2>Individual results &mdash; IMO {year}</h2>

      <div className="year-nav">
        <Link to={`/year_individual_r.aspx?year=${Number(year) - 1}`}>← Previous</Link>
        {' | '}
        <Link to={`/year_info.aspx?year=${year}`}>Year info</Link>
        {' | '}
        <Link to={`/year_country_r.aspx?year=${year}`}>Country results</Link>
        {' | '}
        <Link to={`/year_individual_r.aspx?year=${Number(year) + 1}`}>Next →</Link>
      </div>

      {yearInfo && (
        <p>
          Gold ≥ {yearInfo.gold_cutoff}, Silver ≥ {yearInfo.silver_cutoff}, Bronze ≥ {yearInfo.bronze_cutoff}
        </p>
      )}

      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as IndividualResult;
          if (col.key === 'name') {
            return entry.participant_id ? (
              <Link to={`/participant_r.aspx?id=${entry.participant_id}`}>{entry.name}</Link>
            ) : (
              entry.name
            );
          }
          if (col.key === 'country') {
            return <Link to={`/country_info.aspx?code=${entry.country_code}`}>{entry.country}</Link>;
          }
          if (col.key === 'award') {
            return <span className={`award-${entry.award?.toLowerCase().replace(/\s+/g, '-')}`}>{entry.award}</span>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row, idx) => `${(row as unknown as IndividualResult).participant_id || idx}`}
      />
    </div>
  );
}
