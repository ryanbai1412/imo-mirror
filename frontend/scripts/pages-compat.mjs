/**
 * Post-build script: restructure Astro's Cloudflare Workers output
 * into Cloudflare Pages-compatible format.
 *
 * Astro + @astrojs/cloudflare outputs:
 *   dist/client/  (static assets)
 *   dist/server/  (Worker entry + chunks)
 *
 * Cloudflare Pages expects:
 *   <output_dir>/            (static assets)
 *   <output_dir>/_worker.js/ (Worker as a directory with index.js entry)
 *
 * This script copies server/ into client/_worker.js/ so the Pages
 * output directory can be set to dist/client.
 */
import { cpSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "..", "dist");
const serverDir = resolve(dist, "server");
const workerDir = resolve(dist, "client", "_worker.js");

// Copy entire server/ into client/_worker.js/
mkdirSync(workerDir, { recursive: true });
cpSync(serverDir, workerDir, { recursive: true });

// Create index.js entry that re-exports the server entry
writeFileSync(
  resolve(workerDir, "index.js"),
  `export { default } from "./entry.mjs";\n`
);

console.log("pages-compat: created _worker.js directory in dist/client/");
