export const SITE_NAME = "IMO Mirror";
export const BASE_URL = "https://imo-mirror.org";
export const DEFAULT_DESCRIPTION =
  "Fast, static mirror of the International Mathematical Olympiad official website. Complete results, participant data, and problem archive from 1959 to present.";

export function breadcrumbJsonLd(
  items: { name: string; href: string }[]
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  });
}
