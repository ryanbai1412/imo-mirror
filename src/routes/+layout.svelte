<script lang="ts">
  import "$lib/data-store";
  import "../app.css";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import Icon from "$lib/components/Icon.svelte";
  import CommandPalette from "$lib/components/CommandPalette.svelte";

  const NAV_ITEMS = [
    {
      label: "Timeline",
      href: "/organizers.aspx",
      prefixes: [
        "/organizers.aspx",
        "/year_info.aspx",
        "/year_country_r.aspx",
        "/year_individual_r.aspx",
        "/year_statistics.aspx",
      ],
    },
    {
      label: "Countries",
      href: "/countries.aspx",
      prefixes: [
        "/countries.aspx",
        "/country_info.aspx",
        "/country_team_r.aspx",
        "/country_individual_r.aspx",
        "/country_hall.aspx",
        "/team_r.aspx",
      ],
    },
    {
      label: "Results",
      href: "/results_country.aspx",
      prefixes: [
        "/results_country.aspx",
        "/results_year.aspx",
        "/results_matrix.aspx",
      ],
    },
    {
      label: "Hall of Fame",
      href: "/hall.aspx",
      prefixes: ["/hall.aspx", "/hall_of_fame.aspx", "/participant_r.aspx"],
    },
    {
      label: "Statistics",
      href: "/statistics.aspx",
      prefixes: ["/statistics.aspx"],
    },
  ];

  let { children }: { children: Snippet } = $props();

  let menuOpen = $state(false);
  let headerEl = $state<HTMLElement | undefined>(undefined);

  let currentPath = $derived(page.url.pathname);
  let isActive = $derived((item: (typeof NAV_ITEMS)[number]) =>
    item.prefixes.some((p) => currentPath === p)
  );

  // Close mobile menu on navigation
  $effect(() => {
    if (currentPath) menuOpen = false;
  });

  onMount(() => {
    function updateHeaderH() {
      if (headerEl) {
        document.documentElement.style.setProperty(
          "--header-h",
          headerEl.offsetHeight + "px"
        );
      }
    }
    updateHeaderH();
    window.addEventListener("resize", updateHeaderH);
    return () => window.removeEventListener("resize", updateHeaderH);
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap"
    rel="stylesheet"
  />
  <meta property="og:site_name" content="IMO Mirror" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<div class="flex min-h-screen flex-col">
  <header
    bind:this={headerEl}
    class="sticky top-0 z-50 bg-navy text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
  >
    <div
      class="mx-auto flex h-14 max-w-[1140px] items-center justify-between px-4 md:px-6"
    >
      <a
        href="/"
        class="flex items-center gap-2.5 text-white no-underline hover:text-gold-light"
      >
        <img
          src="/imo-logo.webp"
          alt="IMO Logo"
          class="h-9 w-auto shrink-0 rounded-sm"
          width="106"
          height="73"
        />
        <span
          class="hidden font-display text-xl font-normal tracking-[0.01em] whitespace-nowrap sm:block"
        >
          International Mathematical Olympiad
        </span>
        <span class="font-display text-base font-normal sm:hidden">IMO</span>
      </a>

      <!-- Desktop nav -->
      <nav aria-label="Main navigation" class="hidden items-center md:flex">
        {#each NAV_ITEMS as item (item.href)}
          <a href={item.href} class="nav-link" class:active={isActive(item)}
            >{item.label}</a
          >
        {/each}
        <button
          id="cmd-trigger"
          class="search-trigger"
          aria-label="Search (Cmd+K)"
        >
          <Icon name="Search" size={13} />
          <span>Search</span>
          <kbd class="search-kbd">⌘K</kbd>
        </button>
      </nav>

      <!-- Mobile actions -->
      <div class="flex items-center gap-1 md:hidden">
        <button
          class="mobile-toggle"
          aria-label="Search"
          onclick={() => {
            document.getElementById("cmd-trigger")?.click();
          }}
        >
          <Icon name="Search" size={18} />
        </button>
        <button
          class="mobile-toggle"
          aria-label="Toggle menu"
          onclick={() => (menuOpen = !menuOpen)}
        >
          {#if menuOpen}
            <Icon name="X" size={20} />
          {:else}
            <Icon name="Menu" size={20} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile menu panel -->
    {#if menuOpen}
      <nav
        aria-label="Mobile navigation"
        class="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden"
      >
        {#each NAV_ITEMS as item (item.href)}
          <a
            href={item.href}
            class="mobile-nav-link"
            class:active={isActive(item)}>{item.label}</a
          >
        {/each}
        <button
          id="cmd-trigger-mobile"
          class="mobile-search-btn"
          aria-label="Search"
          onclick={() => {
            menuOpen = false;
            document.getElementById("cmd-trigger")?.click();
          }}
        >
          <Icon name="Search" size={16} />
          <span>Search</span>
        </button>
      </nav>
    {/if}
  </header>

  <main
    class="site-main mx-auto w-full max-w-[1140px] flex-1 px-4 pt-5 pb-8 md:px-6 md:pt-8 md:pb-12"
  >
    {@render children()}
  </main>

  <footer class="mt-auto bg-navy px-6 py-6 text-center text-xs text-white/50">
    <div
      class="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-4 md:flex-row md:gap-4"
    >
      <span
        >Static mirror of <a
          href="https://www.imo-official.org"
          class="text-white/70 hover:text-gold-light hover:no-underline"
          target="_blank"
          rel="noopener noreferrer">imo-official.org</a
        ></span
      >
      <span
        >This site is <a
          href="https://github.com/ryanbai1412/imo-mirror"
          class="text-white/70 hover:text-gold-light hover:no-underline"
          target="_blank"
          rel="noopener noreferrer">open source</a
        >.</span
      >
      <span
        ><a
          href="https://github.com/ryanbai1412/imo-mirror/issues/new"
          class="text-white/70 hover:text-gold-light hover:no-underline"
          target="_blank"
          rel="noopener noreferrer">Report a bug</a
        ></span
      >
    </div>
  </footer>
</div>

<CommandPalette />

<style>
  .nav-link {
    white-space: nowrap;
    border-radius: 4px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.75);
    transition: all 150ms ease;
    text-decoration: none;
  }
  .nav-link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
    text-decoration: none;
  }
  .nav-link.active {
    color: var(--color-gold-light);
  }
  .search-trigger {
    margin-left: 6px;
    display: flex;
    cursor: pointer;
    opacity: 0.4;
    pointer-events: none;
    align-items: center;
    gap: 6px;
    border-radius: var(--radius-default);
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.08);
    padding: 4px 10px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.55);
    transition:
      opacity 200ms ease,
      border-color 150ms ease,
      background 150ms ease,
      color 150ms ease;
  }
  :global(.search-ready) .search-trigger {
    opacity: 1;
    pointer-events: auto;
  }
  .search-trigger:hover {
    border-color: rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.85);
  }
  .search-kbd {
    margin-left: 2px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.1);
    padding: 1px 4px;
    font-family: var(--font-body);
    font-size: 11px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.45);
  }
  .mobile-toggle {
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 8px;
    color: rgba(255, 255, 255, 0.75);
    transition:
      color 150ms ease,
      background 150ms ease;
  }
  .mobile-toggle:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
  .mobile-nav-link {
    display: flex;
    min-height: 44px;
    align-items: center;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    transition: all 150ms ease;
    text-decoration: none;
  }
  .mobile-nav-link:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
    text-decoration: none;
  }
  .mobile-nav-link.active {
    color: var(--color-gold-light);
  }
  .mobile-search-btn {
    display: flex;
    min-height: 44px;
    cursor: pointer;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    border: 0;
    background: transparent;
    padding: 10px 12px;
    font-family: var(--font-body);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    transition: all 150ms ease;
  }
  .mobile-search-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
</style>
