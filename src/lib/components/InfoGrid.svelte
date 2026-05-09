<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    grouped = false,
    children,
  }: {
    grouped?: boolean;
    children: Snippet;
  } = $props();
</script>

{#if grouped}
  <div class="info-grid-group">
    {@render children()}
  </div>
{:else}
  <div class="info-grid">
    {@render children()}
  </div>
{/if}

<style>
  .info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 20px;
    margin: 0 0 16px;
    font-size: 14px;
  }
  .info-grid-group {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0;
    margin: 0 0 16px;
  }
  .info-grid-group > :global(h3) {
    grid-column: 1 / -1;
  }
  .info-grid-group > :global(.info-grid) {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    gap: 6px 20px;
    margin: 0 0 16px;
  }
  .info-grid :global(.info-label),
  .info-grid-group :global(.info-label) {
    font-weight: 600;
    color: var(--color-navy-mid);
    white-space: nowrap;
  }
  .info-grid :global(.info-value),
  .info-grid-group :global(.info-value) {
    color: var(--color-text-primary);
  }
</style>
