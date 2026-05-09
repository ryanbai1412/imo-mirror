import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadCountryResultsByYear, loadYearInfo, type CountryResult, type YearInfo } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COLUMNS: Column[] = [
  { key: 'country', label: 'Country' },
  { key: 'code', label: 'Code' },
  { key: 'team_size_all', label: '#', align: 'right' },
  { key: 'p1', label: 'P1', align: 'right' },
  { key: 'p2', label: 'P2', align: 'right' },
  { key: 'p3', label: 'P3', align: 'right' },
  { key: 'p4', label: 'P4', align: 'right' },
  { key: 'p5', label: 'P5', align: 'right' },
  { key: 'p6', label: 'P6', align: 'right' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'rank', label: 'Rank', align: 'right' },
  { key: 'awards_gold', label: 'G', align: 'right' },
  { key: 'awards_silver', label: 'S', align: 'right' },
  { key: 'awards_bronze', label: 'B', align: 'right' },
  { key: 'awards_hm', label: 'HM', align: 'right' },
  { key: 'leader', label: 'Leader' },
  { key: 'deputy_leader', label: 'Deputy leader' },
];

export default function YearCountryResultsPage() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get('year') || '';
  const [data, setData] = useState<CountryResult[]>([]);
  const [yearInfo, setYearInfo] = useState<YearInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    if (!year) { setLoading(false); return; }
    Promise.all([loadCountryResultsByYear(), loadYearInfo()]).then(([results, info]) => {
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
      <SEO title={`IMO ${year} — Country Results`} description={`Country team results for the ${year} International Mathematical Olympiad. Scores, ranks, and medal counts by country.`} path={`/year_country_r.aspx?year=${year}`} />
      <h2>Country results &mdash; IMO {year}</h2>

      <div className="year-nav">
        <Link to={`/year_country_r.aspx?year=${Number(year) - 1}`}>← Previous</Link>
        {' | '}
        <Link to={`/year_info.aspx?year=${year}`}>Year info</Link>
        {' | '}
        <Link to={`/year_individual_r.aspx?year=${year}`}>Individual results</Link>
        {' | '}
        <Link to={`/year_country_r.aspx?year=${Number(year) + 1}`}>Next →</Link>
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
          const entry = row as unknown as CountryResult;
          if (col.key === 'country') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{entry.country}</Link>;
          }
          if (col.key === 'code') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{entry.code}</Link>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as CountryResult).code)}
      />
    </div>
  );
}
