<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import CountryLink from "$lib/components/CountryLink.svelte";
  import AwardLabel from "$lib/components/AwardLabel.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import { STACKED_BAR_ORDER } from "$lib/utils/chartColors";
  import { yearNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { DistBucket } from "$lib/utils/data";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function medalTotal(d: DistBucket) {
    return (
      (d.gold || 0) +
      (d.silver || 0) +
      (d.bronze || 0) +
      (d.hm || 0) +
      (d.none || 0)
    );
  }
  function rankLabel(min: number | null, max: number | null) {
    if (min == null) return "";
    if (max == null || min === max) return "Rank: " + min;
    return "Rank: " + min + "\u2013" + max;
  }
  const LABELS: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    hm: "HM",
    none: "None",
  };
  function distTooltip(d: Record<string, unknown>) {
    const b = d as unknown as DistBucket;
    const total = medalTotal(b);
    if (!total) return "";
    let html = `<b>Score ${b.score}</b> (${total} contestant${total === 1 ? "" : "s"})<br>`;
    const rl = rankLabel(b.rankMin, b.rankMax);
    if (rl) html += rl + "<br>";
    for (const l of STACKED_BAR_ORDER) {
      if (d[l.key])
        html += `<div class="chart-tooltip-row"><span class="chart-tooltip-swatch" style="background:${l.color}"></span>${LABELS[l.key]}: ${d[l.key]}</div>`;
    }
    return html;
  }

  let cols = $derived([
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
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
    { key: "rank", label: "Rank", align: "center" },
    { key: "award", label: "Award" },
  ]);
</script>

<svelte:head>
  <title>IMO {data.year} — Individual Results | IMO Mirror</title>
  <meta
    name="description"
    content="Individual results for the {data.year} International Mathematical Olympiad. Scores, rankings, and awards for all contestants."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/year_individual_r.aspx?year={data.year}"
  />
  <meta
    property="og:title"
    content="IMO {data.year} — Individual Results | IMO Mirror"
  />
  <meta
    property="og:description"
    content="Individual results for the {data.year} International Mathematical Olympiad. Scores, rankings, and awards for all contestants."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/year_individual_r.aspx?year={data.year}"
  />
  <meta
    name="twitter:title"
    content="IMO {data.year} — Individual Results | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="Individual results for the {data.year} International Mathematical Olympiad. Scores, rankings, and awards for all contestants."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Timeline", href: "/organizers.aspx" },
    { name: `IMO ${data.year}`, href: `/year_info.aspx?year=${data.year}` },
    {
      name: "Individual Results",
      href: `/year_individual_r.aspx?year=${data.year}`,
    },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="IMO {data.year} — Individual Results"
    navItems={yearNavItems(data.year)}
    currentPath="/year_individual_r.aspx?year={data.year}"
    prevHref={data.prevYear
      ? `/year_individual_r.aspx?year=${data.prevYear.year}`
      : undefined}
    nextHref={data.nextYear
      ? `/year_individual_r.aspx?year=${data.nextYear.year}`
      : undefined}
  />

  {#if data.entries.length > 0}
    <ChartSection title="Points Distribution">
      <BarChart
        data={data.distBuckets}
        xKey="score"
        layers={STACKED_BAR_ORDER.map((l) => ({ key: l.key, color: l.color }))}
        title=""
        tooltipFn={distTooltip}
        xLabel="Total Score"
        maxLabels={9}
        xFormat={(d) =>
          d.score % 5 === 0 || d.score === data.distBuckets.length - 1
            ? String(d.score)
            : ""}
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
      <td
        >{#if r.participant_id}<a
            href="/participant_r.aspx?id={r.participant_id}">{r.name}</a
          >{:else}{r.name}{/if}</td
      >
      <td
        ><CountryLink
          code={r.country_code}
          label={r.country}
          year={data.year}
        /></td
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
