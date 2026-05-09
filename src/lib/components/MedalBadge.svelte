<script lang="ts">
  let {
    type,
    count,
    label = undefined,
  }: {
    type: "gold" | "silver" | "bronze" | "hm";
    count: number;
    label?: string | undefined;
  } = $props();

  const labels: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    hm: "HM",
  };

  const colors = {
    gold: {
      bg: "var(--color-medal-gold-bg)",
      fg: "var(--color-medal-gold-fg)",
    },
    silver: {
      bg: "var(--color-medal-silver-bg)",
      fg: "var(--color-medal-silver-fg)",
    },
    bronze: {
      bg: "var(--color-medal-bronze-bg)",
      fg: "var(--color-medal-bronze-fg)",
    },
    hm: {
      bg: "var(--color-medal-hm-bg)",
      fg: "var(--color-medal-hm-fg)",
    },
  };

  let c = $derived(colors[type]);
</script>

<span class="badge" style:background={c.bg} style:color={c.fg}>
  {count}
  {label || labels[type]}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: var(--radius-badge);
    font-size: 13px;
    font-weight: 500;
  }
</style>
