import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadTimeline, type TimelineEntry } from '../utils/data';
import Loading from '../components/Loading';

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

  // Find the most recent IMO with data
  const latest = timeline.find((t) => t.contestants_all && t.contestants_all > 0);

  return (
    <div className="page-content">
      <h2>International Mathematical Olympiad</h2>
      <div className="home-intro">
        <p>
          The International Mathematical Olympiad (IMO) is the World Championship Mathematics
          Competition for High School students and is held annually in a different country.
        </p>
        <p>
          The first IMO was held in 1959 in Romania, with 7 countries participating. It has
          gradually expanded to over 100 countries from 5 continents.
        </p>
      </div>

      {latest && (
        <div className="home-latest">
          <h3>
            <Link to={`/year_info.aspx?year=${latest.year}`}>
              IMO {latest.year} &mdash; {latest.city}, {latest.country}
            </Link>
          </h3>
          {latest.date && <p>{latest.date}</p>}
          <p>
            {latest.num_countries} countries, {latest.contestants_all} contestants
          </p>
          <ul className="home-links">
            <li>
              <Link to={`/year_country_r.aspx?year=${latest.year}`}>Country results</Link>
            </li>
            <li>
              <Link to={`/year_individual_r.aspx?year=${latest.year}`}>Individual results</Link>
            </li>
            <li>
              <Link to={`/year_statistics.aspx?year=${latest.year}`}>Statistics</Link>
            </li>
          </ul>
        </div>
      )}

      <div className="home-sections">
        <h3>Explore</h3>
        <ul className="home-links">
          <li><Link to="/timeline.aspx">Timeline of all IMOs</Link></li>
          <li><Link to="/country_info.aspx">Participating countries</Link></li>
          <li><Link to="/results.aspx">Results overview</Link></li>
          <li><Link to="/hall_of_fame.aspx">Hall of Fame</Link></li>
          <li><Link to="/problems.aspx">Problems</Link></li>
        </ul>
      </div>
    </div>
  );
}
