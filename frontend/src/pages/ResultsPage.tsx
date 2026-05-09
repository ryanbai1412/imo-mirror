import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadResultsCountry, loadResultsYear, type ResultsCountryEntry, type ResultsYearEntry } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COUNTRY_COLUMNS: Column[] = [
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

const YEAR_COLUMNS: Column[] = [
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

type ViewMode = 'country' | 'year';

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') || 'country') as ViewMode;
  const [countryData, setCountryData] = useState<ResultsCountryEntry[]>([]);
  const [yearData, setYearData] = useState<ResultsYearEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    Promise.all([loadResultsCountry(), loadResultsYear()]).then(([countries, years]) => {
      setCountryData(countries);
      setYearData(years);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  function switchView(v: ViewMode) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('view', v);
      params.delete('column');
      params.delete('order');
      return params;
    });
  }

  if (view === 'year') {
    const sorted = column ? sortData(yearData, column, order) : yearData;
    return (
      <div className="page-content">
        <SEO title="Results by Year" description="IMO results by year. Medal counts, cutoff scores, and participation statistics for every International Mathematical Olympiad." path="/results.aspx?view=year" />
        <h2>Results</h2>
        <div className="view-toggle">
          <button onClick={() => switchView('country')}>By Country</button>
          <button className="active" onClick={() => switchView('year')}>By Year</button>
          <Link to="/results_matrix.aspx">Results Matrix</Link>
        </div>
        <SortableTable
          columns={YEAR_COLUMNS}
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

  const sorted = column ? sortData(countryData, column, order) : countryData;
  return (
    <div className="page-content">
      <SEO title="Results by Country" description="IMO results by country. Medal totals, participation history, and rankings for all countries in the International Mathematical Olympiad." path="/results.aspx" />
      <h2>Results</h2>
      <div className="view-toggle">
        <button className="active" onClick={() => switchView('country')}>By Country</button>
        <button onClick={() => switchView('year')}>By Year</button>
        <Link to="/results_matrix.aspx">Results Matrix</Link>
      </div>
      <SortableTable
        columns={COUNTRY_COLUMNS}
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
