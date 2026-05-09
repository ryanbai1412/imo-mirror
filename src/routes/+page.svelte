<script lang="ts">
  import { DEFAULT_DESCRIPTION, BASE_URL } from "$lib/utils/seo";
  import { loadTimeline } from "$lib/utils/data";
  import LinkCard from "$lib/components/LinkCard.svelte";
  import "$lib/styles/buttons.css";

  const timeline = loadTimeline();
  const latest =
    timeline.find((t) => t.contestants_all != null && t.contestants_all > 0) ??
    timeline[0];
  const totalEditions = timeline.length;
  const totalCountries = new Set(timeline.flatMap((t) => [t.country])).size;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "IMO Mirror",
    url: BASE_URL,
    description:
      "Fast, static mirror of the International Mathematical Olympiad official website.",
  });
</script>

<svelte:head>
  <title>IMO Mirror — International Mathematical Olympiad</title>
  <meta name="description" content={DEFAULT_DESCRIPTION} />
  <link rel="canonical" href={BASE_URL} />
  <meta
    property="og:title"
    content="IMO Mirror — International Mathematical Olympiad"
  />
  <meta property="og:description" content={DEFAULT_DESCRIPTION} />
  <meta property="og:url" content={BASE_URL} />
  <meta
    name="twitter:title"
    content="IMO Mirror — International Mathematical Olympiad"
  />
  <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
  {@html `<script type="application/ld+json">${jsonLd}</` + "script>"}
</svelte:head>

<div class="page-content">
  <div
    class="relative mb-8 overflow-hidden rounded-[var(--radius-default)] bg-gradient-to-br from-navy to-navy-light px-5 py-7 text-white md:px-9 md:py-10"
  >
    <div
      class="pointer-events-none absolute -top-[40%] -right-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_70%)]"
    ></div>
    <h1
      class="relative mb-2 font-display text-[26px] font-normal text-white md:text-4xl"
    >
      International Mathematical Olympiad
    </h1>
    <p class="mb-5 text-[15px] text-white/65">
      The oldest and most prestigious mathematical competition for high school
      students
    </p>
    <div class="mb-5 flex gap-6">
      <div class="flex flex-col">
        <span class="font-display text-2xl font-normal text-gold-light"
          >{totalEditions}</span
        >
        <span class="text-xs uppercase tracking-[0.05em] text-white/50"
          >Editions</span
        >
      </div>
      {#if latest}
        <div class="flex flex-col">
          <span class="font-display text-2xl font-normal text-gold-light"
            >{latest.year}</span
          >
          <span class="text-xs uppercase tracking-[0.05em] text-white/50"
            >Latest</span
          >
        </div>
      {/if}
      <div class="flex flex-col">
        <span class="font-display text-2xl font-normal text-gold-light"
          >{totalCountries}+</span
        >
        <span class="text-xs uppercase tracking-[0.05em] text-white/50"
          >Host Countries</span
        >
      </div>
    </div>
    <div class="flex flex-wrap gap-2.5">
      {#if latest}<a
          href="/year_info.aspx?year={latest.year}"
          class="btn btn--pill btn--ghost">Latest IMO {latest.year} &rarr;</a
        >{/if}
      <a href="/organizers.aspx" class="btn btn--pill btn--ghost"
        >Full Timeline &rarr;</a
      >
      <a href="/results_country.aspx" class="btn btn--pill btn--ghost"
        >All Results &rarr;</a
      >
    </div>
  </div>

  <div class="notice notice--warning">
    <p>
      This site is an <strong>unofficial mirror</strong> of the
      <a
        href="https://www.imo-official.org"
        target="_blank"
        rel="noopener noreferrer">official IMO website</a
      >. All data is sourced from
      <a
        href="https://www.imo-official.org"
        target="_blank"
        rel="noopener noreferrer">imo-official.org</a
      > and is provided here as a fast, static archive. For authoritative information,
      please visit the official site.
    </p>
  </div>

  <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <LinkCard
      href="/organizers.aspx"
      title="Timeline"
      description="Browse every IMO from 1959 to present. Host cities, dates, and participation statistics."
    />
    <LinkCard
      href="/countries.aspx"
      title="Countries"
      description="Explore participating nations, their contact information, and hosting history."
    />
    <LinkCard
      href="/results_country.aspx"
      title="Results"
      description="Comprehensive results by country and year. Medal counts, rankings, and statistics."
    />
    <LinkCard
      href="/hall.aspx"
      title="Hall of Fame"
      description="Top performers across all IMOs. Gold medalists, perfect scorers, and record holders."
    />
  </div>
</div>

<style>
  .notice {
    border-radius: var(--radius-default);
    padding: 14px 20px;
    margin-bottom: 24px;
    font-size: 13px;
    line-height: 1.7;
  }
  .notice a {
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .notice--warning {
    background: var(--color-warning-bg);
    border: 1px solid var(--color-warning-border);
    border-left: 4px solid var(--color-warning-accent);
    color: var(--color-warning-text);
  }
  .notice--warning a {
    color: var(--color-warning-link);
  }
  .notice--warning a:hover {
    color: var(--color-warning-link-hover);
  }
</style>
