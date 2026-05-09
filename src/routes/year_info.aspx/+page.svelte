<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import InfoGrid from "$lib/components/InfoGrid.svelte";
  import { yearNavItems } from "$lib/utils/nav";
  import { formatDate } from "$lib/utils/data";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>IMO {data.year} | IMO Mirror</title>
  <meta
    name="description"
    content="IMO {data.year} held in {data.entry?.city || ''}, {data.entry
      ?.country || ''}. {data.info?.num_contestants ||
      ''} contestants from {data.info?.num_countries || ''} countries."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/year_info.aspx?year={data.year}"
  />
  <meta property="og:title" content="IMO {data.year} | IMO Mirror" />
  <meta
    property="og:description"
    content="IMO {data.year} held in {data.entry?.city || ''}, {data.entry
      ?.country || ''}. {data.info?.num_contestants ||
      ''} contestants from {data.info?.num_countries || ''} countries."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/year_info.aspx?year={data.year}"
  />
  <meta name="twitter:title" content="IMO {data.year} | IMO Mirror" />
  <meta
    name="twitter:description"
    content="IMO {data.year} held in {data.entry?.city || ''}, {data.entry
      ?.country || ''}. {data.info?.num_contestants ||
      ''} contestants from {data.info?.num_countries || ''} countries."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Timeline", href: "/organizers.aspx" }, { name: `IMO ${data.year}`, href: `/year_info.aspx?year=${data.year}` }])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="IMO {data.year}"
    navItems={yearNavItems(data.year)}
    currentPath="/year_info.aspx?year={data.year}"
    prevHref={data.prevYear
      ? `/year_info.aspx?year=${data.prevYear.year}`
      : undefined}
    nextHref={data.nextYear
      ? `/year_info.aspx?year=${data.nextYear.year}`
      : undefined}
  />

  {#if data.entry}
    <InfoGrid grouped>
      <h3>General Information</h3>
      <div class="info-grid">
        <span class="info-label">Edition</span><span class="info-value"
          >{data.entry.edition}</span
        >
        <span class="info-label">Location</span><span class="info-value"
          >{data.entry.city}, {data.entry.country}</span
        >
        <span class="info-label">Date</span><span class="info-value"
          >{formatDate(data.entry.date)}</span
        >
        {#if data.info?.num_countries}<span class="info-label">Countries</span
          ><span class="info-value">{data.info.num_countries}</span>{/if}
        {#if data.info?.num_contestants}<span class="info-label"
            >Contestants</span
          ><span class="info-value">{data.info.num_contestants}</span>{/if}
        {#if data.info?.homepage}<span class="info-label">Homepage</span><span
            class="info-value"
            ><a
              href={data.info.homepage}
              target="_blank"
              rel="noopener noreferrer">{data.info.homepage}</a
            ></span
          >{/if}
      </div>

      {#if data.info?.gold_count != null || data.info?.silver_count != null || data.info?.bronze_count != null || data.info?.hm_count != null}
        <h3>Awards</h3>
        <div class="info-grid">
          {#if data.info?.gold_count != null}<span
              class="info-label text-medal-gold">Gold</span
            ><span class="info-value text-medal-gold"
              >{data.info.gold_count}{#if data.info.gold_cutoff != null}
                <span class="font-normal text-text-secondary"
                  >(≥ {data.info.gold_cutoff} pts)</span
                >{/if}</span
            >{/if}
          {#if data.info?.silver_count != null}<span
              class="info-label text-medal-silver">Silver</span
            ><span class="info-value text-medal-silver"
              >{data.info.silver_count}{#if data.info.silver_cutoff != null}
                <span class="font-normal text-text-secondary"
                  >(≥ {data.info.silver_cutoff} pts)</span
                >{/if}</span
            >{/if}
          {#if data.info?.bronze_count != null}<span
              class="info-label text-medal-bronze">Bronze</span
            ><span class="info-value text-medal-bronze"
              >{data.info.bronze_count}{#if data.info.bronze_cutoff != null}
                <span class="font-normal text-text-secondary"
                  >(≥ {data.info.bronze_cutoff} pts)</span
                >{/if}</span
            >{/if}
          {#if data.info?.hm_count != null}<span
              class="info-label text-medal-hm">Hon. Mention</span
            ><span class="info-value text-medal-hm">{data.info.hm_count}</span
            >{/if}
        </div>
      {/if}
    </InfoGrid>
  {/if}
</div>
