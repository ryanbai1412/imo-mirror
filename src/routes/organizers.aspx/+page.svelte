<script lang="ts">
  import DataTable from "$lib/components/DataTable.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import LineChart from "$lib/charts/LineChart.svelte";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import { formatDate } from "$lib/utils/data";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  interface GrowthDatum {
    year: number;
    countries: number;
    contestants: number;
  }

  let { data }: { data: PageData } = $props();

  function growthTooltip(d: Record<string, unknown>) {
    const g = d as unknown as GrowthDatum;
    let html = `<b>IMO ${g.year}</b><br>`;
    html += `<div class="chart-tooltip-row"><span class="chart-tooltip-swatch" style="background:${CHART_COLORS.line}"></span>Countries: ${g.countries}</div>`;
    html += `<div class="chart-tooltip-row"><span class="chart-tooltip-swatch" style="background:${CHART_COLORS.contestant}"></span>Contestants: ${g.contestants}</div>`;
    return html;
  }

  const cols = [
    { key: "edition", label: "#", title: "Edition number", align: "center" },
    { key: "year", label: "Year", align: "center" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    {
      key: "num_countries",
      label: "Countries",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "contestants_all",
      label: "Contestants",
      align: "center",
      defaultOrder: "desc" as const,
    },
    { key: "date", label: "Date", sortable: false },
  ];
</script>

<svelte:head>
  <title>Timeline | IMO Mirror</title>
  <meta
    name="description"
    content="Complete timeline of every International Mathematical Olympiad from 1959 to present. Host cities, dates, and participation statistics."
  />
  <link rel="canonical" href="https://imo-mirror.org/organizers.aspx" />
  <meta property="og:title" content="Timeline | IMO Mirror" />
  <meta
    property="og:description"
    content="Complete timeline of every International Mathematical Olympiad from 1959 to present. Host cities, dates, and participation statistics."
  />
  <meta property="og:url" content="https://imo-mirror.org/organizers.aspx" />
  <meta name="twitter:title" content="Timeline | IMO Mirror" />
  <meta
    name="twitter:description"
    content="Complete timeline of every International Mathematical Olympiad from 1959 to present. Host cities, dates, and participation statistics."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Timeline", href: "/organizers.aspx" },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <h1>Timeline</h1>

  {#if data.growthData.length > 1}
    <ChartSection title="Participation Growth">
      <LineChart
        data={data.growthData}
        lines={[
          { key: "countries", color: CHART_COLORS.line, label: "Countries" },
          {
            key: "contestants",
            color: CHART_COLORS.contestant,
            label: "Contestants",
          },
        ]}
        rightAxis={{
          key: "contestants",
          color: CHART_COLORS.contestant,
          label: "Contestants",
        }}
        title=""
        yLabel="Countries"
        yLabelRight="Contestants"
        tooltipFn={growthTooltip}
        padding={{ top: 10, right: 52, bottom: 36, left: 46 }}
      />
    </ChartSection>
  {/if}

  <DataTable
    data={data.timeline}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
    freezeCols={2}
  >
    {#snippet row(entry)}
      <td class="text-center">{entry.edition}</td>
      <td class="text-center"
        ><a href="/year_info.aspx?year={entry.year}">{entry.year}</a></td
      >
      <td
        >{#if data.nameToCode[entry.country]}<a
            href="/country_info.aspx?code={data.nameToCode[entry.country]}"
            >{entry.country}</a
          >{:else}{entry.country}{/if}</td
      >
      <td>{entry.city}</td>
      <td class="text-center">{entry.num_countries ?? ""}</td>
      <td class="text-center">{entry.contestants_all ?? ""}</td>
      <td>{formatDate(entry.date)}</td>
    {/snippet}
  </DataTable>
</div>
