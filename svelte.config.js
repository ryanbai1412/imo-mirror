import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ["/*"],
        exclude: [
          "/_app/immutable/*",
          "/_app/version.json",
          "/flags/*",
          "/favicon.ico",
          "/favicon-16.png",
          "/favicon-32.png",
          "/apple-touch-icon.png",
          "/imo-logo.webp",
          "/robots.txt",
          "/sitemap.xml",
        ],
      },
    }),
    alias: {
      $lib: "./src/lib",
    },
  },
};

export default config;
