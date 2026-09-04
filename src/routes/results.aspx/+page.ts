import { redirect } from "@sveltejs/kit";
export function load() {
  redirect(301, "/results_country.aspx");
}
