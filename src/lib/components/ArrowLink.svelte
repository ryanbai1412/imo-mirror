<script lang="ts">
  let {
    href,
    direction,
  }: {
    href: string;
    direction: "prev" | "next";
  } = $props();
</script>

<a {href} class="arrow-link">
  {#if direction === "prev"}&larr;{:else}&rarr;{/if}
</a>

<style>
  .arrow-link {
    font-size: 22px;
    font-weight: 400;
    color: var(--color-text-muted);
    transition: color 150ms ease;
    text-decoration: none;
  }
  .arrow-link:hover {
    color: var(--color-navy);
  }
</style>
