<script lang="ts">
  import type { Snippet } from "svelte";
  import ArrowLink from "./ArrowLink.svelte";

  let {
    title,
    navItems,
    currentPath,
    prevHref = undefined,
    nextHref = undefined,
    titleContent,
    right,
  }: {
    title: string;
    navItems: {
      label: string;
      shortLabel?: string;
      href: string;
    }[];
    currentPath: string;
    prevHref?: string | undefined;
    nextHref?: string | undefined;
    titleContent?: Snippet;
    right?: Snippet;
  } = $props();

  let hasArrows = $derived(prevHref || nextHref);
</script>

<div class="mb-6">
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      {#if hasArrows}
        <div class="mb-5 inline-flex items-center gap-3.5">
          {#if prevHref}<ArrowLink href={prevHref} direction="prev" />{/if}
          <h1 class="mb-0">
            {#if titleContent}{@render titleContent()}{:else}{title}{/if}
          </h1>
          {#if nextHref}<ArrowLink href={nextHref} direction="next" />{/if}
        </div>
      {:else}
        <h1 class="mb-5">
          {#if titleContent}{@render titleContent()}{:else}{title}{/if}
        </h1>
      {/if}
      <div class="pill-nav-scroll">
        <nav class="pill-nav">
          {#each navItems as item (item.href)}
            <a href={item.href} class:active={currentPath === item.href}>
              {#if item.shortLabel}
                <span class="label-short">{item.shortLabel}</span>
                <span class="label-full">{item.label}</span>
              {:else}
                {item.label}
              {/if}
            </a>
          {/each}
        </nav>
      </div>
    </div>
    {@render right?.()}
  </div>
</div>

<style>
  .pill-nav-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .pill-nav-scroll::-webkit-scrollbar {
    display: none;
  }
  .pill-nav {
    display: flex;
    width: fit-content;
    border-radius: var(--radius-default);
    border: 1px solid var(--color-border);
    overflow: hidden;
  }
  .pill-nav a {
    padding: 7px 18px;
    border: none;
    background: var(--color-surface);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    text-decoration: none;
    transition: all 150ms ease;
    font-family: var(--font-body);
    white-space: nowrap;
  }
  .pill-nav a + a {
    border-left: 1px solid var(--color-border);
  }
  .pill-nav a:hover {
    background: var(--color-surface-hover);
    text-decoration: none;
  }
  .pill-nav a.active {
    background: var(--color-navy);
    color: var(--color-surface);
  }
  .label-full {
    display: none;
  }
  @media (max-width: 767px) {
    .pill-nav a {
      padding: 7px 14px;
      font-size: 12px;
    }
  }
  @media (min-width: 768px) {
    .label-short {
      display: none;
    }
    .label-full {
      display: inline;
    }
  }
</style>
