<script lang="ts">
  let {
    items,
    active,
    onSelect,
    wide = false,
  }: {
    items: { key: string; label: string }[];
    active: string;
    onSelect: (key: string) => void;
    wide?: boolean;
  } = $props();
</script>

<div class="pill-picker">
  {#each items as item (item.key)}
    <button
      class="pill"
      class:wide
      class:active={item.key === active}
      onclick={() => onSelect(item.key)}
    >
      {item.label}
    </button>
  {/each}
</div>

<style>
  .pill-picker {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .pill {
    position: relative;
    padding: 6px 0;
    width: 52px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 150ms ease;
    font-family: var(--font-body);
    text-align: center;
    letter-spacing: 0.02em;
    box-shadow: var(--shadow-sm);
  }
  .pill:hover {
    border-color: var(--color-navy-mid);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-default);
  }
  .pill.active {
    background: var(--color-navy);
    border-color: var(--color-navy);
    color: var(--color-surface);
    box-shadow: var(--shadow-md);
  }
  .pill.wide {
    width: 80px;
  }
</style>
