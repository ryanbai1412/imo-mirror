import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>
          Static mirror of{' '}
          <a href="https://www.imo-official.org" target="_blank" rel="noopener noreferrer">
            imo-official.org
          </a>
        </span>
        <div className="footer-links">
          <Link to="/general.aspx">About</Link>
          <Link to="/links.aspx">Links</Link>
          <Link to="/advisory.aspx">Board</Link>
          <Link to="/ethics.aspx">Ethics</Link>
          <Link to="/documents.aspx">Documents</Link>
        </div>
      </div>
    </footer>
  );
}
