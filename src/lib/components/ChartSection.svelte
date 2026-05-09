<script lang="ts">
  import type { Snippet } from "svelte";
  import "$lib/styles/chart-layout.css";

  let {
    title,
    children,
  }: {
    title?: string;
    children: Snippet;
  } = $props();
</script>

<div class="stats-section">
  {#if title}<h3>{title}</h3>{/if}
  <div class="chart-wrapper">
    {@render children()}
  </div>
</div>
