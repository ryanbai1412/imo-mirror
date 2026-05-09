<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { resultsNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/table.css";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Results Matrix | IMO Mirror</title>
  <meta
    name="description"
    content="Visual matrix of IMO country rankings across all years. Quick overview of every country's performance history."
  />
  <link rel="canonical" href="https://imo-mirror.org/results_matrix.aspx" />
  <meta property="og:title" content="Results Matrix | IMO Mirror" />
  <meta
    property="og:description"
    content="Visual matrix of IMO country rankings across all years. Quick overview of every country's performance history."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/results_matrix.aspx"
  />
  <meta name="twitter:title" content="Results Matrix | IMO Mirror" />
  <meta
    name="twitter:description"
    content="Visual matrix of IMO country rankings across all years. Quick overview of every country's performance history."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Results Matrix", href: "/results_matrix.aspx" }])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="Results Matrix"
    navItems={resultsNavItems}
    currentPath="/results_matrix.aspx"
  />

  <div class="matrix-scroll">
    <table class="data-table matrix-table">
      <thead>
        <tr>
          <th class="sticky-col">Country</th>
          {#each data.years as y (y)}
            <th class="text-center">
              <a href="/year_info.aspx?year={y}">{String(y).slice(2)}</a>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data.filteredCodes as code (code)}
          {@const entry = data.matrix[code]}
          <tr>
            <td class="sticky-col">
              <a href="/country_info.aspx?code={code}">{code}</a>
            </td>
            {#each data.years as y (y)}
              {@const rank = entry?.[String(y)]}
              <td class="text-center">{rank != null ? rank : ""}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .matrix-scroll {
    max-height: calc(100vh - 120px);
    overflow: auto;
    border-radius: var(--radius-default);
    border: 1px solid var(--color-border);
    margin-bottom: 16px;
  }
  .matrix-table {
    font-size: 11px;
  }
  .matrix-table th {
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .matrix-table th,
  .matrix-table td {
    padding: 3px 5px;
    white-space: nowrap;
  }
  .sticky-col {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--color-surface);
    border-right: 2px solid var(--color-border);
  }
  thead .sticky-col {
    background: var(--color-navy);
    z-index: 4;
  }
  .matrix-table tbody tr:nth-child(even) .sticky-col {
    background: var(--color-table-stripe);
  }
  .matrix-table tbody tr:hover .sticky-col {
    background: var(--color-table-hover);
  }
</style>
