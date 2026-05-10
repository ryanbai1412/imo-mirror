export const resultsNavItems = [
  { label: "By Country", href: "/results_country.aspx" },
  { label: "By Year", href: "/results_year.aspx" },
  {
    label: "Results Matrix",
    shortLabel: "Matrix",
    href: "/results_matrix.aspx",
  },
];

export function countryNavItems(code: string) {
  return [
    { label: "Overview", href: `/country_info.aspx?code=${code}` },
    {
      label: "Individual Results",
      shortLabel: "Individuals",
      href: `/country_individual_r.aspx?code=${code}`,
    },
    {
      label: "Team Results",
      shortLabel: "Team",
      href: `/country_team_r.aspx?code=${code}`,
    },
    {
      label: "Hall of Fame",
      href: `/country_hall.aspx?code=${code}`,
    },
  ];
}

export function yearNavItems(year: string | number) {
  return [
    { label: "Overview", href: `/year_info.aspx?year=${year}` },
    {
      label: "Country Results",
      shortLabel: "Countries",
      href: `/year_country_r.aspx?year=${year}`,
    },
    {
      label: "Individual Results",
      shortLabel: "Individuals",
      href: `/year_individual_r.aspx?year=${year}`,
    },
    {
      label: "Statistics",
      href: `/year_statistics.aspx?year=${year}`,
    },
  ];
}
