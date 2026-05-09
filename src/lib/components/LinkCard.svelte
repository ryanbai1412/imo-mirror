<script lang="ts">
  let {
    href,
    title,
    description,
  }: {
    href: string;
    title: string;
    description: string;
  } = $props();
</script>

<a
  {href}
  class="block text-inherit no-underline hover:text-inherit hover:no-underline"
>
  <div class="card">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
</a>

<style>
  .card {
    padding: 20px 24px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-default);
    box-shadow: var(--shadow-sm);
    transition: all 150ms ease;
  }
  .card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border);
  }
  h3 {
    margin: 0 0 10px;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    color: var(--color-navy);
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.625;
    color: var(--color-text-secondary);
  }
</style>
