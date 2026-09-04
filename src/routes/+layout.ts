import "$lib/data-store";

// Just importing starts both import()s.
// Root layout runs on every page →
// both promises begin on first visit
// regardless of route.

// Prerender every page by default; query-param pages
// opt out with `prerender = false` in their +page.ts.
export const prerender = true;

export async function load() {
  return {};
}
