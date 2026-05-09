<script lang="ts">
  import { awardClass, type AwardType } from "$lib/utils/awardClass";

  const LABELS: Record<AwardType, string> = {
    gold: "Gold medal",
    silver: "Silver medal",
    bronze: "Bronze medal",
    hm: "Honourable mention",
    special: "Special prize",
    none: "",
  };

  let { award }: { award: AwardType[] } = $props();

  let medal = $derived(award.find((a) => a !== "special"));
  let hasSpecial = $derived(award.includes("special"));
</script>

{#if medal}<span class={awardClass(award)}>{LABELS[medal]}</span
  >{/if}{#if hasSpecial}{#if medal}{", "}{/if}Special prize{/if}
