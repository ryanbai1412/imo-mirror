<script lang="ts">
  let {
    visible = false,
    x = 0,
    y = 0,
    html = "",
  }: {
    visible?: boolean;
    x?: number;
    y?: number;
    html?: string;
  } = $props();
</script>

<div class="chart-tooltip" class:visible style="left:{x}px;top:{y}px">
  {@html html}
</div>

<style>
  .chart-tooltip {
    position: fixed;
    pointer-events: none;
    z-index: 1000;
    background: var(--color-surface);
    border: 1px solid var(--color-chart-grid);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    opacity: 0;
    transition: opacity 0.12s ease;
    max-width: 420px;
    white-space: normal;
    word-break: break-word;
  }
  .chart-tooltip.visible {
    opacity: 1;
  }
  .chart-tooltip :global(.chart-tooltip-row) {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chart-tooltip :global(.chart-tooltip-swatch) {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .chart-tooltip :global(.chart-tooltip-meta) {
    font-size: 11px;
    color: var(--color-text-muted);
  }
</style>
