<script lang="ts">
  import type { Snippet } from "svelte";
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
  } = $props();
</script>

<div class="table-container">
  <table class="data-table{tableClass ? ` ${tableClass}` : ''}">
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
    -webkit-overflow-scrolling: touch;
  }
  @media (min-width: 768px) {
    .table-container {
      overflow-x: visible;
    }
  }
  .table-container :global(.data-table th) {
    position: sticky;
    top: var(--header-h, 56px);
    z-index: 2;
  }
</style>
