import { Link, useSearchParams } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Timeline', path: '/timeline.aspx' },
  { label: 'Countries', path: '/country_info.aspx' },
  { label: 'Results', path: '/results.aspx' },
  { label: 'Hall of Fame', path: '/hall_of_fame.aspx' },
  { label: 'Problems', path: '/problems.aspx' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
];

export default function Header() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get('language') || 'en';

  return (
    <header className="site-header">
      <div className="header-top">
        <Link to="/" className="site-logo">
          <h1>International Mathematical Olympiad</h1>
        </Link>
      </div>
      <nav className="main-nav">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <div className="language-selector">
          {LANGUAGES.map((lang) => (
            <span
              key={lang.code}
              className={`lang-option ${lang.code === currentLang ? 'active' : ''}`}
            >
              {lang.code === currentLang ? (
                <strong>{lang.code.toUpperCase()}</strong>
              ) : (
                <span>{lang.code.toUpperCase()}</span>
              )}
            </span>
          ))}
        </div>
      </nav>
    </header>
  );
}
