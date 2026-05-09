/// <reference types="astro/client" />

declare module "cloudflare:workers" {
  const env: {
    ASSETS?: { fetch: typeof fetch };
  };
}
