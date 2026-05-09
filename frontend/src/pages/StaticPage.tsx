import { useEffect, useState } from 'react';
import { loadStaticPages, type StaticPageData } from '../utils/data';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

interface StaticPageProps {
  pageKey: string;
}

export default function StaticPage({ pageKey }: StaticPageProps) {
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaticPages().then((pages) => {
      setPage(pages[pageKey] || null);
      setLoading(false);
    });
  }, [pageKey]);

  if (loading) return <Loading />;

  if (!page) {
    return (
      <div className="page-content">
        <h2>Page Not Found</h2>
      </div>
    );
  }

  return (
    <div className="page-content">
      <SEO title={page.title} description={`${page.title} — International Mathematical Olympiad official information and guidelines.`} path={`/${pageKey}.aspx`} />
      <h2>{page.title}</h2>
      <div
        className="static-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
