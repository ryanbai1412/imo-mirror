import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadProblems, type ProblemYear } from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const COLUMNS: Column[] = [
  { key: 'year', label: 'Year', align: 'right' },
  { key: 'languages', label: 'Languages' },
  { key: 'pdf_url', label: 'Problems', sortable: false },
  { key: 'shortlist_url', label: 'Shortlist', sortable: false },
];

export default function ProblemsPage() {
  const [data, setData] = useState<ProblemYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    loadProblems().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const sorted = column ? sortData(data, column, order) : data;

  return (
    <div className="page-content">
      <SEO title="Problems" description="Archive of all International Mathematical Olympiad problems from 1959 to present. PDF downloads and shortlists available in multiple languages." path="/problems.aspx" />
      <h2>Problems</h2>

      <SortableTable
        columns={COLUMNS}
        data={sorted as unknown as Record<string, unknown>[]}
        currentSort={column}
        currentOrder={order}
        renderCell={(row, col) => {
          const entry = row as unknown as ProblemYear;
          if (col.key === 'year') {
            return <Link to={`/year_info.aspx?year=${entry.year}`}>{entry.year}</Link>;
          }
          if (col.key === 'languages') {
            return entry.languages?.join(', ') || '';
          }
          if (col.key === 'pdf_url') {
            return entry.pdf_url ? (
              <a href={`https://www.imo-official.org/${entry.pdf_url}`} target="_blank" rel="noopener noreferrer">
                PDF
              </a>
            ) : null;
          }
          if (col.key === 'shortlist_url') {
            return entry.shortlist_url ? (
              <a href={`https://www.imo-official.org/${entry.shortlist_url}`} target="_blank" rel="noopener noreferrer">
                Shortlist
              </a>
            ) : null;
          }
          const val = row[col.key];
          return val != null ? String(val) : '';
        }}
        rowKey={(row) => String((row as unknown as ProblemYear).year)}
      />
    </div>
  );
}
