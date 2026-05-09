import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadYearInfo, loadTimeline, type YearInfo, type TimelineEntry } from '../utils/data';
import Loading from '../components/Loading';
import SEO, { BASE_URL } from '../components/SEO';

export default function YearInfoPage() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get('year') || '';
  const [info, setInfo] = useState<YearInfo | null>(null);
  const [timelineEntry, setTimelineEntry] = useState<TimelineEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) {
      setLoading(false);
      return;
    }
    Promise.all([loadYearInfo(), loadTimeline()]).then(([yearInfo, timeline]) => {
      setInfo(yearInfo[year] || null);
      setTimelineEntry(timeline.find((t) => t.year === Number(year)) || null);
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

  return (
    <div className="page-content">
      <SEO
        title={`IMO ${year}${timelineEntry ? ` — ${timelineEntry.city}, ${timelineEntry.country}` : ''}`}
        description={`Results and information for the ${year} International Mathematical Olympiad.${info ? ` ${info.num_countries ?? ''} countries, ${info.num_contestants ?? ''} contestants.` : ''}`}
        path={`/year_info.aspx?year=${year}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: `International Mathematical Olympiad ${year}`,
          description: `The ${year} International Mathematical Olympiad${timelineEntry ? ` held in ${timelineEntry.city}, ${timelineEntry.country}` : ''}`,
          ...(timelineEntry?.date ? { startDate: timelineEntry.date } : {}),
          ...(timelineEntry ? { location: { '@type': 'Place', name: `${timelineEntry.city}, ${timelineEntry.country}` } } : {}),
          organizer: { '@type': 'Organization', name: 'International Mathematical Olympiad' },
          url: `${BASE_URL}/year_info.aspx?year=${year}`,
        }}
      />
      <h2>
        IMO {year}
        {timelineEntry && ` — ${timelineEntry.city}, ${timelineEntry.country}`}
      </h2>

      {timelineEntry?.date && <p className="year-date">{timelineEntry.date}</p>}

      <div className="year-nav">
        <Link to={`/year_info.aspx?year=${Number(year) - 1}`}>← Previous</Link>
        {' | '}
        <Link to="/organizers.aspx">Timeline</Link>
        {' | '}
        <Link to={`/year_info.aspx?year=${Number(year) + 1}`}>Next →</Link>
      </div>

      {info && (
        <div className="year-info-grid">
          <table className="info-table">
            <tbody>
              <tr><td>Countries</td><td>{info.num_countries ?? '—'}</td></tr>
              <tr><td>Contestants</td><td>{info.num_contestants ?? '—'}</td></tr>
              <tr>
                <td>Gold medals</td>
                <td>{info.gold_count ?? '—'} (cutoff: {info.gold_cutoff ?? '—'})</td>
              </tr>
              <tr>
                <td>Silver medals</td>
                <td>{info.silver_count ?? '—'} (cutoff: {info.silver_cutoff ?? '—'})</td>
              </tr>
              <tr>
                <td>Bronze medals</td>
                <td>{info.bronze_count ?? '—'} (cutoff: {info.bronze_cutoff ?? '—'})</td>
              </tr>
              <tr><td>Honourable mentions</td><td>{info.hm_count ?? '—'}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="year-links">
        <h3>Results</h3>
        <ul>
          <li><Link to={`/year_country_r.aspx?year=${year}`}>Country results</Link></li>
          <li><Link to={`/year_individual_r.aspx?year=${year}`}>Individual results</Link></li>
          <li><Link to={`/year_statistics.aspx?year=${year}`}>Statistics</Link></li>
        </ul>
      </div>

      {info?.problem_languages && info.problem_languages.length > 0 && (
        <div className="year-links">
          <h3>Problems</h3>
          <p>
            Available in: {info.problem_languages.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
