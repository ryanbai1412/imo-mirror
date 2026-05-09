<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import FlagImg from "$lib/components/FlagImg.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import { countryNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let cols = $derived([
    { key: "year", label: "Year", align: "center" },
    {
      key: "team_size_all",
      label: "#",
      title: "Team size",
      align: "center",
      sortable: false,
    },
    {
      key: "p1",
      label: "P1",
      title: "Problem 1",
      align: "center",
      sortable: false,
    },
    {
      key: "p2",
      label: "P2",
      title: "Problem 2",
      align: "center",
      sortable: false,
    },
    {
      key: "p3",
      label: "P3",
      title: "Problem 3",
      align: "center",
      sortable: false,
    },
    {
      key: "p4",
      label: "P4",
      title: "Problem 4",
      align: "center",
      sortable: false,
    },
    {
      key: "p5",
      label: "P5",
      title: "Problem 5",
      align: "center",
      sortable: false,
    },
    {
      key: "p6",
      label: "P6",
      title: "Problem 6",
      align: "center",
      sortable: false,
    },
    ...(data.hasP7
      ? [
          {
            key: "p7",
            label: "P7",
            title: "Problem 7",
            align: "center",
            sortable: false,
          },
        ]
      : []),
    {
      key: "total",
      label: "Total",
      align: "center",
      defaultOrder: "desc" as const,
    },
    { key: "rank", label: "Rank", align: "center" },
    {
      key: "awards_gold",
      label: "G",
      title: "Gold medals",
      align: "center",
      sortable: false,
    },
    {
      key: "awards_silver",
      label: "S",
      title: "Silver medals",
      align: "center",
      sortable: false,
    },
    {
      key: "awards_bronze",
      label: "B",
      title: "Bronze medals",
      align: "center",
      sortable: false,
    },
    {
      key: "awards_hm",
      label: "HM",
      title: "Honourable mentions",
      align: "center",
      sortable: false,
    },
    { key: "leader", label: "Leader", sortable: false },
    { key: "deputy_leader", label: "Deputy Leader", sortable: false },
  ]);

  let medalLayers = $derived([
    { key: "gold", color: CHART_COLORS.gold },
    { key: "silver", color: CHART_COLORS.silver },
    { key: "bronze", color: CHART_COLORS.bronze },
    { key: "hm", color: CHART_COLORS.hm },
  ]);

  const MEDAL_LABELS: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    hm: "HM",
  };
  interface MedalPoint {
    year: number;
    gold: number;
    silver: number;
    bronze: number;
    hm: number;
  }
  interface ChartPoint {
    year: number;
    edition: number | null;
    numCountries: number | null;
    rank: number | null;
  }
  function medalTooltip(d: Record<string, unknown>) {
    const m = d as unknown as MedalPoint;
    let html = `<b>IMO ${m.year}</b><br>`;
    for (const l of medalLayers) {
      if (d[l.key])
        html += `<div class="chart-tooltip-row"><span class="chart-tooltip-swatch" style="background:${l.color}"></span>${MEDAL_LABELS[l.key]}: ${d[l.key]}</div>`;
    }
    return html;
  }
  function rankTooltip(d: Record<string, unknown>) {
    const c = d as unknown as ChartPoint;
    let html = `<b>IMO ${c.year}</b><br>`;
    if (c.numCountries != null) html += `Countries: ${c.numCountries}<br>`;
    if (c.rank != null) html += `Rank: ${c.rank} / ${c.numCountries || "?"}`;
    return html;
  }
</script>

<svelte:head>
  <title>{data.country?.name || data.code} — Team Results | IMO Mirror</title>
  <meta
    name="description"
    content="IMO team results for {data.country?.name ||
      data.code}. Yearly rankings, scores, medal counts, and team leaders."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/country_team_r.aspx?code={data.code}"
  />
  <meta
    property="og:title"
    content="{data.country?.name || data.code} — Team Results | IMO Mirror"
  />
  <meta
    property="og:description"
    content="IMO team results for {data.country?.name ||
      data.code}. Yearly rankings, scores, medal counts, and team leaders."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/country_team_r.aspx?code={data.code}"
  />
  <meta
    name="twitter:title"
    content="{data.country?.name || data.code} — Team Results | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="IMO team results for {data.country?.name ||
      data.code}. Yearly rankings, scores, medal counts, and team leaders."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Countries", href: "/countries.aspx" },
    {
      name: data.country?.name || data.code,
      href: `/country_info.aspx?code=${data.code}`,
    },
    { name: "Team Results", href: `/country_team_r.aspx?code=${data.code}` },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="{data.country?.name || data.code} — Team Results"
    navItems={countryNavItems(data.code)}
    currentPath="/country_team_r.aspx?code={data.code}"
  >
    {#snippet titleContent()}
      {#if data.country?.flag_url}<FlagImg
          src={data.country.flag_url}
          alt="{data.country.name} flag"
          size="lg"
        />{/if}
      {data.country?.name || data.code} &mdash; Team Results
    {/snippet}
  </PageHeader>

  {#if data.medalPoints.length > 1 && data.chartPoints.length > 1}
    <div class="charts-row">
      <ChartSection title="Medal Counts">
        <BarChart
          data={data.medalPoints}
          layers={medalLayers}
          title=""
          tooltipFn={medalTooltip}
          xFormat={(d) => "'" + String(d.year).slice(-2)}
        />
      </ChartSection>
      <ChartSection title="Team Ranking">
        <BarChart
          data={data.chartPoints}
          yKey="numCountries"
          title=""
          tooltipFn={rankTooltip}
          barColor={CHART_COLORS.gold}
          overlayLineKey="rank"
          overlayLineColor={CHART_COLORS.line}
          overlayTotalKey="numCountries"
          xFormat={(d) => "'" + String(d.year).slice(-2)}
        />
      </ChartSection>
    </div>
  {/if}

  <DataTable
    data={data.rows}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
    freezeCols={1}
  >
    {#snippet row(r)}
      <td class="text-center"
        ><a href="/team_r.aspx?code={data.code}&year={r.year}">{r.year}</a></td
      >
      <td class="text-center">{r.team_size_all ?? ""}</td>
      <td class="text-center">{r.p1 ?? ""}</td>
      <td class="text-center">{r.p2 ?? ""}</td>
      <td class="text-center">{r.p3 ?? ""}</td>
      <td class="text-center">{r.p4 ?? ""}</td>
      <td class="text-center">{r.p5 ?? ""}</td>
      <td class="text-center">{r.p6 ?? ""}</td>
      {#if data.hasP7}<td class="text-center">{r.p7 ?? ""}</td>{/if}
      <td class="text-center">{r.total ?? ""}</td>
      <td class="text-center">{r.rank ?? ""}</td>
      <td class="text-center"
        >{#if r.awards_gold}<span class="award-gold-medal">{r.awards_gold}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.awards_silver}<span class="award-silver-medal"
            >{r.awards_silver}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.awards_bronze}<span class="award-bronze-medal"
            >{r.awards_bronze}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.awards_hm}<span class="award-honourable-mention"
            >{r.awards_hm}</span
          >{/if}</td
      >
      <td>{r.leader ?? ""}</td>
      <td>{r.deputy_leader ?? ""}</td>
    {/snippet}
  </DataTable>
</div>
