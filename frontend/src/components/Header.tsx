import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Timeline', path: '/organizers.aspx' },
  { label: 'Countries', path: '/countries.aspx' },
  { label: 'Results', path: '/results.aspx' },
  { label: 'Hall of Fame', path: '/hall.aspx' },
  { label: 'Problems', path: '/problems.aspx' },
  { label: 'About', path: '/general.aspx' },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="site-logo">
          <span className="logo-icon">I</span>
          <h1>International Mathematical Olympiad</h1>
        </Link>
        <nav className="main-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/search.aspx" className="header-search-link">Search</Link>
        </nav>
      </div>
    </header>
  );
}
