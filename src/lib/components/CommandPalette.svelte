<script lang="ts">
  import { onMount, tick } from "svelte";
  import { goto } from "$app/navigation";
  import Icon, { type IconName } from "./Icon.svelte";
  import countriesData from "$lib/data/countries.json";
  import timelineData from "$lib/data/timeline.json";
  import { individualResults, countryResults } from "$lib/data-store";

  interface SearchItem {
    title: string;
    subtitle: string;
    href: string;
    type: "page" | "country" | "year" | "person";
    keywords: string;
    displaySuffix: string;
  }

  const PREFIXES: Record<string, SearchItem["type"]> = {
    "pg:": "page",
    "p:": "person",
    "c:": "country",
    "y:": "year",
  };

  const TIPS: {
    prefix: string;
    type: SearchItem["type"];
    desc: string;
    icon: IconName;
  }[] = [
    {
      prefix: "p:",
      type: "person",
      desc: "Search people (contestants)",
      icon: "User",
    },
    { prefix: "c:", type: "country", desc: "Search countries", icon: "Globe" },
    { prefix: "y:", type: "year", desc: "Search years", icon: "Calendar" },
    { prefix: "pg:", type: "page", desc: "Search pages", icon: "FileText" },
  ];

  let open = $state(false);
  let query = $state("");
  let results = $state<SearchItem[]>([]);
  let activeIndex = $state(-1);
  let showTips = $state(true);
  let loading = $state(false);
  let inputEl = $state<HTMLInputElement | undefined>(undefined);
  let resultsEl = $state<HTMLDivElement | undefined>(undefined);

  // --- Progressive search index ---
  // Phase 1: pages + countries + years (instant)
  // Phase 2: country@year + participants (async)

  let phase1Items = $state<SearchItem[]>([]);
  let phase2Items = $state<SearchItem[] | null>(null);
  let phase2Promise: Promise<void> | null = null;

  function buildPhase1(): SearchItem[] {
    const items: SearchItem[] = [];

    // Static pages
    const pages: [string, string, string][] = [
      ["Timeline", "IMO editions by year", "/organizers.aspx"],
      ["Countries", "All participating countries", "/countries.aspx"],
      [
        "Results by Country",
        "Country-level result summaries",
        "/results_country.aspx",
      ],
      ["Results by Year", "Year-level result summaries", "/results_year.aspx"],
      [
        "Results Matrix",
        "Country rankings across years",
        "/results_matrix.aspx",
      ],
      ["Hall of Fame", "Top IMO performers", "/hall.aspx"],
      ["Statistics", "Cross-year IMO statistics", "/statistics.aspx"],
    ];
    for (const [t, s, h] of pages) {
      items.push({
        title: t,
        subtitle: s,
        href: h,
        type: "page",
        keywords: "",
        displaySuffix: "",
      });
    }

    // Countries (4 entries each)
    for (const c of countriesData) {
      const sub = `Country \u2022 ${c.code}`;
      items.push({
        title: c.name,
        subtitle: sub,
        href: `/country_info.aspx?code=${c.code}`,
        type: "country",
        keywords: c.code,
        displaySuffix: "",
      });
      items.push({
        title: `${c.name} \u2014 Individual Results`,
        subtitle: sub,
        href: `/country_individual_r.aspx?code=${c.code}`,
        type: "country",
        keywords: `${c.code} individual`,
        displaySuffix: "",
      });
      items.push({
        title: `${c.name} \u2014 Team Results`,
        subtitle: sub,
        href: `/country_team_r.aspx?code=${c.code}`,
        type: "country",
        keywords: `${c.code} team`,
        displaySuffix: "",
      });
      items.push({
        title: `${c.name} \u2014 Hall of Fame`,
        subtitle: sub,
        href: `/country_hall.aspx?code=${c.code}`,
        type: "country",
        keywords: `${c.code} hall fame`,
        displaySuffix: "",
      });
    }

    // Years (4 entries each)
    for (const e of timelineData) {
      if (!e.year) continue;
      const loc = e.city ? `${e.city}, ${e.country}` : e.country;
      items.push({
        title: `IMO ${e.year}`,
        subtitle: loc,
        href: `/year_info.aspx?year=${e.year}`,
        type: "year",
        keywords: "",
        displaySuffix: "",
      });
      items.push({
        title: `IMO ${e.year} \u2014 Country Results`,
        subtitle: loc,
        href: `/year_country_r.aspx?year=${e.year}`,
        type: "year",
        keywords: "country team",
        displaySuffix: "",
      });
      items.push({
        title: `IMO ${e.year} \u2014 Individual Results`,
        subtitle: loc,
        href: `/year_individual_r.aspx?year=${e.year}`,
        type: "year",
        keywords: "individual",
        displaySuffix: "",
      });
      items.push({
        title: `IMO ${e.year} \u2014 Statistics`,
        subtitle: loc,
        href: `/year_statistics.aspx?year=${e.year}`,
        type: "year",
        keywords: "statistics stats",
        displaySuffix: "",
      });
    }

    return items;
  }

  async function buildPhase2(): Promise<SearchItem[]> {
    const [indiv, cby] = await Promise.all([individualResults, countryResults]);
    const items: SearchItem[] = [];
    const cmap = new Map(
      countriesData.map((c: { code: string; name: string }) => [c.code, c.name])
    );

    // Country @ Year
    for (const [yr, entries] of Object.entries(cby)) {
      for (const e of entries) {
        const name = cmap.get(e.code) || e.country || e.code;
        items.push({
          title: `${name} @ IMO ${yr}`,
          subtitle: `${e.code} \u2022 ${yr}`,
          href: `/team_r.aspx?code=${e.code}&year=${yr}`,
          type: "country",
          keywords: `${e.code} ${yr}`,
          displaySuffix: "",
        });
      }
    }

    // Participants
    const pidInfo = new Map<
      number,
      {
        n: string;
        c: Set<string>;
        p: number;
      }
    >();
    for (const results of Object.values(indiv)) {
      for (const r of results) {
        if (!r.participant_id) continue;
        let info = pidInfo.get(r.participant_id);
        if (!info) {
          info = {
            n: r.name,
            c: new Set(),
            p: 0,
          };
          pidInfo.set(r.participant_id, info);
        }
        if (r.country_code) info.c.add(r.country_code);
        info.p++;
      }
    }
    for (const [pid, info] of pidInfo) {
      const ps = info.p;
      const plural = ps !== 1 ? "s" : "";
      items.push({
        title: info.n,
        subtitle: `Contestant \u00a0\u2022\u00a0 ${ps} participation${plural}`,
        href: `/participant_r.aspx?id=${pid}`,
        type: "person",
        keywords: "",
        displaySuffix: [...info.c].join(", "),
      });
    }

    return items;
  }

  // Build phase 1 immediately (static imports)
  phase1Items = buildPhase1();

  function ensurePhase2(): void {
    if (phase2Promise) return;
    phase2Promise = buildPhase2().then((items) => {
      phase2Items = items;
      // Re-run search if palette is open and
      // user has typed something
      if (open && query.trim()) {
        runSearch();
      }
    });
  }

  function getIndex(): SearchItem[] {
    if (phase2Items) {
      return [...phase1Items, ...phase2Items];
    }
    return phase1Items;
  }

  function stripDiacritics(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function search(q: string, items: SearchItem[]): SearchItem[] {
    if (!q || q.length < 1) return [];

    let query = stripDiacritics(q.toLowerCase().trim());
    let filterType: SearchItem["type"] | null = null;

    for (const [prefix, type] of Object.entries(PREFIXES)) {
      if (query.startsWith(prefix)) {
        filterType = type;
        query = query.slice(prefix.length).trim();
        break;
      }
    }

    if (!query && !filterType) return [];

    const terms = query.split(/\s+/).filter(Boolean);
    const scored: {
      item: SearchItem;
      score: number;
    }[] = [];

    for (const item of items) {
      if (filterType && item.type !== filterType) continue;

      const titleLower = stripDiacritics(item.title.toLowerCase());
      const subtitleLower = stripDiacritics(item.subtitle.toLowerCase());
      const kwLower = stripDiacritics(item.keywords.toLowerCase());

      if (terms.length === 0) {
        scored.push({ item, score: 0 });
        continue;
      }

      let match = true;
      let score = 0;

      for (const term of terms) {
        const inTitle = titleLower.includes(term);
        const inSubtitle = subtitleLower.includes(term);
        const inKeywords = kwLower.includes(term);
        if (!inTitle && !inSubtitle && !inKeywords) {
          match = false;
          break;
        }
        if (inTitle) score += 10;
        if (titleLower.startsWith(term)) score += 20;
        if (titleLower === query) score += 50;
        if (inKeywords && kwLower === term) score += 40;
        if (inKeywords) score += 10;
        if (inSubtitle) score += 2;
      }

      if (match) {
        if (item.type === "page") score += 5;
        if (item.type === "year") score += 20;

        const titleLen = titleLower.length;
        const queryLen = query.length;
        if (titleLen > 0 && queryLen > 0) {
          const ratio = queryLen / titleLen;
          score += Math.round(ratio * 30);
        }

        if (terms.length > 1 && terms.every((t) => titleLower.includes(t))) {
          score += 15;
          let pos = 0;
          const inOrder = terms.every((t) => {
            const i = titleLower.indexOf(t, pos);
            if (i === -1) return false;
            pos = i + t.length;
            return true;
          });
          if (inOrder) score += 25;
        }

        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map((s) => s.item);
  }

  function runSearch() {
    if (query.trim()) {
      results = search(query, getIndex());
      showTips = false;
      loading = !phase2Items;
      activeIndex = results.length > 0 ? 0 : -1;
    } else {
      results = [];
      showTips = true;
      loading = false;
      activeIndex = 0;
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout>;

  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      ensurePhase2();
      runSearch();
    }, 80);
  }

  function openPalette() {
    open = true;
    query = "";
    results = [];
    showTips = true;
    loading = false;
    activeIndex = 0;
    ensurePhase2();
    tick().then(() => inputEl?.focus());
  }

  function closePalette() {
    open = false;
    activeIndex = -1;
  }

  function navigate(href: string) {
    closePalette();
    goto(href);
  }

  function selectTip(prefix: string) {
    query = prefix + " ";
    tick().then(() => {
      inputEl?.focus();
      onInput();
    });
  }

  function getRowCount(): number {
    if (showTips) return TIPS.length;
    return results.length;
  }

  function onKeydown(e: KeyboardEvent) {
    const count = getRowCount();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (count > 0) {
        activeIndex = (activeIndex + 1) % count;
        scrollToActive();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (count > 0) {
        activeIndex = (activeIndex - 1 + count) % count;
        scrollToActive();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showTips && activeIndex >= 0 && activeIndex < TIPS.length) {
        selectTip(TIPS[activeIndex].prefix);
      } else if (activeIndex >= 0 && activeIndex < results.length) {
        navigate(results[activeIndex].href);
      }
    }
  }

  function scrollToActive() {
    tick().then(() => {
      const el = resultsEl?.querySelector(".cmd-row.active");
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function onGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (open) closePalette();
      else openPalette();
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closePalette();
    }
  }

  function iconName(type: SearchItem["type"]): IconName {
    switch (type) {
      case "country":
        return "Globe";
      case "person":
        return "User";
      case "year":
        return "Calendar";
      default:
        return "FileText";
    }
  }

  onMount(() => {
    const trigger = document.getElementById("cmd-trigger");
    trigger?.addEventListener("click", (e) => {
      e.preventDefault();
      openPalette();
    });

    // Mark header as hydrated so CSS un-dims the button
    const header = trigger?.closest("header");
    header?.classList.add("search-ready");
  });
</script>

<svelte:window onkeydown={onGlobalKeydown} />

{#if open}
  <div
    class="cmd-overlay"
    aria-hidden="false"
    role="dialog"
    aria-modal="true"
    aria-label="Global search"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="cmd-backdrop" onclick={closePalette}></div>
    <div class="cmd-dialog">
      <div class="cmd-input-wrapper">
        <span class="cmd-search-icon">
          <Icon name="Search" size={18} />
        </span>
        <input
          bind:this={inputEl}
          bind:value={query}
          oninput={onInput}
          onkeydown={onKeydown}
          type="text"
          placeholder="Search countries, contestants, years..."
          autocomplete="off"
          spellcheck="false"
          class="cmd-input"
        />
        <kbd class="cmd-kbd">ESC</kbd>
      </div>
      <div class="cmd-results" bind:this={resultsEl}>
        {#if showTips}
          <div class="cmd-section-label">Search tips</div>
          {#each TIPS as tip, i (tip.prefix)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="cmd-row"
              class:active={i === activeIndex}
              onclick={() => selectTip(tip.prefix)}
            >
              <div class="cmd-row-icon cmd-icon-{tip.type}">
                <Icon name={tip.icon} size={15} />
              </div>
              <div class="cmd-row-body">
                <span class="cmd-row-prefix">{tip.prefix}</span>
                <span class="cmd-row-sep">&mdash;</span>
                <span class="cmd-row-desc">{tip.desc}</span>
              </div>
              <span class="cmd-row-arrow">
                <Icon name="ChevronRight" size={14} />
              </span>
            </div>
          {/each}
        {:else if results.length === 0 && !loading}
          <div class="cmd-empty">No results found</div>
        {:else if results.length === 0 && loading}
          <div class="cmd-empty cmd-loading">Loading contestants…</div>
        {:else}
          {#each results as item, i (item.href)}
            <a
              href={item.href}
              class="cmd-row"
              class:active={i === activeIndex}
              onclick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
            >
              <div class="cmd-row-icon cmd-icon-{item.type}">
                <Icon name={iconName(item.type)} size={15} />
              </div>
              <div class="cmd-row-body">
                <div class="cmd-row-title">{item.title}</div>
                <div class="cmd-row-subtitle">
                  {item.subtitle}{item.displaySuffix
                    ? ` \u2022 ${item.displaySuffix}`
                    : ""}
                </div>
              </div>
              <span class="cmd-row-arrow">
                <Icon name="ChevronRight" size={14} />
              </span>
            </a>
          {/each}
          {#if loading}
            <div class="cmd-loading-hint">Loading contestants…</div>
          {/if}
        {/if}
      </div>
      <div class="cmd-footer">
        <span class="cmd-footer-hint">
          <kbd>&uarr;</kbd><kbd>&darr;</kbd>
          to navigate
        </span>
        <span class="cmd-footer-hint">
          <kbd>&crarr;</kbd> to select
        </span>
      </div>
    </div>
  </div>
{/if}

<style>
  .cmd-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 20vh;
  }
  .cmd-backdrop {
    position: absolute;
    inset: 0;
    background: var(--color-backdrop);
    backdrop-filter: blur(4px);
    animation: cmd-backdrop-in 300ms ease forwards;
  }
  @keyframes cmd-backdrop-in {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(4px);
    }
  }
  .cmd-dialog {
    position: relative;
    width: 100%;
    max-width: 580px;
    margin: 0 16px;
    background: var(--color-surface);
    border-radius: 12px;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    animation: cmd-spotlight 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes cmd-spotlight {
    0% {
      opacity: 0;
      transform: scale(0.92) translateY(-20px);
      box-shadow:
        0 0 0 0 rgba(201, 168, 76, 0),
        0 25px 50px -12px rgba(0, 0, 0, 0);
    }
    60% {
      opacity: 1;
      transform: scale(1.01) translateY(2px);
      box-shadow:
        0 0 40px 4px rgba(201, 168, 76, 0.15),
        0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
      box-shadow:
        0 0 24px 2px rgba(201, 168, 76, 0.08),
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(0, 0, 0, 0.05);
    }
  }
  .cmd-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
    animation: cmd-input-glow 600ms ease forwards;
  }
  @keyframes cmd-input-glow {
    0% {
      border-bottom-color: var(--color-border);
      box-shadow: inset 0 -1px 0 0 transparent;
    }
    50% {
      border-bottom-color: var(--color-gold);
      box-shadow: inset 0 -1px 8px -2px rgba(201, 168, 76, 0.25);
    }
    100% {
      border-bottom-color: var(--color-border);
      box-shadow: inset 0 -1px 0 0 transparent;
    }
  }
  .cmd-search-icon {
    flex-shrink: 0;
    color: var(--color-text-muted);
    animation: cmd-icon-pop 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes cmd-icon-pop {
    0% {
      transform: scale(0.6) rotate(-15deg);
      opacity: 0;
    }
    60% {
      transform: scale(1.15) rotate(3deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  .cmd-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    font-family: var(--font-body);
    color: var(--color-text-primary);
    background: transparent;
  }
  .cmd-input::placeholder {
    color: var(--color-text-muted);
  }
  .cmd-kbd {
    flex-shrink: 0;
    padding: 2px 6px;
    font-size: 11px;
    font-family: inherit;
    color: var(--color-text-secondary);
    background: var(--color-kbd-bg);
    border: 1px solid var(--color-kbd-border);
    border-radius: 4px;
  }
  .cmd-results {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
  }
  .cmd-empty {
    padding: 32px 16px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 14px;
  }
  .cmd-section-label {
    padding: 10px 14px 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cmd-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--color-navy-mid);
    cursor: pointer;
    text-decoration: none;
    transition: background 80ms ease;
  }
  .cmd-row:hover,
  .cmd-row.active {
    background: var(--color-kbd-bg);
    text-decoration: none;
    color: var(--color-navy-light);
  }
  .cmd-row-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    flex-shrink: 0;
    background: var(--color-icon-bg);
    border: 1px solid var(--color-kbd-border);
    color: var(--color-text-secondary);
  }
  :global(.cmd-row-icon svg) {
    width: 15px;
    height: 15px;
  }
  .cmd-row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .cmd-row-prefix {
    font-weight: 600;
    color: var(--color-navy-light);
  }
  .cmd-row-sep {
    color: var(--color-text-muted);
  }
  .cmd-row-desc {
    color: var(--color-text-secondary);
  }
  .cmd-row-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-navy-light);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .cmd-row-subtitle {
    font-size: 12px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cmd-row-arrow {
    flex-shrink: 0;
    color: var(--color-text-muted);
    font-size: 14px;
    opacity: 0;
    transition: opacity 80ms ease;
  }
  .cmd-row.active .cmd-row-arrow,
  .cmd-row:hover .cmd-row-arrow {
    opacity: 1;
  }
  .cmd-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-icon-bg);
    border-radius: 0 0 12px 12px;
  }
  .cmd-footer-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
  }
  .cmd-footer-hint kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    font-size: 11px;
    font-family: inherit;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 1px solid var(--color-kbd-border);
    border-radius: 4px;
  }
  .cmd-icon-country {
    background: var(--color-type-country-bg);
    border-color: var(--color-type-country-border);
    color: var(--color-type-country);
  }
  .cmd-icon-person {
    background: var(--color-type-person-bg);
    border-color: var(--color-type-person-border);
    color: var(--color-type-person);
  }
  .cmd-icon-year {
    background: var(--color-type-year-bg);
    border-color: var(--color-type-year-border);
    color: var(--color-type-year);
  }
  .cmd-icon-page {
    background: var(--color-type-page-bg);
    border-color: var(--color-type-page-border);
    color: var(--color-type-page);
  }
  .cmd-loading {
    animation: cmd-pulse 1.5s ease infinite;
  }
  .cmd-loading-hint {
    padding: 6px 14px;
    font-size: 12px;
    color: var(--color-text-muted);
    animation: cmd-pulse 1.5s ease infinite;
  }
  @keyframes cmd-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  @media (max-width: 768px) {
    .cmd-overlay {
      padding-top: 10vh;
    }
  }
</style>
