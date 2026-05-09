<script lang="ts">
  import DataTable from "$lib/components/DataTable.svelte";
  import FlagImg from "$lib/components/FlagImg.svelte";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cols = [
    { key: "code", label: "Code" },
    { key: "name", label: "Country" },
    { key: "flag", label: "Flag", sortable: false },
    { key: "website", label: "Website", sortable: false },
  ];
</script>

<svelte:head>
  <title>Countries | IMO Mirror</title>
  <meta
    name="description"
    content="All countries participating in the International Mathematical Olympiad. Contact information, websites, and hosting history."
  />
  <link rel="canonical" href="https://imo-mirror.org/countries.aspx" />
  <meta property="og:title" content="Countries | IMO Mirror" />
  <meta
    property="og:description"
    content="All countries participating in the International Mathematical Olympiad. Contact information, websites, and hosting history."
  />
  <meta property="og:url" content="https://imo-mirror.org/countries.aspx" />
  <meta name="twitter:title" content="Countries | IMO Mirror" />
  <meta
    name="twitter:description"
    content="All countries participating in the International Mathematical Olympiad. Contact information, websites, and hosting history."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Countries", href: "/countries.aspx" },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <h1>Countries</h1>
  <DataTable
    data={data.countries}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
    freezeCols={1}
  >
    {#snippet row(c)}
      <td><a href="/country_info.aspx?code={c.code}">{c.code}</a></td>
      <td><a href="/country_info.aspx?code={c.code}">{c.name}</a></td>
      <td
        >{#if c.flag_url}<FlagImg
            src={c.flag_url}
            alt="{c.name} flag"
          />{/if}</td
      >
      <td
        >{#if c.website}<a
            href={c.website}
            target="_blank"
            rel="noopener noreferrer">Link</a
          >{/if}</td
      >
    {/snippet}
  </DataTable>
</div>
