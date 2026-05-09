<script lang="ts">
  import type { Snippet } from "svelte";
  import "$lib/styles/chart-layout.css";

  let {
    leftLabel = "",
    rightLabel = "",
    left,
    right,
  }: {
    leftLabel?: string;
    rightLabel?: string;
    left: Snippet;
    right: Snippet;
  } = $props();
</script>

<div class="scatter-grid">
  <div class="scatter-cell">
    {#if leftLabel}
      <div class="scatter-corr">{leftLabel}</div>
    {/if}
    <div class="chart-wrapper">
      {@render left()}
    </div>
  </div>
  <div class="scatter-cell">
    {#if rightLabel}
      <div class="scatter-corr">{rightLabel}</div>
    {/if}
    <div class="chart-wrapper">
      {@render right()}
    </div>
  </div>
</div>

<style>
  .scatter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 12px;
  }
  .scatter-cell {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .scatter-corr {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-navy-mid);
    background: var(--color-cream);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    padding: 3px 14px;
    margin-bottom: 8px;
    letter-spacing: 0.02em;
    align-self: center;
    min-height: 22px;
  }
  @media (max-width: 768px) {
    .scatter-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
</style>
