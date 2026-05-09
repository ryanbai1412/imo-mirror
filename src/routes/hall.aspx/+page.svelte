<script lang="ts">
  import DataTable from "$lib/components/DataTable.svelte";
  import CountryLink from "$lib/components/CountryLink.svelte";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cols = [
    { key: "name", label: "Name" },
    { key: "country_code", label: "Country" },
    {
      key: "participations",
      label: "Part.",
      title: "Participations",
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
      key: "special_prizes",
      label: "Special Prizes",
      align: "center",
      defaultOrder: "desc" as const,
    },
    {
      key: "perfect_scores",
      label: "Perfect Scores",
      align: "center",
      defaultOrder: "desc" as const,
    },
  ];
</script>

<svelte:head>
  <title>Hall of Fame | IMO Mirror</title>
  <meta
    name="description"
    content="Top performers at the International Mathematical Olympiad. Gold medalists, perfect scorers, and record holders across all years."
  />
  <link rel="canonical" href="https://imo-mirror.org/hall.aspx" />
  <meta property="og:title" content="Hall of Fame | IMO Mirror" />
  <meta
    property="og:description"
    content="Top performers at the International Mathematical Olympiad. Gold medalists, perfect scorers, and record holders across all years."
  />
  <meta property="og:url" content="https://imo-mirror.org/hall.aspx" />
  <meta name="twitter:title" content="Hall of Fame | IMO Mirror" />
  <meta
    name="twitter:description"
    content="Top performers at the International Mathematical Olympiad. Gold medalists, perfect scorers, and record holders across all years."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Hall of Fame", href: "/hall.aspx" },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <h1>Hall of Fame</h1>
  <DataTable
    data={data.entries}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
  >
    {#snippet row(entry)}
      <td
        >{#if entry.participant_id}<a
            href="/participant_r.aspx?id={entry.participant_id}">{entry.name}</a
          >{:else}{entry.name}{/if}</td
      >
      <td><CountryLink code={entry.country_code} /></td>
      <td class="text-center">{entry.participations}</td>
      <td class="text-center"
        >{#if entry.gold > 0}<span class="award-gold-medal">{entry.gold}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if entry.silver > 0}<span class="award-silver-medal"
            >{entry.silver}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if entry.bronze > 0}<span class="award-bronze-medal"
            >{entry.bronze}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if entry.hm > 0}<span class="award-honourable-mention"
            >{entry.hm}</span
          >{/if}</td
      >
      <td class="text-center">{entry.special_prizes || ""}</td>
      <td class="text-center">{entry.perfect_scores || ""}</td>
    {/snippet}
  </DataTable>
</div>
