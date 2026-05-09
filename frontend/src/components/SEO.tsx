import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = 'IMO Mirror';
const DEFAULT_DESCRIPTION = 'Fast, static mirror of the International Mathematical Olympiad official website. Complete results, participant data, and problem archive from 1959 to present.';
const BASE_URL = 'https://imo-mirror.org';

export { SITE_NAME, BASE_URL };

export default function SEO({ title, description, path, jsonLd }: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — International Mathematical Olympiad`;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = path ? `${BASE_URL}${path}` : undefined;

  const defaultJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search.aspx?name={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const structuredData = jsonLd || defaultJsonLd;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
