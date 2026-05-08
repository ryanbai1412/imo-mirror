import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadResultsMatrix, loadTimeline, type ResultsMatrixData, type TimelineEntry } from '../utils/data';
import Loading from '../components/Loading';

export default function ResultsMatrixPage() {
  const [matrix, setMatrix] = useState<ResultsMatrixData>({});
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    Promise.all([loadResultsMatrix(), loadTimeline()]).then(([m, tl]) => {
      setMatrix(m);
      setTimeline(tl);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const years = timeline
    .filter((t) => t.contestants_all && t.contestants_all > 0)
    .map((t) => t.year)
    .sort((a, b) => b - a);

  const codes = Object.keys(matrix).sort();
  const filterCode = searchParams.get('code') || '';

  const filteredCodes = filterCode
    ? codes.filter((c) => c === filterCode)
    : codes;

  return (
    <div className="page-content">
      <h2>Results Matrix</h2>
      <p>
        <Link to="/results.aspx">← Back to Results</Link>
      </p>

      <div className="matrix-container">
        <table className="data-table matrix-table">
          <thead>
            <tr>
              <th className="sticky-col">Country</th>
              {years.map((y) => (
                <th key={y} className="text-right matrix-year">
                  <Link to={`/year_info.aspx?year=${y}`}>{String(y).slice(2)}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((code) => {
              const entry = matrix[code];
              return (
                <tr key={code}>
                  <td className="sticky-col">
                    <Link to={`/country_info.aspx?code=${code}`}>
                      {code}
                    </Link>
                  </td>
                  {years.map((y) => {
                    const rank = entry?.years?.[String(y)];
                    return (
                      <td key={y} className="text-right matrix-cell">
                        {rank != null ? rank : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
