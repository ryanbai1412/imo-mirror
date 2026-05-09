import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  loadIndividualResultsByYear,
  loadCountries,
  type IndividualResult,
  type Country,
} from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COLUMNS: Column[] = [
  { key: 'year', label: 'Year', align: 'right' },
  { key: 'name', label: 'Contestant' },
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

interface IndivRow extends IndividualResult {
  year: number;
}

export default function CountryIndividualResultsPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [country, setCountry] = useState<Country | null>(null);
  const [rows, setRows] = useState<IndivRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    Promise.all([loadIndividualResultsByYear(), loadCountries()]).then(([results, countries]) => {
      setCountry(countries.find((c) => c.code === code) || null);
      const allRows: IndivRow[] = [];
      for (const [year, yearResults] of Object.entries(results)) {
        for (const r of yearResults) {
          if (r.country_code === code) {
            allRows.push({ ...r, year: Number(year) });
          }
        }
      }
      allRows.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
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
      <SEO title={`${country?.name || code} — Individual Results`} description={`All individual IMO results for ${country?.name || code}. Problem scores, totals, ranks, and awards for every contestant.`} path={`/country_individual_r.aspx?code=${code}`} />
      <h2>
        {country?.flag_url && (
          <img src={`https://www.imo-official.org/${country.flag_url}`} alt={code} className="country-flag-large" />
        )}
        {country?.name || code} &mdash; Individual Results
      </h2>
      <p className="page-subtitle">{rows.length} individual results</p>
      <div className="table-container">
        <SortableTable
          columns={COLUMNS}
          data={sortedRows as unknown as Record<string, unknown>[]}
          currentSort={column}
          currentOrder={order}
          renderCell={(row, col) => {
            const entry = row as unknown as IndivRow;
            if (col.key === 'year') {
              return <Link to={`/year_individual_r.aspx?year=${entry.year}`}>{entry.year}</Link>;
            }
            if (col.key === 'name') {
              return entry.participant_id ? (
                <Link to={`/participant_r.aspx?id=${entry.participant_id}`}>{entry.name}</Link>
              ) : entry.name;
            }
            if (col.key === 'award') {
              const cls = `award-${(entry.award || '').toLowerCase().replace(/\s+/g, '-')}`;
              return <span className={cls}>{entry.award}</span>;
            }
            const val = row[col.key];
            return val != null ? String(val) : '';
          }}
          rowKey={(_row, idx) => String(idx)}
        />
      </div>
    </div>
  );
}
