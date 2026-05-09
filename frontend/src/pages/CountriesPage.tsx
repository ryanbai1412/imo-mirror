import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadCountries, type Country } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COLUMNS: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'flag', label: '', sortable: false },
  { key: 'name', label: 'Country' },
  { key: 'contact', label: 'Contact' },
  { key: 'website', label: 'Website', sortable: false },
];

export default function CountriesPage() {
  const [data, setData] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadCountries().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column ? sortData(data, column, order) : data;

  return (
    <div className="page-content">
      <SEO title="Participating Countries" description="All countries that have participated in the International Mathematical Olympiad. Contact information and national math olympiad websites." path="/countries.aspx" />
      <h2>Participating Countries</h2>
      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as Country;
          if (col.key === 'code') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{entry.code}</Link>;
          }
          if (col.key === 'flag') {
            return entry.flag_url ? (
              <img
                src={`https://www.imo-official.org/${entry.flag_url}`}
                alt={entry.code}
                className="country-flag"
              />
            ) : null;
          }
          if (col.key === 'name') {
            return <Link to={`/country_info.aspx?code=${entry.code}`}>{entry.name}</Link>;
          }
          if (col.key === 'website') {
            return entry.website ? (
              <a href={entry.website} target="_blank" rel="noopener noreferrer">
                Website
              </a>
            ) : null;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as Country).code)}
      />
    </div>
  );
}
