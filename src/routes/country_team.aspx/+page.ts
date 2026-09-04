import { redirect } from "@sveltejs/kit";
export const prerender = false;
export function load({ url }) {
  const qs = url.search;
  redirect(301, `/country_team_r.aspx${qs}`);
}
