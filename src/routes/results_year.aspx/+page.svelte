<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import LineChart from "$lib/charts/LineChart.svelte";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import { resultsNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cols = [
    { key: "year", label: "Year", align: "center" },
    { key: "host_country", label: "Host" },
    {
      key: "num_countries",
      label: "Countries",
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
    {
      key: "gold_cutoff",
      label: "G≥",
      title: "Gold cutoff score",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "silver_cutoff",
      label: "S≥",
      title: "Silver cutoff score",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "bronze_cutoff",
      label: "B≥",
      title: "Bronze cutoff score",
      align: "center",
      defaultOrder: "desc" as const,
    },
  ];

  let medalLayers = $derived([
    { key: "gold", color: CHART_COLORS.gold },
    { key: "silver", color: CHART_COLORS.silver },
    { key: "bronze", color: CHART_COLORS.bronze },
    { key: "hm", color: CHART_COLORS.hm },
  ]);

  let cutoffLines = $derived([
    { key: "gold", color: CHART_COLORS.gold, label: "Gold cutoff" },
    { key: "silver", color: CHART_COLORS.silver, label: "Silver cutoff" },
    { key: "bronze", color: CHART_COLORS.bronze, label: "Bronze cutoff" },
  ]);

  function medalTooltip(d: Record<string, unknown>) {
    let html = `<b>IMO ${d.year}</b><br>`;
    for (const l of medalLayers) {
      if (d[l.key])
        html += `<div class="chart-tooltip-row"><span class="chart-tooltip-swatch" style="background:${l.color}"></span>${l.key.charAt(0).toUpperCase() + l.key.slice(1)}: ${d[l.key]}</div>`;
    }
    return html;
  }
  function cutoffTooltip(d: Record<string, unknown>) {
    let html = `<b>IMO ${d.year}</b><br>`;
    for (const l of cutoffLines) {
      if (d[l.key] != null)
        html += `<div class="chart-tooltip-row"><span class="chart-tooltip-swatch" style="background:${l.color}"></span>${l.label}: ${d[l.key]}</div>`;
    }
    return html;
  }
</script>

<svelte:head>
  <title>Results by Year | IMO Mirror</title>
  <meta
    name="description"
    content="IMO results by year. Medal counts, cutoff scores, host countries, and participation statistics for every International Mathematical Olympiad."
  />
  <link rel="canonical" href="https://imo-mirror.org/results_year.aspx" />
  <meta property="og:title" content="Results by Year | IMO Mirror" />
  <meta
    property="og:description"
    content="IMO results by year. Medal counts, cutoff scores, host countries, and participation statistics for every International Mathematical Olympiad."
  />
  <meta property="og:url" content="https://imo-mirror.org/results_year.aspx" />
  <meta name="twitter:title" content="Results by Year | IMO Mirror" />
  <meta
    name="twitter:description"
    content="IMO results by year. Medal counts, cutoff scores, host countries, and participation statistics for every International Mathematical Olympiad."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Results by Year", href: "/results_year.aspx" },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="Results by Year"
    navItems={resultsNavItems}
    currentPath="/results_year.aspx"
  />

  <div class="charts-row">
    <ChartSection title="Medal Counts Over Time">
      <BarChart
        data={data.medalChartData}
        layers={medalLayers}
        title=""
        tooltipFn={medalTooltip}
        xFormat={(d) => "'" + String(d.year).slice(-2)}
      />
    </ChartSection>
    <ChartSection title="Cutoff Scores Over Time">
      <LineChart
        data={data.cutoffChartData}
        lines={cutoffLines}
        title=""
        tooltipFn={cutoffTooltip}
        fixedYMax={42}
        fixedYStep={7}
      />
    </ChartSection>
  </div>

  <DataTable
    data={data.entries}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
  >
    {#snippet row(r)}
      <td class="text-center"
        ><a href="/year_info.aspx?year={r.year}">{r.year}</a></td
      >
      <td>{r.host_country}</td>
      <td class="text-center">{r.num_countries ?? ""}</td>
      <td class="text-center">{r.contestants_all ?? ""}</td>
      <td class="text-center">{r.contestants_male ?? ""}</td>
      <td class="text-center">{r.contestants_female ?? ""}</td>
      <td class="text-center">{r.gold}</td>
      <td class="text-center">{r.silver}</td>
      <td class="text-center">{r.bronze}</td>
      <td class="text-center">{r.hm}</td>
      <td class="text-center">{r.gold_cutoff ?? ""}</td>
      <td class="text-center">{r.silver_cutoff ?? ""}</td>
      <td class="text-center">{r.bronze_cutoff ?? ""}</td>
    {/snippet}
  </DataTable>
</div>
