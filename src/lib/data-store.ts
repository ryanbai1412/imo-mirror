// Module-scope promises — start loading the moment
// this module is imported. Vite code-splits these
// into separate hashed chunks automatically.

import type { IndividualResult, CountryResult } from "./utils/data";

export const individualResults =
  import("./data/massive/individual_results_by_year.json").then(
    (m) => m.default as Record<string, IndividualResult[]>
  );

export const countryResults =
  import("./data/massive/country_results_by_year.json").then(
    (m) => m.default as Record<string, CountryResult[]>
  );
