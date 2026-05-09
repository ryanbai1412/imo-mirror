<script lang="ts">
  import ChartSection from "$lib/components/ChartSection.svelte";
  import PillPicker from "$lib/components/PillPicker.svelte";
  import ScatterGrid from "$lib/components/ScatterGrid.svelte";
  import RangePicker from "$lib/components/RangePicker.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import LineChart from "$lib/charts/LineChart.svelte";
  import ScatterChart from "$lib/charts/ScatterChart.svelte";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import { awardColor } from "$lib/charts/_core";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { PageData } from "./$types";
  import type {
    AwardKey,
    CutoffPoint,
    GrowthPoint,
    DayScatterPoint,
  } from "./+page.ts";

  interface CutoffBucket {
    score: number;
    count: number;
    years: number[];
  }
  interface RecipientBucket {
    label: string;
    count: number;
    years: { year: number; count: number; total: number; pct: number }[];
  }
  interface SolveBucket {
    label: string;
    lo: number;
    hi: number;
    count: number;
    years: { year: number; solves: number }[];
  }

  let { data }: { data: PageData } = $props();

  // ─── Year range state ──────────────────
  let rangeStart = $state(2000);
  let rangeEnd = $state(2025);

  $effect(() => {
    rangeEnd = data?.maxYear ?? 2025;
  });

  function inRange(y: number) {
    return y >= rangeStart && y <= rangeEnd;
  }

  // ─── Filtered datasets ────────────────
  let growthFiltered = $derived(data.growthData.filter((d) => inRange(d.year)));
  let cutoffFiltered = $derived(data.cutoffData.filter((d) => inRange(d.year)));
  let medalCountFiltered = $derived(
    data.medalCountData.filter((d) => inRange(d.year))
  );
  let dayScatterFiltered = $derived(
    data.dayScatterAll.filter((d) => inRange(d.year))
  );
  let transitionsFiltered = $derived(
    data.transitionsAll.filter((d) => inRange(d.toYear))
  );
  let backgroundFiltered = $derived(
    data.backgroundAll.filter((d) => inRange(d.year))
  );

  // ─── Medal cutoff picker state ────────
  let activeMedal = $state<"gold" | "silver" | "bronze">("gold");

  let cutoffHistData = $derived(
    (() => {
      const buckets: {
        score: number;
        count: number;
        years: number[];
      }[] = [];
      for (let s = 1; s <= 42; s++) {
        buckets.push({
          score: s,
          count: 0,
          years: [],
        });
      }
      for (const d of cutoffFiltered) {
        const score = d[activeMedal];
        if (score >= 1 && score <= 42) {
          buckets[score - 1].count++;
          buckets[score - 1].years.push(d.year);
        }
      }
      return buckets;
    })()
  );

  let medalLabel = $derived(
    activeMedal.charAt(0).toUpperCase() + activeMedal.slice(1)
  );
  let medalColor = $derived(
    activeMedal === "gold"
      ? CHART_COLORS.gold
      : activeMedal === "silver"
        ? CHART_COLORS.silver
        : CHART_COLORS.bronze
  );

  function cutoffTooltip(d: Record<string, unknown>) {
    const b = d as unknown as CutoffBucket;
    if (!b.count) return "";
    const totalYears = cutoffFiltered.length;
    let cumul = 0;
    for (const h of cutoffHistData) {
      cumul += h.count;
      if (h.score === b.score) break;
    }
    const pctile = totalYears > 0 ? Math.round((cumul / totalYears) * 100) : 0;
    const yrs = b.years
      .slice()
      .sort((a, c) => a - c)
      .join(", ");
    return (
      `<b>${medalLabel} cutoff = ` +
      `${b.score}</b><br>` +
      `${b.count} of ${totalYears} years ` +
      `(${pctile}%)<br>` +
      `<span class="chart-tooltip-meta">${yrs}</span>`
    );
  }

  // ─── Medal recipient picker state ─────
  let activeRecipientLevel = $state<"gold" | "silver" | "bronze">("gold");
  let recipientShowPct = $state(false);

  let recipientHistData = $derived(
    (() => {
      const counts = medalCountFiltered.map((d) => {
        let count: number;
        if (activeRecipientLevel === "gold") count = d.gold;
        else if (activeRecipientLevel === "silver") count = d.gold + d.silver;
        else count = d.gold + d.silver + d.bronze;
        const pct = d.total > 0 ? Math.round((count / d.total) * 100) : 0;
        return { year: d.year, count, total: d.total, pct };
      });

      const allVals = counts.map((d) => (recipientShowPct ? d.pct : d.count));
      if (!allVals.length) return [];
      const minC = Math.min(...allVals);
      const maxC = Math.max(...allVals);
      const range = maxC - minC;
      const binSize =
        range > 200
          ? 20
          : range > 100
            ? 10
            : range > 40
              ? 5
              : range > 15
                ? 2
                : 1;
      const binStart = Math.floor(minC / binSize) * binSize;
      const binEnd = Math.ceil((maxC + 1) / binSize) * binSize;
      const numBins = Math.max(1, (binEnd - binStart) / binSize);

      const buckets: {
        label: string;
        count: number;
        years: typeof counts;
      }[] = [];
      for (let b = 0; b < numBins; b++) {
        const lo = binStart + b * binSize;
        const hi = lo + binSize - 1;
        buckets.push({
          label: binSize === 1 ? String(lo) : `${lo}\u2013${hi}`,
          count: 0,
          years: [],
        });
      }
      for (const c of counts) {
        const val = recipientShowPct ? c.pct : c.count;
        const idx = Math.min(
          Math.floor((val - binStart) / binSize),
          numBins - 1
        );
        buckets[idx].count++;
        buckets[idx].years.push(c);
      }
      return buckets;
    })()
  );

  let recipientLevelLabel = $derived(
    activeRecipientLevel === "gold"
      ? "Gold"
      : activeRecipientLevel === "silver"
        ? "\u2265 Silver"
        : "\u2265 Bronze"
  );
  let recipientBarColor = $derived(
    activeRecipientLevel === "gold"
      ? CHART_COLORS.gold
      : activeRecipientLevel === "silver"
        ? CHART_COLORS.silver
        : CHART_COLORS.bronze
  );

  function recipientTooltip(d: Record<string, unknown>) {
    const rb = d as unknown as RecipientBucket;
    if (!rb.count) return "";
    const unit = recipientShowPct ? "%" : " recipients";
    const totalYears = medalCountFiltered.length;
    const yrs = rb.years
      .slice()
      .sort((a, c) => a.year - c.year)
      .map(
        (e) =>
          e.year +
          " (" +
          e.count +
          (e.total ? ", " + Math.round((e.count / e.total) * 100) + "%" : "") +
          ")"
      )
      .join(", ");
    return (
      `<b>${rb.label}${unit}</b><br>` +
      `${rb.count} of ${totalYears} years<br>` +
      `<span class="chart-tooltip-meta">${yrs}</span>`
    );
  }

  // ─── Growth chart tooltip ─────────────
  function growthTooltip(d: Record<string, unknown>) {
    const g = d as unknown as GrowthPoint;
    return (
      `<b>IMO ${g.year}</b><br>` +
      `<div class="chart-tooltip-row">` +
      `<span class="chart-tooltip-swatch" ` +
      `style="background:${CHART_COLORS.line}">` +
      `</span>Countries: ${g.countries}</div>` +
      `<div class="chart-tooltip-row">` +
      `<span class="chart-tooltip-swatch" ` +
      `style="background:${CHART_COLORS.contestant}"></span>` +
      `Contestants: ${g.contestants}</div>`
    );
  }

  // ─── Cutoff line chart tooltip ────────
  function cutoffLineTooltip(d: Record<string, unknown>) {
    const c = d as unknown as CutoffPoint;
    let html = `<b>IMO ${c.year}</b><br>`;
    if (c.gold != null)
      html +=
        `<div class="chart-tooltip-row">` +
        `<span class="chart-tooltip-swatch" ` +
        `style="background:${CHART_COLORS.gold}">` +
        `</span>Gold: ${c.gold}</div>`;
    if (c.silver != null)
      html +=
        `<div class="chart-tooltip-row">` +
        `<span class="chart-tooltip-swatch" ` +
        `style="background:${CHART_COLORS.silver}">` +
        `</span>Silver: ${c.silver}</div>`;
    if (c.bronze != null)
      html +=
        `<div class="chart-tooltip-row">` +
        `<span class="chart-tooltip-swatch" ` +
        `style="background:${CHART_COLORS.bronze}">` +
        `</span>Bronze: ${c.bronze}</div>`;
    return html;
  }

  // ─── Medal counts stacked bar tooltip ─
  const MEDAL_LAYERS = [
    { key: "gold", color: CHART_COLORS.gold },
    { key: "silver", color: CHART_COLORS.silver },
    { key: "bronze", color: CHART_COLORS.bronze },
    { key: "hm", color: CHART_COLORS.hm },
  ];

  const MEDAL_LABELS: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    hm: "HM",
  };
  interface MedalTimePoint {
    year: number;
    [key: string]: unknown;
  }
  function medalTimeTooltip(d: Record<string, unknown>) {
    const mt = d as unknown as MedalTimePoint;
    let html = `<b>IMO ${mt.year}</b><br>`;
    let running = 0;
    for (const l of MEDAL_LAYERS) {
      const v = (d[l.key] as number) || 0;
      if (!v) continue;
      running += v;
      html +=
        `<div class="chart-tooltip-row">` +
        `<span class="chart-tooltip-swatch" ` +
        `style="background:${l.color}"></span>` +
        `${MEDAL_LABELS[l.key]}: ${v} (top ${running})</div>`;
    }
    return html;
  }

  // ─── Day 1 vs Day 2 scatter ───────────
  function pearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n < 2) return 0;
    let mx = 0,
      my = 0;
    for (let i = 0; i < n; i++) {
      mx += xs[i];
      my += ys[i];
    }
    mx /= n;
    my /= n;
    let num = 0,
      dx2 = 0,
      dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx,
        dy = ys[i] - my;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    const denom = Math.sqrt(dx2 * dy2);
    return denom === 0 ? 0 : num / denom;
  }

  let dayScoreCorr = $derived(
    (() => {
      const d = dayScatterFiltered;
      return pearson(
        d.map((p) => p.day1),
        d.map((p) => p.day2)
      );
    })()
  );
  let dayRankCorr = $derived(
    (() => {
      const d = dayScatterFiltered;
      return pearson(
        d.map((p) => p.day1rank),
        d.map((p) => p.day2rank)
      );
    })()
  );

  let dayScoreCorrLabel = $derived(
    `r = ${dayScoreCorr.toFixed(3)}, ` +
      `r\u00B2 = ${(dayScoreCorr * dayScoreCorr).toFixed(3)}`
  );
  let dayRankCorrLabel = $derived(
    `r = ${dayRankCorr.toFixed(3)}, ` +
      `r\u00B2 = ${(dayRankCorr * dayRankCorr).toFixed(3)}`
  );

  let maxRank = $derived(
    (() => {
      let max = 1;
      for (const d of dayScatterFiltered) {
        if (d.day1rank > max) max = d.day1rank;
        if (d.day2rank > max) max = d.day2rank;
      }
      return max;
    })()
  );

  function makeDayScatterTooltip(
    xLbl: string,
    yLbl: string,
    xField: string,
    yField: string
  ) {
    return (pt: Record<string, unknown>) => {
      const inner = pt.d as Record<string, unknown> | undefined;
      const d = (inner || pt) as unknown as DayScatterPoint & {
        _group?: { x: number; y: number; items: DayScatterPoint[] };
      };
      if (d._group) {
        const g = d._group;
        const n = g.items.length;
        let html =
          `<b>${xLbl}: ${g.x}, ` +
          `${yLbl}: ${g.y}</b><br>` +
          `${n} contestant${n === 1 ? "" : "s"}`;
        if (n <= 8) {
          for (const item of g.items) {
            html +=
              `<br><span style="color:` +
              `${awardColor(item.award, CHART_COLORS)}` +
              `">\u25CF</span> ` +
              `${item.name} (${item.year})`;
          }
        }
        return html;
      }
      const rec = d as unknown as Record<string, unknown>;
      return (
        `<b>${d.name}</b><br>` +
        `${xLbl}: ${rec[xField]}<br>` +
        `${yLbl}: ${rec[yField]}`
      );
    };
  }

  let dayScoreTooltip = $derived(
    makeDayScatterTooltip("Day 1 Score", "Day 2 Score", "day1", "day2")
  );
  let dayRankTooltip = $derived(
    makeDayScatterTooltip("Day 1 Rank", "Day 2 Rank", "day1rank", "day2rank")
  );

  // ─── Transition matrix ────────────────
  const AWARD_LABELS: AwardKey[] = ["gold", "silver", "bronze", "hm", "none"];
  const AWARD_DISPLAY: Record<AwardKey, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    hm: "HM",
    special: "Special",
    none: "None",
  };

  let transitionMatrix = $derived(
    (() => {
      const matrix: Record<string, Record<string, number>> = {};
      for (const r of AWARD_LABELS) {
        matrix[r] = {};
        for (const c of AWARD_LABELS) matrix[r][c] = 0;
      }
      for (const t of transitionsFiltered) {
        matrix[t.from][t.to]++;
      }
      return matrix;
    })()
  );

  // ─── Background table ────────────────
  const BG_COL_LABELS: (AwardKey | "na")[] = [
    "gold",
    "silver",
    "bronze",
    "hm",
    "none",
    "na",
  ];

  let backgroundMatrix = $derived(
    (() => {
      const matrix: Record<string, Record<string, number>> = {};
      for (const r of AWARD_LABELS) {
        matrix[r] = {};
        for (const c of BG_COL_LABELS) matrix[r][c] = 0;
      }
      for (const b of backgroundFiltered) {
        matrix[b.current][b.previous]++;
      }
      return matrix;
    })()
  );

  // ─── Problem solve picker ────────────
  let activeSolveProblem = $state(1);

  let solveHistData = $derived(
    (() => {
      const filtered = data.problemSolvesAll.filter(
        (d) => d.problem === activeSolveProblem && inRange(d.year)
      );
      if (!filtered.length) return [];
      const BUCKET_SIZE =
        activeSolveProblem === 3 || activeSolveProblem === 6 ? 5 : 25;
      let globalMax = 0;
      for (const d of filtered) {
        if (d.solves > globalMax) globalMax = d.solves;
      }
      const numBuckets = Math.floor(globalMax / BUCKET_SIZE) + 1;
      const buckets: {
        label: string;
        lo: number;
        hi: number;
        count: number;
        years: { year: number; solves: number }[];
      }[] = [];
      for (let b = 0; b < numBuckets; b++) {
        const lo = b * BUCKET_SIZE;
        const hi = (b + 1) * BUCKET_SIZE - 1;
        buckets.push({
          label: lo === hi ? String(lo) : `${lo}\u2013${hi}`,
          lo,
          hi,
          count: 0,
          years: [],
        });
      }
      for (const d of filtered) {
        const idx = Math.floor(d.solves / BUCKET_SIZE);
        if (idx >= 0 && idx < numBuckets) {
          buckets[idx].count++;
          buckets[idx].years.push({
            year: d.year,
            solves: d.solves,
          });
        }
      }
      return buckets;
    })()
  );

  function solveTooltip(d: Record<string, unknown>) {
    const sb = d as unknown as SolveBucket;
    if (!sb.count) return "";
    const totalYears = data.problemSolvesAll.filter(
      (x) => x.problem === activeSolveProblem && inRange(x.year)
    ).length;
    let cumul = 0;
    for (const h of solveHistData) {
      if (h.lo <= sb.lo) cumul += h.count;
    }
    const pctile = totalYears > 0 ? Math.round((cumul / totalYears) * 100) : 0;
    const yrs = sb.years
      .slice()
      .sort((a, c) => a.year - c.year)
      .map((e) => `${e.year} (${e.solves})`)
      .join(", ");
    const rangeLabel =
      sb.lo === sb.hi ? `${sb.lo} solves` : `${sb.lo}\u2013${sb.hi} solves`;
    return (
      `<b>P${activeSolveProblem}: ` +
      `${rangeLabel}</b><br>` +
      `${sb.count} of ${totalYears} years ` +
      `(${pctile}%)<br>` +
      `<span class="chart-tooltip-meta">${yrs}</span>`
    );
  }
</script>

<svelte:head>
  <title>IMO Statistics | IMO Mirror</title>
  <meta
    name="description"
    content="Cross-year statistics for the International Mathematical Olympiad: medal cutoffs, day 1 vs day 2 analysis, repeat contestant outcomes, and problem difficulty."
  />
  <link rel="canonical" href="https://imo-mirror.org/statistics.aspx" />
  <meta property="og:title" content="IMO Statistics | IMO Mirror" />
  <meta
    property="og:description"
    content="Cross-year statistics for the International Mathematical Olympiad: medal cutoffs, day 1 vs day 2 analysis, repeat contestant outcomes, and problem difficulty."
  />
  <meta property="og:url" content="https://imo-mirror.org/statistics.aspx" />
  <meta name="twitter:title" content="IMO Statistics | IMO Mirror" />
  <meta
    name="twitter:description"
    content="Cross-year statistics for the International Mathematical Olympiad: medal cutoffs, day 1 vs day 2 analysis, repeat contestant outcomes, and problem difficulty."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Statistics", href: "/statistics.aspx" },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <h1>IMO Statistics</h1>

  <!-- Year range picker -->
  <RangePicker
    min={data.minYear}
    max={data.maxYear}
    bind:start={rangeStart}
    bind:end={rangeEnd}
    presets={[
      { label: "Since 2000", start: 2000, end: data.maxYear },
      { label: "Since 1990", start: 1990, end: data.maxYear },
      { label: "All time", start: data.minYear, end: data.maxYear },
    ]}
  />

  <!-- Participation Growth -->
  <ChartSection title="Participation Growth">
    {#key rangeStart + "-" + rangeEnd}
      <LineChart
        data={growthFiltered}
        lines={[
          {
            key: "countries",
            color: CHART_COLORS.line,
          },
          {
            key: "contestants",
            color: CHART_COLORS.contestant,
          },
        ]}
        rightAxis={{
          key: "contestants",
          color: CHART_COLORS.contestant,
        }}
        yLabel="Countries"
        yLabelRight="Contestants"
        tooltipFn={growthTooltip}
        padding={{
          top: 20,
          right: 52,
          bottom: 36,
          left: 46,
        }}
      />
    {/key}
  </ChartSection>

  <!-- Cutoff + Medal Recipient histograms -->
  <div class="charts-row">
    <div class="stats-section">
      <h3>Medal Cutoffs</h3>
      <PillPicker
        items={[
          { key: "gold", label: "Gold" },
          { key: "silver", label: "Silver" },
          { key: "bronze", label: "Bronze" },
        ]}
        active={activeMedal}
        onSelect={(k) => (activeMedal = k as "gold" | "silver" | "bronze")}
        wide
      />
      <div class="chart-wrapper">
        {#key activeMedal + "-" + rangeStart + "-" + rangeEnd}
          <BarChart
            data={cutoffHistData}
            xKey="score"
            yKey="count"
            title="{medalLabel} Cutoff Distribution"
            tooltipFn={cutoffTooltip}
            xLabel="Cutoff Score"
            barColor={medalColor}
            height={370}
            padding={{
              top: 30,
              right: 16,
              bottom: 66,
              left: 40,
            }}
          />
        {/key}
      </div>
    </div>

    <div class="stats-section">
      <h3>Medal Recipients</h3>
      <div class="recipient-controls">
        <PillPicker
          items={[
            { key: "gold", label: "Gold" },
            { key: "silver", label: "\u2265 Silver" },
            { key: "bronze", label: "\u2265 Bronze" },
          ]}
          active={activeRecipientLevel}
          onSelect={(k) =>
            (activeRecipientLevel = k as "gold" | "silver" | "bronze")}
          wide
        />
        <label class="chart-check">
          <input type="checkbox" bind:checked={recipientShowPct} />
          Use %
        </label>
      </div>
      <div class="chart-wrapper">
        {#key activeRecipientLevel + "-" + recipientShowPct + "-" + rangeStart + "-" + rangeEnd}
          <BarChart
            data={recipientHistData}
            xKey="label"
            yKey="count"
            title="{recipientLevelLabel}{recipientShowPct ? ' (%)' : ''}"
            tooltipFn={recipientTooltip}
            xLabel={recipientShowPct ? "% of contestants" : "Recipients"}
            barColor={recipientBarColor}
            height={370}
            maxLabels={30}
            rotateLabels
            padding={{
              top: 30,
              right: 16,
              bottom: 66,
              left: 40,
            }}
          />
        {/key}
      </div>
    </div>
  </div>

  <!-- Cutoff line + Medal counts row -->
  <div class="charts-row">
    <ChartSection title="Cutoff Scores Over Time">
      {#key rangeStart + "-" + rangeEnd}
        <LineChart
          data={cutoffFiltered}
          lines={[
            {
              key: "gold",
              color: CHART_COLORS.gold,
            },
            {
              key: "silver",
              color: CHART_COLORS.silver,
            },
            {
              key: "bronze",
              color: CHART_COLORS.bronze,
            },
          ]}
          tooltipFn={cutoffLineTooltip}
        />
      {/key}
    </ChartSection>

    <ChartSection title="Medal Counts Over Time">
      {#key rangeStart + "-" + rangeEnd}
        <BarChart
          data={medalCountFiltered}
          xKey="year"
          layers={MEDAL_LAYERS}
          tooltipFn={medalTimeTooltip}
          yStep={50}
          xFormat={(d) => "'" + String(d.year).slice(-2)}
        />
      {/key}
    </ChartSection>
  </div>

  <!-- Day 1 vs Day 2 scatter -->
  {#if dayScatterFiltered.length > 0}
    <div class="stats-section">
      <h3>Day 1 vs Day 2</h3>
      <ScatterGrid leftLabel={dayScoreCorrLabel} rightLabel={dayRankCorrLabel}>
        {#snippet left()}
          {#key rangeStart + "-" + rangeEnd}
            <ScatterChart
              data={dayScatterFiltered}
              xKey="day1"
              yKey="day2"
              xLabel="Day 1 Score"
              yLabel="Day 2 Score"
              title="Scores"
              xMin={0}
              xMax={21}
              yMin={0}
              yMax={21}
              xTicks={3}
              yTicks={3}
              mode="weighted"
              tooltipFn={dayScoreTooltip}
            />
          {/key}
        {/snippet}
        {#snippet right()}
          {#key rangeStart + "-" + rangeEnd}
            <ScatterChart
              data={dayScatterFiltered}
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
              mode="weighted"
              tooltipFn={dayRankTooltip}
            />
          {/key}
        {/snippet}
      </ScatterGrid>
    </div>
  {/if}

  <!-- Repeat Contestant Outcomes (transition) -->
  <div class="stats-section">
    <h3>Repeat Contestant Outcomes</h3>
    <DataTable data={AWARD_LABELS} tableClass="transition-table" freezeCols={1}>
      {#snippet header()}
        <thead>
          <tr>
            <th></th>
            <th class="text-center" title="Next: Gold">&rarr; Gold</th>
            <th class="text-center" title="Next: Silver">&rarr; Silver</th>
            <th class="text-center" title="Next: Bronze">&rarr; Bronze</th>
            <th class="text-center" title="Next: HM">&rarr; HM</th>
            <th class="text-center" title="Next: None">&rarr; None</th>
            <th class="text-center">Total</th>
          </tr>
        </thead>
      {/snippet}
      {#snippet row(r)}
        {@const rowTotal = AWARD_LABELS.reduce(
          (s, c) => s + transitionMatrix[r][c],
          0
        )}
        <td class="row-label">
          {AWARD_DISPLAY[r as AwardKey]} &rarr;
        </td>
        {#each AWARD_LABELS as col (col)}
          {@const count = transitionMatrix[r][col]}
          {@const pct =
            rowTotal > 0 ? ((count / rowTotal) * 100).toFixed(1) : "0.0"}
          {@const frac = rowTotal > 0 ? count / rowTotal : 0}
          <td
            class="text-center"
            title="{count} of {rowTotal} ({pct}%)"
            style:background-color="rgba(180, 130, 50, {(frac * 0.35).toFixed(
              3
            )})"
          >
            {#if count > 0}
              {count}
              <span class="transition-pct">
                ({pct}%)
              </span>
            {:else}
              0
            {/if}
          </td>
        {/each}
        <td class="text-center font-semibold">
          {rowTotal}
        </td>
      {/snippet}
    </DataTable>

    <!-- Contestant Background -->
    <h3 class="mt-8">Contestant Background</h3>
    <DataTable data={AWARD_LABELS} tableClass="transition-table" freezeCols={1}>
      {#snippet header()}
        <thead>
          <tr>
            <th></th>
            <th class="text-center" title="Previous: Gold">&larr; Gold</th>
            <th class="text-center" title="Previous: Silver">&larr; Silver</th>
            <th class="text-center" title="Previous: Bronze">&larr; Bronze</th>
            <th class="text-center" title="Previous: HM">&larr; HM</th>
            <th class="text-center" title="Previous: None">&larr; None</th>
            <th class="text-center" title="First-timer">N/A</th>
            <th class="text-center">Total</th>
          </tr>
        </thead>
      {/snippet}
      {#snippet row(r)}
        {@const rowTotal = BG_COL_LABELS.reduce(
          (s, c) => s + backgroundMatrix[r][c],
          0
        )}
        <td class="row-label">
          {AWARD_DISPLAY[r as AwardKey]}
        </td>
        {#each BG_COL_LABELS as col (col)}
          {@const count = backgroundMatrix[r][col]}
          {@const pct =
            rowTotal > 0 ? ((count / rowTotal) * 100).toFixed(1) : "0.0"}
          {@const frac = rowTotal > 0 ? count / rowTotal : 0}
          <td
            class="text-center"
            title="{count} of {rowTotal} ({pct}%)"
            style:background-color="rgba(180, 130, 50, {(frac * 0.35).toFixed(
              3
            )})"
          >
            {#if count > 0}
              {count}
              <span class="transition-pct">
                ({pct}%)
              </span>
            {:else}
              0
            {/if}
          </td>
        {/each}
        <td class="text-center font-semibold">
          {rowTotal}
        </td>
      {/snippet}
    </DataTable>
  </div>

  <!-- Problem Difficulty -->
  <div class="stats-section">
    <h3>Problem Difficulty</h3>
    <p class="mb-2 text-[13px] text-text-secondary">Solves are ≥ 5 points</p>
    <PillPicker
      items={[1, 2, 3, 4, 5, 6].map((p) => ({
        key: String(p),
        label: `P${p}`,
      }))}
      active={String(activeSolveProblem)}
      onSelect={(k) => (activeSolveProblem = Number(k))}
    />
    <div class="chart-wrapper">
      {#key activeSolveProblem + "-" + rangeStart + "-" + rangeEnd}
        <BarChart
          data={solveHistData}
          xKey="label"
          yKey="count"
          title="P{activeSolveProblem} — Solve Distribution"
          tooltipFn={solveTooltip}
          barColor={CHART_COLORS.accent}
          height={380}
          maxLabels={30}
          rotateLabels
          padding={{
            top: 30,
            right: 16,
            bottom: 76,
            left: 40,
          }}
        />
      {/key}
    </div>
  </div>
</div>

<style>
  :global(.transition-table td) {
    font-variant-numeric: tabular-nums;
    background: white;
  }
  :global(.transition-table tbody tr:nth-child(odd)),
  :global(.transition-table tbody tr:nth-child(even)) {
    background: transparent;
  }
  :global(.transition-table tbody tr:hover) {
    background: transparent;
  }
  .row-label {
    white-space: nowrap;
    font-weight: 500;
  }
  .transition-pct {
    font-size: 0.75em;
    color: var(--color-text-secondary);
  }
  .recipient-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }
  .recipient-controls :global(.pill-picker) {
    margin-bottom: 0;
  }
  .chart-check {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
    user-select: none;
    transition: color 150ms ease;
  }
  .chart-check:hover {
    color: var(--color-text-primary);
  }
  .chart-check input[type="checkbox"] {
    -webkit-appearance: none;
    appearance: none;
    width: 44px;
    height: 24px;
    border-radius: 12px;
    background: var(--color-border);
    position: relative;
    cursor: pointer;
    transition: background 150ms ease;
    flex-shrink: 0;
  }
  .chart-check input[type="checkbox"]::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    transition: transform 150ms ease;
  }
  .chart-check input[type="checkbox"]:checked {
    background: var(--color-navy);
  }
  .chart-check input[type="checkbox"]:checked::after {
    transform: translateX(20px);
  }
</style>
