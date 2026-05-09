<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import AwardLabel from "$lib/components/AwardLabel.svelte";
  import FlagImg from "$lib/components/FlagImg.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import InfoGrid from "$lib/components/InfoGrid.svelte";
  import { linkifyEmails } from "$lib/utils/linkifyEmails";
  import { countryNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const yearCols = [
    { key: "year", label: "Year", align: "center" },
    { key: "rank", label: "Rank", align: "center" },
    {
      key: "total",
      label: "Total",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "gold",
      label: "G",
      title: "Gold medals",
      align: "center",
      sortable: false,
    },
    {
      key: "silver",
      label: "S",
      title: "Silver medals",
      align: "center",
      sortable: false,
    },
    {
      key: "bronze",
      label: "B",
      title: "Bronze medals",
      align: "center",
      sortable: false,
    },
    {
      key: "hm",
      label: "HM",
      title: "Honourable mentions",
      align: "center",
      sortable: false,
    },
    { key: "leader", label: "Leader", sortable: false },
    { key: "deputy_leader", label: "Deputy Leader", sortable: false },
  ];

  let contactSegments = $derived(
    data.country?.contact ? linkifyEmails(data.country.contact) : []
  );
</script>

<svelte:head>
  <title>{data.country?.name} | IMO Mirror</title>
  <meta
    name="description"
    content="{data.country
      ?.name} at the International Mathematical Olympiad. Competition history, results by year, and individual contestant performances."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/country_info.aspx?code={data.code}"
  />
  <meta property="og:title" content="{data.country?.name} | IMO Mirror" />
  <meta
    property="og:description"
    content="{data.country
      ?.name} at the International Mathematical Olympiad. Competition history, results by year, and individual contestant performances."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/country_info.aspx?code={data.code}"
  />
  <meta name="twitter:title" content="{data.country?.name} | IMO Mirror" />
  <meta
    name="twitter:description"
    content="{data.country
      ?.name} at the International Mathematical Olympiad. Competition history, results by year, and individual contestant performances."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Countries", href: "/countries.aspx" },
    {
      name: data.country?.name || data.code,
      href: `/country_info.aspx?code=${data.code}`,
    },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title={data.country?.name || data.code}
    navItems={countryNavItems(data.code)}
    currentPath="/country_info.aspx?code={data.code}"
  >
    {#snippet titleContent()}
      {#if data.country?.flag_url}<FlagImg
          src={data.country.flag_url}
          alt="{data.country.name} flag"
          size="lg"
        />{/if}
      {data.country?.name || data.code}
    {/snippet}
  </PageHeader>

  <InfoGrid>
    <span class="info-label">Code</span><span class="info-value"
      >{data.code}</span
    >
    {#if data.country?.contact}
      <span class="info-label">Contact</span>
      <span class="info-value">
        {#each contactSegments as seg, i (i)}
          {#if seg.email}<a href="mailto:{seg.email}">{seg.text}</a
            >{:else}{seg.text}{/if}
        {/each}
      </span>
    {/if}
    {#if data.country?.website}
      <span class="info-label">Website</span>
      <span class="info-value"
        ><a
          href={data.country.website}
          target="_blank"
          rel="noopener noreferrer">{data.country.website}</a
        ></span
      >
    {/if}
    {#if data.hostYears.length > 0}
      <span class="info-label">Hosted</span>
      <span class="info-value"
        >{data.hostYears.map((h) => h.year).join(", ")}</span
      >
    {/if}
  </InfoGrid>

  <div class="stats-row">
    <StatCard
      value={data.medalTotals.gold}
      label="Gold"
      class="text-medal-gold"
    />
    <StatCard
      value={data.medalTotals.silver}
      label="Silver"
      class="text-medal-silver"
    />
    <StatCard
      value={data.medalTotals.bronze}
      label="Bronze"
      class="text-medal-bronze"
    />
    <StatCard
      value={data.medalTotals.hm}
      label="Honourable Mention"
      class="text-medal-hm"
    />
    <StatCard value={data.medalTotals.participations} label="Participations" />
  </div>

  <h3>Results by Year</h3>
  <DataTable
    data={data.sortedYearRows}
    cols={yearCols}
    url={data.url}
    column={data.column}
    order={data.order}
  >
    {#snippet row(r)}
      <td class="text-center"
        ><a href="/team_r.aspx?code={data.code}&year={r.year}">{r.year}</a></td
      >
      <td class="text-center">{r.rank ?? ""}</td>
      <td class="text-center">{r.total ?? ""}</td>
      <td class="text-center"
        >{#if r.gold}<span class="award-gold-medal">{r.gold}</span>{/if}</td
      >
      <td class="text-center"
        >{#if r.silver}<span class="award-silver-medal">{r.silver}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.bronze}<span class="award-bronze-medal">{r.bronze}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.hm}<span class="award-honourable-mention">{r.hm}</span>{/if}</td
      >
      <td>{r.leader}</td>
      <td>{r.deputy_leader}</td>
    {/snippet}
  </DataTable>

  <h3>Individual Results (Recent)</h3>
  <DataTable
    data={data.indivRows.slice(0, 100)}
    rowClass={(r, i) =>
      i > 0 && data.indivRows[i - 1].year !== r.year ? "year-group-start" : ""}
  >
    {#snippet header()}
      <thead>
        <tr>
          <th class="text-center">Year</th>
          <th>Name</th>
          <th class="text-center">Total</th>
          <th class="text-center">Rank</th>
          <th>Award</th>
        </tr>
      </thead>
    {/snippet}
    {#snippet row(r)}
      <td class="text-center"
        ><a href="/year_info.aspx?year={r.year}">{r.year}</a></td
      >
      <td
        >{#if r.participant_id}<a
            href="/participant_r.aspx?id={r.participant_id}">{r.name}</a
          >{:else}{r.name}{/if}</td
      >
      <td class="text-center">{r.total ?? ""}</td>
      <td class="text-center">{r.rank ?? ""}</td>
      <td
        >{#if r.award}<AwardLabel award={r.award} />{/if}</td
      >
    {/snippet}
  </DataTable>
  {#if data.indivRows.length > 100}
    <p>
      <a href="/country_individual_r.aspx?code={data.code}"
        >View all {data.indivRows.length} individual results &rarr;</a
      >
    </p>
  {/if}
</div>
