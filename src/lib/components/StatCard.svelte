<script lang="ts">
  let {
    value,
    label,
    class: cls = "",
  }: {
    value: string | number;
    label: string;
    class?: string;
  } = $props();
</script>

<div class="stat-card">
  <span class="stat-value {cls}">{value}</span>
  <span class="stat-label">{label}</span>
</div>

<style>
  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-default);
    background: var(--color-surface);
    min-width: 72px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    font-family: var(--font-display);
    line-height: 1.2;
  }
  .stat-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }
</style>
