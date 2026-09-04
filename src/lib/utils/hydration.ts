import { browser, building } from "$app/environment";

let hydrated = false;

/** Called once from the root layout after the first client render. */
export function markHydrated() {
  hydrated = true;
}

/**
 * True while producing markup that must match the prerendered
 * HTML byte-for-byte: at build time, and on the client during
 * the initial hydration pass (Svelte does not re-apply `src`
 * and similar attributes when hydrating, so any mismatch with
 * the static HTML would leave stale images on the page).
 */
export function isStaticRender() {
  return building || (browser && !hydrated);
}
