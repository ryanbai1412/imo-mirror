import '$lib/data-store';

// Just importing starts both import()s.
// Root layout runs on every page →
// both promises begin on first visit
// regardless of route.

export async function load() {
	return {};
}
