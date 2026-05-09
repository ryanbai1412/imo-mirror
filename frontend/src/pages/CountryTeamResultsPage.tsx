import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  loadCountryResultsByYear,
  loadCountries,
  type CountryResult,
  type Country,
} from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COLUMNS: Column[] = [
  { key: 'year', label: 'Year', align: 'right' },
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
  { key: 'deputy_leader', label: 'Deputy Leader' },
];

interface TeamRow extends CountryResult {
  year: number;
}

export default function CountryTeamResultsPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [country, setCountry] = useState<Country | null>(null);
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    Promise.all([loadCountryResultsByYear(), loadCountries()]).then(([results, countries]) => {
      setCountry(countries.find((c) => c.code === code) || null);
      const allRows: TeamRow[] = [];
      for (const [year, yearResults] of Object.entries(results)) {
        const match = yearResults.find((r) => r.code === code);
        if (match) {
          allRows.push({ ...match, year: Number(year) });
        }
      }
      allRows.sort((a, b) => b.year - a.year);
      setRows(allRows);
      setLoading(false);
    });
  }, [code]);

  const sortedRows = useMemo(() => {
    return column ? sortData(rows, column, order) : rows;
  }, [rows, column, order]);

  if (loading) return <Loading />;
  if (!code) return <div className="page-content"><h2>Please specify a country code</h2></div>;

  return (
    <div className="page-content">
      <SEO title={`${country?.name || code} — Team Results`} description={`IMO team results for ${country?.name || code}. Yearly rankings, scores, medal counts, and team leaders.`} path={`/country_team_r.aspx?code=${code}`} />
      <h2>
        {country?.flag_url && (
          <img src={`https://www.imo-official.org/${country.flag_url}`} alt={code} className="country-flag-large" />
        )}
        {country?.name || code} &mdash; Team Results
      </h2>
      <p className="page-subtitle">{rows.length} years of participation</p>
      <div className="table-container">
        <SortableTable
          columns={COLUMNS}
          data={sortedRows as unknown as Record<string, unknown>[]}
          currentSort={column}
          currentOrder={order}
          renderCell={(row, col) => {
            const entry = row as unknown as TeamRow;
            if (col.key === 'year') {
              return <Link to={`/year_country_r.aspx?year=${entry.year}`}>{entry.year}</Link>;
            }
            const val = row[col.key];
            return val != null ? String(val) : '';
          }}
          rowKey={(row) => String((row as unknown as TeamRow).year)}
        />
      </div>
    </div>
  );
}
