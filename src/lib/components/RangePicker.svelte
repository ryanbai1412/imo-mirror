<script lang="ts">
  let {
    min,
    max,
    start = $bindable(),
    end = $bindable(),
    presets = [],
  }: {
    min: number;
    max: number;
    start: number;
    end: number;
    presets?: { label: string; start: number; end: number }[];
  } = $props();

  function clamp(v: number) {
    if (isNaN(v) || v < min) return min;
    if (v > max) return max;
    return v;
  }

  function apply(s: number, e: number) {
    s = clamp(s);
    e = clamp(e);
    if (s > e) [s, e] = [e, s];
    start = s;
    end = e;
  }

  function onStartChange(ev: Event) {
    const v = parseInt((ev.target as HTMLInputElement).value, 10);
    apply(v, end);
  }

  function onEndChange(ev: Event) {
    const v = parseInt((ev.target as HTMLInputElement).value, 10);
    apply(start, v);
  }
</script>

<div class="range-picker">
  <span class="range-label">Year range:</span>
  <input type="number" {min} {max} value={start} onchange={onStartChange} />
  <span class="range-sep">&ndash;</span>
  <input type="number" {min} {max} value={end} onchange={onEndChange} />
  {#if presets.length > 0}
    <div class="range-presets">
      {#each presets as p (p.label)}
        <button class="range-preset" onclick={() => apply(p.start, p.end)}
          >{p.label}</button
        >
      {/each}
    </div>
  {/if}
</div>

<style>
  .range-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .range-label {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-primary);
  }
  .range-picker input[type="number"] {
    width: 64px;
    padding: 6px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-default);
    background: var(--color-surface);
    font-size: 13px;
    color: var(--color-text-primary);
    text-align: center;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .range-picker input[type="number"]::-webkit-inner-spin-button,
  .range-picker input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .range-sep {
    color: var(--color-text-secondary);
    font-weight: 500;
  }
  .range-presets {
    display: flex;
    gap: 6px;
    margin-left: 8px;
  }
  .range-preset {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    text-decoration: underline;
    text-decoration-color: transparent;
  }
  .range-preset:hover {
    color: var(--color-text-primary);
    text-decoration-color: var(--color-text-secondary);
  }
  @media (max-width: 768px) {
    .range-presets {
      margin-left: 0;
      margin-top: 6px;
    }
  }
</style>
