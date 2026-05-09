<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import AwardLabel from "$lib/components/AwardLabel.svelte";
  import FlagImg from "$lib/components/FlagImg.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import { CHART_COLORS, STACKED_BAR_ORDER } from "$lib/utils/chartColors";
  import { countryNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let cols = $derived([
    { key: "year", label: "Year", align: "center" },
    { key: "name", label: "Contestant" },
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
    { key: "award", label: "Award", sortable: false },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function medalTotal(d: Record<string, any>) {
    return (
      (d.gold || 0) +
      (d.silver || 0) +
      (d.bronze || 0) +
      (d.hm || 0) +
      (d.none || 0)
    );
  }

  let medalLayers = $derived(
    STACKED_BAR_ORDER.map((l) => ({
      key: l.key,
      color: l.color,
    }))
  );

  let rankDots = $derived(
    data.rankChartData
      .map((d, i) => ({
        dataIdx: i,
        ranks: d.ranks || [],
      }))
      .filter((e) => e.ranks.length > 0)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tooltipHtml(d: Record<string, any>) {
    const CC = CHART_COLORS;
    const total = medalTotal(d);
    let html = "<b>IMO " + d.year + "</b> (" + total + " contestants)<br>";
    if (d.ranks && d.ranks.length) {
      const sorted = (d.ranks as number[]).slice().sort((a, b) => a - b);
      html += "Ranks: " + sorted.join(", ") + "<br>";
      const swatch = (c: string, l: string, v: number) =>
        v
          ? '<span style="color:' +
            c +
            '">\u25CF</span> ' +
            l +
            ": " +
            v +
            "<br>"
          : "";
      html +=
        swatch(CC.gold, "Gold", d.cg) +
        swatch(CC.silver, "Silver", d.cs) +
        swatch(CC.bronze, "Bronze", d.cb) +
        swatch(CC.hm, "HM", d.ch);
    }
    return html;
  }
</script>

<svelte:head>
  <title
    >{data.country?.name || data.code} — Individual Results | IMO Mirror</title
  >
  <meta
    name="description"
    content="All individual IMO results for {data.country?.name ||
      data.code}. Problem scores, totals, ranks, and awards for every contestant."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/country_individual_r.aspx?code={data.code}"
  />
  <meta
    property="og:title"
    content="{data.country?.name ||
      data.code} — Individual Results | IMO Mirror"
  />
  <meta
    property="og:description"
    content="All individual IMO results for {data.country?.name ||
      data.code}. Problem scores, totals, ranks, and awards for every contestant."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/country_individual_r.aspx?code={data.code}"
  />
  <meta
    name="twitter:title"
    content="{data.country?.name ||
      data.code} — Individual Results | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="All individual IMO results for {data.country?.name ||
      data.code}. Problem scores, totals, ranks, and awards for every contestant."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Countries", href: "/countries.aspx" },
    {
      name: data.country?.name || data.code,
      href: `/country_info.aspx?code=${data.code}`,
    },
    {
      name: "Individual Results",
      href: `/country_individual_r.aspx?code=${data.code}`,
    },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="{data.country?.name || data.code} — Individual Results"
    navItems={countryNavItems(data.code)}
    currentPath="/country_individual_r.aspx?code={data.code}"
  >
    {#snippet titleContent()}
      {#if data.country?.flag_url}<FlagImg
          src={data.country.flag_url}
          alt="{data.country.name} flag"
          size="lg"
        />{/if}
      {data.country?.name || data.code} &mdash; Individual Results
    {/snippet}
  </PageHeader>

  {#if data.rankChartData.length > 1}
    <ChartSection title="Individual Rankings">
      <BarChart
        data={data.rankChartData}
        layers={medalLayers}
        title=""
        sumFn={medalTotal}
        tooltipFn={(d) => tooltipHtml(d)}
        xFormat={(d) => "'" + String(d.year).slice(-2)}
        {rankDots}
        rankDotColor={CHART_COLORS.line}
      />
    </ChartSection>
  {/if}

  <DataTable
    data={data.rows}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
    rowClass={(row, i) =>
      i > 0 && data.rows[i - 1].year !== row.year ? "year-group-start" : ""}
  >
    {#snippet row(r)}
      <td class="text-center"
        ><a href="/year_info.aspx?year={r.year}">{r.year}</a></td
      >
      <td
        >{#if r.participant_id}<a
            href="/participant_r.aspx?id={r.participant_id}">{r.name}</a
          >{:else}{r.name}{/if}</td
      >
      <td class="text-center">{r.p1 ?? ""}</td>
      <td class="text-center">{r.p2 ?? ""}</td>
      <td class="text-center">{r.p3 ?? ""}</td>
      <td class="text-center">{r.p4 ?? ""}</td>
      <td class="text-center">{r.p5 ?? ""}</td>
      <td class="text-center">{r.p6 ?? ""}</td>
      {#if data.hasP7}<td class="text-center">{r.p7 ?? ""}</td>{/if}
      <td class="text-center">{r.total ?? ""}</td>
      <td class="text-center">{r.rank ?? ""}</td>
      <td
        >{#if r.award}<AwardLabel award={r.award} />{/if}</td
      >
    {/snippet}
  </DataTable>
</div>
