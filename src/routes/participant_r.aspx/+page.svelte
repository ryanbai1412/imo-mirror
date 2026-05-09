<script lang="ts">
  import CountryLink from "$lib/components/CountryLink.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import ChartSection from "$lib/components/ChartSection.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import AwardLabel from "$lib/components/AwardLabel.svelte";
  import BarChart from "$lib/charts/BarChart.svelte";
  import { CHART_COLORS, STACKED_BAR_ORDER } from "$lib/utils/chartColors";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import "$lib/styles/chart-layout.css";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let p = $derived(data.participant);
  let sortedResults = $derived([...p.results].sort((a, b) => b.year - a.year));

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

  let jsonLd = $derived(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: p.name,
      description: `IMO participant with ${p.results.length} participation(s). ${data.totalGold} gold, ${data.totalSilver} silver, ${data.totalBronze} bronze medals.`,
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tooltipHtml(d: Record<string, any>) {
    const CC = CHART_COLORS;
    const total = medalTotal(d);
    let html = "<b>IMO " + d.year + "</b> (" + total + " contestants)<br>";
    if (d.rank != null) {
      html += "Rank: " + d.rank + " / " + total + "<br>";
    }
    const swatch = (c: string, l: string, v: number) =>
      v
        ? '<span style="color:' + c + '">\u25CF</span> ' + l + ": " + v + "<br>"
        : "";
    html +=
      swatch(CC.gold, "Gold", d.gold) +
      swatch(CC.silver, "Silver", d.silver) +
      swatch(CC.bronze, "Bronze", d.bronze) +
      swatch(CC.none, "None", d.none);
    return html;
  }
</script>

<svelte:head>
  <title>{p.name} | IMO Mirror</title>
  <meta
    name="description"
    content="{p.name} - IMO participant. {p.results
      .length} participation(s), {data.totalGold} gold, {data.totalSilver} silver, {data.totalBronze} bronze medals."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/participant_r.aspx?id={data.id}"
  />
  <meta property="og:title" content="{p.name} | IMO Mirror" />
  <meta
    property="og:description"
    content="{p.name} - IMO participant. {p.results
      .length} participation(s), {data.totalGold} gold, {data.totalSilver} silver, {data.totalBronze} bronze medals."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/participant_r.aspx?id={data.id}"
  />
  <meta name="twitter:title" content="{p.name} | IMO Mirror" />
  <meta
    name="twitter:description"
    content="{p.name} - IMO participant. {p.results
      .length} participation(s), {data.totalGold} gold, {data.totalSilver} silver, {data.totalBronze} bronze medals."
  />
  {@html `<script type="application/ld+json">${jsonLd}</` + "script>"}
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Hall of Fame", href: "/hall.aspx" },
    { name: p.name, href: `/participant_r.aspx?id=${data.id}` },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <div class="mb-6">
    <h1>{p.name}</h1>
    <div class="stats-row">
      {#if data.specialPrizes > 0}
        <StatCard
          value={data.specialPrizes}
          label="Special Prize{data.specialPrizes !== 1 ? 's' : ''}"
        />
      {/if}
      {#if data.perfectScores > 0}
        <StatCard
          value={data.perfectScores}
          label="Perfect Score{data.perfectScores !== 1 ? 's' : ''}"
        />
      {/if}
      {#if data.totalGold > 0}
        <StatCard
          value={data.totalGold}
          label="Gold"
          class="award-gold-medal"
        />
      {/if}
      {#if data.totalSilver > 0}
        <StatCard
          value={data.totalSilver}
          label="Silver"
          class="award-silver-medal"
        />
      {/if}
      {#if data.totalBronze > 0}
        <StatCard
          value={data.totalBronze}
          label="Bronze"
          class="award-bronze-medal"
        />
      {/if}
      {#if data.totalHM > 0}
        <StatCard
          value={data.totalHM}
          label="HM"
          class="award-honourable-mention"
        />
      {/if}
      <StatCard
        value={p.results.length}
        label="Participation{p.results.length !== 1 ? 's' : ''}"
      />
    </div>
  </div>

  {#if data.rankChartData.length > 1}
    <ChartSection title="Individual Ranking">
      <BarChart
        data={data.rankChartData}
        layers={medalLayers}
        title=""
        sumFn={medalTotal}
        tooltipFn={(d) => tooltipHtml(d)}
        xFormat={(d) => "'" + String(d.year).slice(-2)}
        overlayLineKey="rank"
        overlayLineColor={CHART_COLORS.line}
      />
    </ChartSection>
  {/if}

  <DataTable data={sortedResults} freezeCols={1}>
    {#snippet header()}
      <thead>
        <tr>
          <th class="text-center">Year</th>
          <th>Country</th>
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
    {#snippet row(r)}
      <td class="text-center"
        ><a href="/year_info.aspx?year={r.year}">{r.year}</a></td
      >
      <td
        ><CountryLink
          code={r.country_code}
          label={r.country}
          year={r.year}
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
