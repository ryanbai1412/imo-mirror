<script lang="ts">
  let { items }: { items: { color: string; label: string; line?: boolean }[] } =
    $props();
</script>

<div class="chart-legend">
  {#each items as item (item.label)}
    <span class="legend-item">
      <span
        class="legend-swatch"
        class:legend-line={item.line}
        style="background:{item.color}"
      ></span>
      {item.label}
    </span>
  {/each}
</div>

<style>
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-bottom: 32px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .legend-swatch {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    display: inline-block;
  }
  .legend-line {
    height: 3px;
    border-radius: 2px;
  }
</style>
