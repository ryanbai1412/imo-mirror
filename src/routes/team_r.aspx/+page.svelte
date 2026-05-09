<script lang="ts">
  import AwardLabel from "$lib/components/AwardLabel.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import FlagImg from "$lib/components/FlagImg.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import { CHART_COLORS, STACKED_BAR_ORDER } from "$lib/utils/chartColors";
  import ArrowLink from "$lib/components/ArrowLink.svelte";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { DistBucket, CountryDistBucket } from "$lib/utils/data";
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
  function countryDistTooltip(d: Record<string, unknown>) {
    const b = d as unknown as CountryDistBucket;
    if (!b.count) return "";
    let html = `<b>${b.label} pts</b><br>${b.count} ${b.count === 1 ? "country" : "countries"}`;
    const rl = rankLabel(b.rankMin, b.rankMax);
    if (rl) html += `<br><span class="chart-tooltip-meta">${rl}</span>`;
    return html;
  }
</script>

<svelte:head>
  <title
    >{data.country?.name || data.code} at IMO {data.year} | IMO Mirror</title
  >
  <meta
    name="description"
    content="Results for {data.country?.name ||
      data.code} at the {data.year} International Mathematical Olympiad. Individual scores, rankings, and awards."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/team_r.aspx?year={data.year}&code={data.code}"
  />
  <meta
    property="og:title"
    content="{data.country?.name || data.code} at IMO {data.year} | IMO Mirror"
  />
  <meta
    property="og:description"
    content="Results for {data.country?.name ||
      data.code} at the {data.year} International Mathematical Olympiad. Individual scores, rankings, and awards."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/team_r.aspx?year={data.year}&code={data.code}"
  />
  <meta
    name="twitter:title"
    content="{data.country?.name || data.code} at IMO {data.year} | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="Results for {data.country?.name ||
      data.code} at the {data.year} International Mathematical Olympiad. Individual scores, rankings, and awards."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Countries", href: "/countries.aspx" }, { name: data.country?.name || data.code, href: `/country_info.aspx?code=${data.code}` }, { name: `IMO ${data.year}`, href: `/team_r.aspx?year=${data.year}&code=${data.code}` }])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <div class="mb-4">
    <h1 class="mb-1">
      {#if data.country?.flag_url}<FlagImg
          src={data.country.flag_url}
          alt="{data.country.name} flag"
          size="lg"
        />{/if}
      <a
        href="/country_info.aspx?code={data.code}"
        class="text-text-primary no-underline hover:text-link"
      >
        {data.country?.name || data.code}
      </a>
    </h1>
    <div class="inline-flex items-center gap-3.5">
      {#if data.prevYear}<ArrowLink
          href="/team_r.aspx?code={data.code}&year={data.prevYear.year}"
          direction="prev"
        />{/if}
      <h3 class="m-0 text-2xl">
        <a
          href="/year_info.aspx?year={data.year}"
          class="text-text-secondary no-underline hover:text-link"
          >IMO {data.year}</a
        >
      </h3>
      {#if data.nextYear}<ArrowLink
          href="/team_r.aspx?code={data.code}&year={data.nextYear.year}"
          direction="next"
        />{/if}
    </div>
  </div>

  {#if data.teamResult && (data.teamResult.leader || data.teamResult.deputy_leader)}
    <div class="mb-4 text-[0.95rem]">
      {#if data.teamResult.leader}<p class="my-1">
          <strong>Leader:</strong>
          {data.teamResult.leader}
        </p>{/if}
      {#if data.teamResult.deputy_leader}<p class="my-1">
          <strong>Deputy Leader:</strong>
          {data.teamResult.deputy_leader}
        </p>{/if}
    </div>
  {/if}

  {#if data.teamResult}
    <div class="stats-row">
      {#if data.teamResult.rank}
        <StatCard value={data.teamResult.rank} label="Rank" />
      {/if}
      <StatCard value={data.teamTotal} label="Total Score" />
      <StatCard value={data.teamMembers.length} label="Contestants" />
      {#if (data.teamResult.awards_gold ?? 0) > 0}
        <StatCard
          value={data.teamResult.awards_gold ?? 0}
          label="Gold"
          class="award-gold-medal"
        />
      {/if}
      {#if (data.teamResult.awards_silver ?? 0) > 0}
        <StatCard
          value={data.teamResult.awards_silver ?? 0}
          label="Silver"
          class="award-silver-medal"
        />
      {/if}
      {#if (data.teamResult.awards_bronze ?? 0) > 0}
        <StatCard
          value={data.teamResult.awards_bronze ?? 0}
          label="Bronze"
          class="award-bronze-medal"
        />
      {/if}
      {#if (data.teamResult.awards_hm ?? 0) > 0}
        <StatCard
          value={data.teamResult.awards_hm ?? 0}
          label="HM"
          class="award-honourable-mention"
        />
      {/if}
    </div>
  {/if}

  {#if data.distBuckets.length > 0}
    <div class="charts-row">
      <ChartSection title="Score Distribution">
        <BarChart
          data={data.distBuckets}
          xKey="score"
          layers={STACKED_BAR_ORDER.map((l) => ({
            key: l.key,
            color: l.color,
          }))}
          title=""
          tooltipFn={distTooltip}
          xLabel="Total Score"
          maxLabels={9}
          dotOverlays={data.teamScores
            .filter((s) => s >= 0)
            .reduce(
              (acc, s) => {
                const n = acc.filter((d) => d.score === s).length;
                acc.push({ score: s, idx: n });
                return acc;
              },
              [] as { score: number; idx: number }[]
            )}
          xFormat={(d) =>
            d.score % 5 === 0 || d.score === data.distBuckets.length - 1
              ? String(d.score)
              : ""}
        />
      </ChartSection>
      {#if data.hasCountryResults}
        <ChartSection title="Country Score Distribution">
          <BarChart
            data={data.countryDistData}
            xKey="lo"
            yKey="count"
            title=""
            highlightIdx={data.teamBin}
            highlightColor={CHART_COLORS.gold}
            barColor={CHART_COLORS.line}
            tooltipFn={countryDistTooltip}
            xLabel="Total Score"
            padding={{ top: 20, right: 16, bottom: 48, left: 40 }}
          />
        </ChartSection>
      {/if}
    </div>
  {/if}

  <DataTable data={data.teamMembers}>
    {#snippet header()}
      <thead>
        <tr>
          <th>Contestant</th>
          <th class="text-center" title="Problem 1">P1</th>
          <th class="text-center" title="Problem 2">P2</th>
          <th class="text-center" title="Problem 3">P3</th>
          <th class="text-center" title="Problem 4">P4</th>
          <th class="text-center" title="Problem 5">P5</th>
          <th class="text-center" title="Problem 6">P6</th>
          {#if data.hasP7}<th class="text-center" title="Problem 7">P7</th>{/if}
          <th class="text-center">Total</th>
          <th class="text-center">Rank</th>
          <th>Award</th>
        </tr>
      </thead>
    {/snippet}
    {#snippet row(m)}
      <td
        >{#if m.participant_id}<a
            href="/participant_r.aspx?id={m.participant_id}">{m.name}</a
          >{:else}{m.name}{/if}</td
      >
      <td class="text-center">{m.p1 ?? ""}</td>
      <td class="text-center">{m.p2 ?? ""}</td>
      <td class="text-center">{m.p3 ?? ""}</td>
      <td class="text-center">{m.p4 ?? ""}</td>
      <td class="text-center">{m.p5 ?? ""}</td>
      <td class="text-center">{m.p6 ?? ""}</td>
      {#if data.hasP7}<td class="text-center">{m.p7 ?? ""}</td>{/if}
      <td class="text-center">{m.total ?? ""}</td>
      <td class="text-center">{m.rank ?? ""}</td>
      <td
        >{#if m.award}<AwardLabel award={m.award} />{/if}</td
      >
    {/snippet}
    {#snippet footer()}
      {#if data.teamResult}
        <tr class="border-t-2 border-border bg-icon-bg">
          <td><strong>Team results</strong></td>
          <td class="text-center"
            ><strong>{data.teamResult.p1 ?? ""}</strong></td
          >
          <td class="text-center"
            ><strong>{data.teamResult.p2 ?? ""}</strong></td
          >
          <td class="text-center"
            ><strong>{data.teamResult.p3 ?? ""}</strong></td
          >
          <td class="text-center"
            ><strong>{data.teamResult.p4 ?? ""}</strong></td
          >
          <td class="text-center"
            ><strong>{data.teamResult.p5 ?? ""}</strong></td
          >
          <td class="text-center"
            ><strong>{data.teamResult.p6 ?? ""}</strong></td
          >
          {#if data.hasP7}<td class="text-center"
              ><strong>{data.teamResult.p7 ?? ""}</strong></td
            >{/if}
          <td class="text-center"><strong>{data.teamTotal}</strong></td>
          <td class="text-center"
            ><strong>{data.teamResult.rank ?? ""}</strong></td
          >
          <td></td>
        </tr>
      {/if}
    {/snippet}
  </DataTable>
</div>
