import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadTimeline, type TimelineEntry } from '../utils/data';
import Loading from '../components/Loading';
import SEO, { BASE_URL } from '../components/SEO';

export default function HomePage() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline().then((data) => {
      setTimeline(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const latest = timeline.find((t) => t.contestants_all && t.contestants_all > 0);

  return (
    <>
      <SEO
        title="International Mathematical Olympiad"
        description="Fast, static mirror of the International Mathematical Olympiad official website. Complete results, 15,000+ participants, and problems archive from 1959 to present."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'IMO Mirror — International Mathematical Olympiad',
          url: BASE_URL,
          description: 'Fast, static mirror of the International Mathematical Olympiad official website. Complete results, participant data, and problem archive from 1959 to present.',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/search.aspx?name={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <section className="hero">
        <h2>International Mathematical Olympiad</h2>
        <p>
          The world championship mathematics competition for high school students,
          held annually since 1959.
        </p>
        {latest && (
          <div className="hero-cta">
            <Link to={`/year_info.aspx?year=${latest.year}`} className="btn btn-gold">
              IMO {latest.year} — {latest.city}, {latest.country}
            </Link>
          </div>
        )}
      </section>

      <div className="page-content">
        {latest && (
          <div className="home-latest card">
            <h3>Latest: IMO {latest.year}</h3>
            {latest.date && <p className="text-secondary">{latest.date}</p>}
            <p>
              {latest.num_countries} countries &middot; {latest.contestants_all} contestants
            </p>
            <div className="home-links">
              <Link to={`/year_country_r.aspx?year=${latest.year}`}>Country Results</Link>
              <Link to={`/year_individual_r.aspx?year=${latest.year}`}>Individual Results</Link>
              <Link to={`/year_statistics.aspx?year=${latest.year}`}>Statistics</Link>
            </div>
          </div>
        )}

        <div className="home-grid">
          <Link to="/organizers.aspx" className="home-card card">
            <h3>Timeline</h3>
            <p>Every IMO from 1959 to today</p>
          </Link>
          <Link to="/countries.aspx" className="home-card card">
            <h3>Countries</h3>
            <p>{timeline.length > 0 ? '100+' : ''} participating nations</p>
          </Link>
          <Link to="/results.aspx" className="home-card card">
            <h3>Results</h3>
            <p>Comprehensive results by country and year</p>
          </Link>
          <Link to="/hall.aspx" className="home-card card">
            <h3>Hall of Fame</h3>
            <p>Top performers in IMO history</p>
          </Link>
          <Link to="/problems.aspx" className="home-card card">
            <h3>Problems</h3>
            <p>All competition problems and solutions</p>
          </Link>
          <Link to="/search.aspx" className="home-card card">
            <h3>Search</h3>
            <p>Find any participant by name</p>
          </Link>
        </div>
      </div>
    </>
  );
}
