<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import FlagImg from "$lib/components/FlagImg.svelte";
  import { countryNavItems } from "$lib/utils/nav";
  import { breadcrumbJsonLd } from "$lib/utils/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cols = [
    { key: "name", label: "Name" },
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
      key: "total_medals",
      label: "Total",
      align: "center",
      defaultOrder: "desc" as const,
    },
  ];
</script>

<svelte:head>
  <title>{data.country?.name || data.code} — Hall of Fame | IMO Mirror</title>
  <meta
    name="description"
    content="Top IMO performers from {data.country?.name ||
      data.code}. Medal counts and participation history for all contestants."
  />
  <link
    rel="canonical"
    href="https://imo-mirror.org/country_hall.aspx?code={data.code}"
  />
  <meta
    property="og:title"
    content="{data.country?.name || data.code} — Hall of Fame | IMO Mirror"
  />
  <meta
    property="og:description"
    content="Top IMO performers from {data.country?.name ||
      data.code}. Medal counts and participation history for all contestants."
  />
  <meta
    property="og:url"
    content="https://imo-mirror.org/country_hall.aspx?code={data.code}"
  />
  <meta
    name="twitter:title"
    content="{data.country?.name || data.code} — Hall of Fame | IMO Mirror"
  />
  <meta
    name="twitter:description"
    content="Top IMO performers from {data.country?.name ||
      data.code}. Medal counts and participation history for all contestants."
  />
  {@html `<script type="application/ld+json">${breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Countries", href: "/countries.aspx" },
    {
      name: data.country?.name || data.code,
      href: `/country_info.aspx?code=${data.code}`,
    },
    { name: "Hall of Fame", href: `/country_hall.aspx?code=${data.code}` },
  ])}</` + "script>"}
</svelte:head>

<div class="page-content">
  <PageHeader
    title="{data.country?.name || data.code} — Hall of Fame"
    navItems={countryNavItems(data.code)}
    currentPath="/country_hall.aspx?code={data.code}"
  >
    {#snippet titleContent()}
      {#if data.country?.flag_url}<FlagImg
          src={data.country.flag_url}
          alt="{data.country.name} flag"
          size="lg"
        />{/if}
      {data.country?.name || data.code} &mdash; Hall of Fame
    {/snippet}
  </PageHeader>

  <DataTable
    data={data.rows}
    {cols}
    url={data.url}
    column={data.column}
    order={data.order}
    freezeCols={1}
  >
    {#snippet row(r)}
      <td><a href="/participant_r.aspx?id={r.id}">{r.name}</a></td>
      <td class="text-center">{r.participations}</td>
      <td class="text-center"
        >{#if r.gold > 0}<span class="award-gold-medal">{r.gold}</span>{/if}</td
      >
      <td class="text-center"
        >{#if r.silver > 0}<span class="award-silver-medal">{r.silver}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.bronze > 0}<span class="award-bronze-medal">{r.bronze}</span
          >{/if}</td
      >
      <td class="text-center"
        >{#if r.hm > 0}<span class="award-honourable-mention">{r.hm}</span
          >{/if}</td
      >
      <td class="text-center">{r.total_medals}</td>
    {/snippet}
  </DataTable>
</div>
