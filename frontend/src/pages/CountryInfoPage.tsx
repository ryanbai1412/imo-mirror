import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  loadCountries,
  loadCountryResultsByYear,
  loadIndividualResultsByYear,
  loadTimeline,
  type Country,
  type CountryResult,
  type IndividualResult,
  type TimelineEntry,
} from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';

const YEAR_COLUMNS: Column[] = [
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
];

const INDIVIDUAL_COLUMNS: Column[] = [
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

interface YearRow extends CountryResult {
  year: number;
}

interface IndividualRow extends IndividualResult {
  year: number;
}

export default function CountryInfoPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [country, setCountry] = useState<Country | null>(null);
  const [yearRows, setYearRows] = useState<YearRow[]>([]);
  const [individualRows, setIndividualRows] = useState<IndividualRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    Promise.all([
      loadCountries(),
      loadCountryResultsByYear(),
      loadIndividualResultsByYear(),
      loadTimeline(),
    ]).then(([countries, countryResults, individualResults, tl]) => {
      const c = countries.find((x) => x.code === code);
      setCountry(c || null);
      setTimeline(tl);

      const yrs: YearRow[] = [];
      for (const [year, results] of Object.entries(countryResults)) {
        const match = results.find((r) => r.code === code);
        if (match) {
          yrs.push({ ...match, year: Number(year) });
        }
      }
      yrs.sort((a, b) => b.year - a.year);
      setYearRows(yrs);

      const indivs: IndividualRow[] = [];
      for (const [year, results] of Object.entries(individualResults)) {
        for (const r of results) {
          if (r.country_code === code) {
            indivs.push({ ...r, year: Number(year) });
          }
        }
      }
      indivs.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
      setIndividualRows(indivs);

      setLoading(false);
    });
  }, [code]);

  if (!code) {
    return <CountriesListRedirect />;
  }

  if (loading) return <Loading />;

  if (!country) {
    return (
      <div className="page-content">
        <h2>Country not found: {code}</h2>
      </div>
    );
  }

  const sortedYears = column
    ? sortData(yearRows, column, order)
    : yearRows;

  const hostYears = timeline.filter(
    (t) => country.host_years?.includes(t.year)
  );

  return (
    <div className="page-content">
      <h2>
        {country.flag_url && (
          <img
            src={`https://www.imo-official.org/${country.flag_url}`}
            alt={country.code}
            className="country-flag-large"
          />
        )}{' '}
        {country.name} ({country.code})
      </h2>

      {country.contact && <p><strong>Contact:</strong> {country.contact}</p>}
      {country.website && (
        <p>
          <strong>Website:</strong>{' '}
          <a href={country.website} target="_blank" rel="noopener noreferrer">
            {country.website}
          </a>
        </p>
      )}

      {hostYears.length > 0 && (
        <p>
          <strong>Host:</strong>{' '}
          {hostYears.map((h) => (
            <span key={h.year}>
              <Link to={`/year_info.aspx?year=${h.year}`}>{h.year}</Link>
              {' '}
            </span>
          ))}
        </p>
      )}

      <h3>Results by Year</h3>
      <SortableTable
        columns={YEAR_COLUMNS}
        data={sortedYears as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as YearRow;
          if (col.key === 'year') {
            return <Link to={`/year_country_r.aspx?year=${entry.year}`}>{entry.year}</Link>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as YearRow).year)}
      />

      <h3>Individual Results</h3>
      <SortableTable
        columns={INDIVIDUAL_COLUMNS}
        data={individualRows as unknown as Record<string, unknown>[]}
        currentSort=""
        currentOrder="asc"
        renderCell={(row, col) => {
          const entry = row as unknown as IndividualRow;
          if (col.key === 'year') {
            return <Link to={`/year_individual_r.aspx?year=${entry.year}`}>{entry.year}</Link>;
          }
          if (col.key === 'name') {
            return entry.participant_id ? (
              <Link to={`/participant_r.aspx?id=${entry.participant_id}`}>{entry.name}</Link>
            ) : (
              entry.name
            );
          }
          if (col.key === 'award') {
            return <span className={`award-${entry.award?.toLowerCase().replace(/\s+/g, '-')}`}>{entry.award}</span>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row, idx) => `${(row as unknown as IndividualRow).year}-${idx}`}
      />
    </div>
  );
}

function CountriesListRedirect() {
  return <CountriesPageInline />;
}

// Inline countries list when no code is specified
import { loadCountries as loadC } from '../utils/data';

function CountriesPageInline() {
  const [data, setData] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadC().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column ? sortData(data, column, order) : data;

  const cols: Column[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Country' },
  ];

  return (
    <div className="page-content">
      <h2>Participating Countries</h2>
      <SortableTable
        columns={cols}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as Country;
          if (col.key === 'code' || col.key === 'name') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{col.key === 'code' ? entry.code : entry.name}</Link>;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as Country).code)}
      />
    </div>
  );
}
