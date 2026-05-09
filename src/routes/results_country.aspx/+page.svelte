<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import { resultsNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cols = [
    { key: "code", label: "Code" },
    { key: "country", label: "Country" },
    {
      key: "first_participation",
      label: "First",
      title: "First participation year",
      align: "center",
    },
    {
      key: "participations",
      label: "Part.",
      title: "Participations",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "contestants_all",
      label: "Cont.",
      title: "Contestants",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "contestants_male",
      label: "Male",
      title: "Male contestants",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "contestants_female",
      label: "Female",
      title: "Female contestants",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "gold",
      label: "G",
      title: "Gold medals",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "silver",
      label: "S",
      title: "Silver medals",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "bronze",
      label: "B",
      title: "Bronze medals",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "hm",
      label: "HM",
      title: "Honourable mentions",
      align: "center",
      defaultOrder: "desc" as const,
    },
  ];
</script>

<svelte:head>
  <title>Results by Country | IMO Mirror</title>
  <meta
    name="description"
    content="Comprehensive IMO results by country. Medal counts, participation history, and contestant statistics for all participating nations."
  />
  <link rel="canonical" href="https://imo-mirror.org/results_country.aspx" />
  <meta property="og:title" content="Results by Country | IMO Mirror" />
  <meta
    property="og:description"
    content="Comprehensive IMO results by country. Medal counts, participation history, and contestant statistics for all participating nations."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/results_country.aspx"
  />
  <meta name="twitter:title" content="Results by Country | IMO Mirror" />
  <meta
    name="twitter:description"
    content="Comprehensive IMO results by country. Medal counts, participation history, and contestant statistics for all participating nations."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Results by Country", href: "/results_country.aspx" },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="Results by Country"
    navItems={resultsNavItems}
    currentPath="/results_country.aspx"
  />

  <DataTable
    data={data.entries}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
  >
    {#snippet row(r)}
      <td><a href="/country_info.aspx?code={r.code}">{r.code}</a></td>
      <td><a href="/country_info.aspx?code={r.code}">{r.country}</a></td>
      <td class="text-center">{r.first_participation ?? ""}</td>
      <td class="text-center">{r.participations}</td>
      <td class="text-center">{r.contestants_all}</td>
      <td class="text-center">{r.contestants_male}</td>
      <td class="text-center">{r.contestants_female}</td>
      <td class="text-center"
        >{#if r.gold > 0}<span class="award-gold-medal">{r.gold}</span>{/if}</td
      >
      <td class="text-center"
        >{#if r.silver > 0}<span class="award-silver-medal">{r.silver}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.bronze > 0}<span class="award-bronze-medal">{r.bronze}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.hm > 0}<span class="award-honourable-mention">{r.hm}</span
          >{/if}</td
      >
    {/snippet}
  </DataTable>
</div>
