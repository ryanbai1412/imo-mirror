<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import { yearNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { CountryDistBucket } from "$lib/utils/data";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function rankLabel(min: number | null, max: number | null) {
    if (min == null) return "";
    if (max == null || min === max) return "Rank: " + min;
    return "Rank: " + min + "\u2013" + max;
  }
  function countryDistTooltip(d: Record<string, unknown>) {
    const b = d as unknown as CountryDistBucket;
    if (!b.count) return "";
    let html = `<b>${b.label} pts</b><br>${b.count} ${b.count === 1 ? "country" : "countries"}`;
    const rl = rankLabel(b.rankMin, b.rankMax);
    if (rl) html += `<br><span class="chart-tooltip-meta">${rl}</span>`;
    return html;
  }

  let cols = $derived([
    { key: "rank", label: "Rank", align: "center" },
    { key: "country", label: "Country" },
    { key: "code", label: "Code" },
    {
      key: "team_size_all",
      label: "#",
      title: "Team size",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "p1",
      label: "P1",
      title: "Problem 1",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "p2",
      label: "P2",
      title: "Problem 2",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "p3",
      label: "P3",
      title: "Problem 3",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "p4",
      label: "P4",
      title: "Problem 4",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "p5",
      label: "P5",
      title: "Problem 5",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "p6",
      label: "P6",
      title: "Problem 6",
      align: "center",
      defaultOrder: "desc" as const,
    },
    ...(data.hasP7
      ? [
          {
            key: "p7",
            label: "P7",
            title: "Problem 7",
            align: "center",
            defaultOrder: "desc" as const,
          },
        ]
      : []),
    {
      key: "total",
      label: "Total",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "awards_gold",
      label: "G",
      title: "Gold medals",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "awards_silver",
      label: "S",
      title: "Silver medals",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "awards_bronze",
      label: "B",
      title: "Bronze medals",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "awards_hm",
      label: "HM",
      title: "Honourable mentions",
      align: "center",
      defaultOrder: "desc" as const,
    },
    { key: "leader", label: "Leader" },
    { key: "deputy_leader", label: "Deputy Leader" },
  ]);
</script>

<svelte:head>
  <title>IMO {data.year} — Country Results | IMO Mirror</title>
  <meta
    name="description"
    content="Country results for the {data.year} International Mathematical Olympiad. Rankings, scores, and medal counts for all participating countries."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/year_country_r.aspx?year={data.year}"
  />
  <meta
    property="og:title"
    content="IMO {data.year} — Country Results | IMO Mirror"
  />
  <meta
    property="og:description"
    content="Country results for the {data.year} International Mathematical Olympiad. Rankings, scores, and medal counts for all participating countries."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/year_country_r.aspx?year={data.year}"
  />
  <meta
    name="twitter:title"
    content="IMO {data.year} — Country Results | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="Country results for the {data.year} International Mathematical Olympiad. Rankings, scores, and medal counts for all participating countries."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Timeline", href: "/organizers.aspx" }, { name: `IMO ${data.year}`, href: `/year_info.aspx?year=${data.year}` }, { name: "Country Results", href: `/year_country_r.aspx?year=${data.year}` }])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="IMO {data.year} — Country Results"
    navItems={yearNavItems(data.year)}
    currentPath="/year_country_r.aspx?year={data.year}"
    prevHref={data.prevYear
      ? `/year_country_r.aspx?year=${data.prevYear.year}`
      : undefined}
    nextHref={data.nextYear
      ? `/year_country_r.aspx?year=${data.nextYear.year}`
      : undefined}
  />

  {#if data.entries.length > 0}
    <ChartSection title="Country Score Distribution">
      <BarChart
        data={data.countryDistData}
        xKey="lo"
        yKey="count"
        title=""
        barColor={CHART_COLORS.line}
        tooltipFn={countryDistTooltip}
        xLabel="Total Score"
        padding={{ top: 20, right: 16, bottom: 48, left: 40 }}
      />
    </ChartSection>
  {/if}

  <DataTable
    data={data.entries}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
  >
    {#snippet row(r)}
      <td class="text-center">{r.rank ?? ""}</td>
      <td
        ><a href="/team_r.aspx?code={r.code}&year={data.year}">{r.country}</a
        ></td
      >
      <td><a href="/team_r.aspx?code={r.code}&year={data.year}">{r.code}</a></td
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
      <td>{r.leader || ""}</td>
      <td>{r.deputy_leader || ""}</td>
    {/snippet}
  </DataTable>
</div>
