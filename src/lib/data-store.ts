// Module-scope promises — start loading the moment
// this module is imported. Vite code-splits these
// into separate hashed chunks automatically.

export const individualResults = import(
	'./data/massive/individual_results_by_year.json'
).then((m) => m.default as Record<string, unknown[]>);

export const countryResults = import(
	'./data/massive/country_results_by_year.json'
).then((m) => m.default as Record<string, unknown[]>);
