import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadYearStatistics, type YearStatistics } from '../utils/data';
import Loading from '../components/Loading';

export default function YearStatisticsPage() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get('year') || '';
  const [stats, setStats] = useState<YearStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) { setLoading(false); return; }
    loadYearStatistics().then((data) => {
      setStats(data[year] || null);
      setLoading(false);
    });
  }, [year]);

  if (loading) return <Loading />;

  if (!year) {
    return (
      <div className="page-content">
        <h2>Please select a year</h2>
        <p><Link to="/timeline.aspx">View timeline</Link></p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page-content">
        <h2>No statistics available for {year}</h2>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2>Statistics &mdash; IMO {year}</h2>

      <div className="year-nav">
        <Link to={`/year_statistics.aspx?year=${Number(year) - 1}`}>← Previous</Link>
        {' | '}
        <Link to={`/year_info.aspx?year=${year}`}>Year info</Link>
        {' | '}
        <Link to={`/year_country_r.aspx?year=${year}`}>Country results</Link>
        {' | '}
        <Link to={`/year_individual_r.aspx?year=${year}`}>Individual results</Link>
        {' | '}
        <Link to={`/year_statistics.aspx?year=${Number(year) + 1}`}>Next →</Link>
      </div>

      {stats.problems && stats.problems.length > 0 && (
        <div>
          <h3>Score Distribution by Problem</h3>
          {stats.problems.map((problem) => (
            <div key={problem.number} className="problem-stats">
              <h4>Problem {problem.number}</h4>
              {problem.avg != null && <p>Average: {problem.avg.toFixed(2)}</p>}
              {problem.distribution && Object.keys(problem.distribution).length > 0 && (
                <table className="data-table stats-table">
                  <thead>
                    <tr>
                      <th>Score</th>
                      {Object.keys(problem.distribution).sort((a, b) => Number(a) - Number(b)).map((score) => (
                        <th key={score} className="text-right">{score}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td># Students</td>
                      {Object.entries(problem.distribution).sort(([a], [b]) => Number(a) - Number(b)).map(([score, count]) => (
                        <td key={score} className="text-right">{count}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
