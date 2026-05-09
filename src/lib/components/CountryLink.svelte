<script lang="ts">
  import { isIndividualContestant } from "$lib/utils/data";

  let {
    code,
    label = undefined,
    year = undefined,
  }: {
    code: string;
    label?: string | undefined;
    year?: string | number | undefined;
  } = $props();

  let codes = $derived(
    code
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  );
  let visibleCodes = $derived(codes.filter((c) => !isIndividualContestant(c)));
  const href = (c: string) =>
    year
      ? `/team_r.aspx?code=${c}&year=${year}`
      : `/country_info.aspx?code=${c}`;
</script>

{#if visibleCodes.length === 1}
  <a href={href(visibleCodes[0])}
    >{label && !isIndividualContestant(codes[0]) ? label : visibleCodes[0]}</a
  >
{:else if visibleCodes.length > 1}
  {#each visibleCodes as c, i (c)}{#if i > 0},
    {/if}<a href={href(c)}>{c}</a>{/each}
{/if}
