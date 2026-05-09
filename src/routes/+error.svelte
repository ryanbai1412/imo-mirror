<script lang="ts">
  import { page } from "$app/state";
  import "$lib/styles/buttons.css";
</script>

<svelte:head>
  <title>{page.status === 404 ? "Page Not Found" : "Error"} | IMO Mirror</title>
  <meta
    name="description"
    content="The requested page was not found on IMO Mirror."
  />
</svelte:head>

<div
  class="flex min-h-[50vh] animate-[fadeIn_300ms_ease] flex-col items-center justify-center px-6 py-12 text-center"
>
  <span
    class="mb-1 font-display text-[96px] font-normal leading-none tracking-[-0.04em] text-navy opacity-12"
    >{page.status}</span
  >
  <h2
    class="mb-3 font-display text-[28px] font-normal tracking-[-0.01em] text-navy"
  >
    {page.status === 404 ? "Page Not Found" : "Something went wrong"}
  </h2>
  <p class="mb-7 max-w-[400px] text-[15px] leading-relaxed text-text-secondary">
    {page.error?.message ||
      "Sorry, the page you're looking for doesn't exist or may have been removed."}
  </p>
  <a href="/" class="btn btn-primary btn--pill gap-1.5"> ← Back to home </a>
</div>
