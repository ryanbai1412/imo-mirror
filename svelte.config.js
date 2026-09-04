import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Query-param pages (?year=, ?code=, ?id=) cannot be
      // prerendered. Cloudflare serves index.html for any
      // path that has no static asset, and the client
      // router renders the requested page.
      fallback: "index.html",
      precompress: false,
      strict: true,
    }),
    alias: {
      $lib: "./src/lib",
    },
  },
};

export default config;
