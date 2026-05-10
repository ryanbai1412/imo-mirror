<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import SortableTableHead from "./SortableTableHead.svelte";
  import type { SortDirection } from "$lib/utils/sort";
  import "$lib/styles/table.css";

  interface ColDef {
    key: string;
    label: string;
    title?: string;
    align?: string;
    defaultOrder?: SortDirection;
    sortable?: boolean;
  }

  let {
    data,
    cols,
    url,
    column,
    order,
    header,
    row,
    footer,
    tableClass,
    rowClass,
    freezeCols = 0,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    cols?: ColDef[];
    url?: URL;
    column?: string;
    order?: SortDirection;
    header?: Snippet;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: Snippet<[any, number]>;
    footer?: Snippet;
    tableClass?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowClass?: (item: any, index: number) => string;
    freezeCols?: number;
  } = $props();

  let tableEl = $state<HTMLTableElement | undefined>(undefined);

  onMount(() => {
    if (freezeCols < 2 || !tableEl) return;
    const firstTh = tableEl.querySelector(
      "th:first-child"
    ) as HTMLElement | null;
    if (!firstTh) return;

    const update = () => {
      tableEl!.style.setProperty(
        "--freeze-col1-w",
        firstTh.getBoundingClientRect().width + "px"
      );
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(firstTh);
    return () => ro.disconnect();
  });
</script>

<div class="table-container">
  <table
    bind:this={tableEl}
    class="data-table{tableClass ? ` ${tableClass}` : ''}"
    data-freeze={freezeCols || undefined}
  >
    {#if cols && url && column !== undefined && order}
      <SortableTableHead {cols} {url} {column} {order} />
    {:else if header}
      {@render header()}
    {/if}
    <tbody>
      {#each data as item, i (i)}
        <tr class={rowClass?.(item, i) ?? ""}>
          {@render row(item, i)}
        </tr>
      {/each}
      {#if footer}
        {@render footer()}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-container {
    margin: 0 0 16px;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 70vh;
    -webkit-overflow-scrolling: touch;
  }
  .table-container :global(.data-table th) {
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .table-container :global(.data-table[data-freeze] th:first-child) {
    z-index: 4;
  }
  .table-container :global(.data-table[data-freeze="2"] th:nth-child(2)) {
    z-index: 4;
  }
  @media (min-width: 768px) {
    .table-container {
      overflow-x: visible;
      overflow-y: visible;
      max-height: none;
    }
    .table-container :global(.data-table th) {
      top: var(--header-h, 56px);
    }
  }
</style>
