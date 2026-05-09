<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import PillPicker from "$lib/components/PillPicker.svelte";
  import ScatterGrid from "$lib/components/ScatterGrid.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import ScatterChart from "$lib/charts/ScatterChart.svelte";
  import { CHART_COLORS, STACKED_BAR_ORDER } from "$lib/utils/chartColors";
  import { awardColor as coreAwardColor } from "$lib/charts/_core";
  import { yearNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { DistBucket } from "$lib/utils/data";
  import type { DayPoint } from "./+page.ts";
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
  function problemTooltip(d: Record<string, unknown>) {
    const total =
      data.problemDistData[activeProblem!]?.reduce(
        (s, b) => s + (b.count || 0),
        0
      ) || 0;
    const count = d.count as number;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
    return `<b>Score ${d.score}</b><br>${count} contestant${count === 1 ? "" : "s"} (${pct}%)`;
  }

  let activeProblem = $state<string | null>(null);

  $effect(() => {
    activeProblem = data.problemKeys.length > 0 ? data.problemKeys[0] : null;
  });

  let activeProblemLabel = $derived(
    (() => {
      if (!activeProblem) return "";
      const idx = data.problemKeys.indexOf(activeProblem);
      return idx >= 0 ? data.problemHeaders[idx] : activeProblem.toUpperCase();
    })()
  );

  let activeProblemData = $derived(
    activeProblem && data.problemDistData[activeProblem]
      ? data.problemDistData[activeProblem]
      : []
  );

  let maxRank = $derived(
    data.dayPoints.reduce((m, d) => Math.max(m, d.day1rank, d.day2rank), 1)
  );

  function scatterTooltip(pt: Record<string, unknown>) {
    const inner = pt.d as Record<string, unknown> | undefined;
    const d = (inner || pt) as unknown as DayPoint;
    const label = d.award?.length
      ? d.award
          .map((a) => (a === "hm" ? "HM" : a[0].toUpperCase() + a.slice(1)))
          .join(", ")
      : "None";
    return (
      "<b>" +
      d.name +
      "</b><br>" +
      "Day 1: " +
      d.day1 +
      " (Rank " +
      d.day1rank +
      ")<br>" +
      "Day 2: " +
      d.day2 +
      " (Rank " +
      d.day2rank +
      ")<br>" +
      '<span style="color:' +
      coreAwardColor(d.award, CHART_COLORS) +
      '">\u25CF</span> ' +
      label
    );
  }
</script>

<svelte:head>
  <title>IMO {data.year} — Statistics | IMO Mirror</title>
  <meta
    name="description"
    content="Score distribution statistics for the {data.year} International Mathematical Olympiad. Problem-by-problem analysis."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/year_statistics.aspx?year={data.year}"
  />
  <meta
    property="og:title"
    content="IMO {data.year} — Statistics | IMO Mirror"
  />
  <meta
    property="og:description"
    content="Score distribution statistics for the {data.year} International Mathematical Olympiad. Problem-by-problem analysis."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/year_statistics.aspx?year={data.year}"
  />
  <meta
    name="twitter:title"
    content="IMO {data.year} — Statistics | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="Score distribution statistics for the {data.year} International Mathematical Olympiad. Problem-by-problem analysis."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Timeline", href: "/organizers.aspx" },
    { name: `IMO ${data.year}`, href: `/year_info.aspx?year=${data.year}` },
    { name: "Statistics", href: `/year_statistics.aspx?year=${data.year}` },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="IMO {data.year} — Statistics"
    navItems={yearNavItems(data.year)}
    currentPath="/year_statistics.aspx?year={data.year}"
    prevHref={data.prevYear
      ? `/year_statistics.aspx?year=${data.prevYear.year}`
      : undefined}
    nextHref={data.nextYear
      ? `/year_statistics.aspx?year=${data.nextYear.year}`
      : undefined}
  />

  {#if data.hasResults}
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

  {#if data.stats && data.problemKeys.length > 0 && Object.keys(data.problemDistData).length > 0}
    <div class="stats-section">
      <h3>Per-Problem Score Distribution</h3>
      <PillPicker
        items={data.problemKeys.map((k, i) => ({
          key: k,
          label: data.problemHeaders[i],
        }))}
        active={activeProblem ?? ""}
        onSelect={(k) => {
          activeProblem = k;
        }}
      />
      <div class="chart-wrapper">
        {#key activeProblem}
          <BarChart
            data={activeProblemData}
            xKey="score"
            yKey="count"
            title={activeProblemLabel}
            tooltipFn={problemTooltip}
            xLabel="Score"
            barColor={CHART_COLORS.accent}
            height={300}
          />
        {/key}
      </div>
    </div>
  {/if}

  {#if data.dayPoints.length > 0}
    <div class="stats-section">
      <h3>Day 1 vs Day 2</h3>
      <ScatterGrid
        leftLabel={data.dayScoreCorrVal}
        rightLabel={data.dayRankCorrVal}
      >
        {#snippet left()}
          <ScatterChart
            data={data.dayPoints}
            xKey="day1"
            yKey="day2"
            xLabel="Day 1 Score"
            yLabel="Day 2 Score"
            title="Scores"
            xMin={0}
            xMax={21}
            yMin={0}
            yMax={21}
            tooltipFn={scatterTooltip}
          />
        {/snippet}
        {#snippet right()}
          <ScatterChart
            data={data.dayPoints}
            xKey="day1rank"
            yKey="day2rank"
            xLabel="Day 1 Rank"
            yLabel="Day 2 Rank"
            title="Ranks"
            xMin={1}
            xMax={maxRank}
            yMin={1}
            yMax={maxRank}
            invertX
            invertY
            tooltipFn={scatterTooltip}
          />
        {/snippet}
      </ScatterGrid>
    </div>
  {/if}

  {#if data.stats}
    {#each data.sections as section (section.title)}
      <div class="stats-section">
        <h3>{section.title}</h3>
        <DataTable data={section.rows}>
          {#snippet header()}
            <thead>
              <tr>
                <th></th>
                {#each data.problemHeaders as h, i (i)}
                  <th class="text-center min-w-[5em]" title="Problem {i + 1}"
                    >{h}</th
                  >
                {/each}
              </tr>
            </thead>
          {/snippet}
          {#snippet row(entry)}
            <td class="whitespace-nowrap font-medium">{entry[0]}</td>
            {#each data.problemKeys as key (key)}
              <td class="text-center min-w-[5em]">{entry[1][key]}</td>
            {/each}
          {/snippet}
        </DataTable>
      </div>
    {/each}
  {:else}
    <p>No statistics available for this year.</p>
  {/if}
</div>
