<script lang="ts">
  import type { Snippet } from "svelte";
  import { getSortUrl, sortIndicator } from "$lib/utils/sort";
  import type { SortDirection } from "$lib/utils/sort";

  interface ColDef {
    key: string;
    label: string;
    title?: string;
    align?: string;
    defaultOrder?: SortDirection;
    sortable?: boolean;
  }

  let {
    cols,
    url,
    column,
    order,
    children,
  }: {
    cols: ColDef[];
    url: URL;
    column: string;
    order: SortDirection;
    children?: Snippet;
  } = $props();
</script>

<thead>
  <tr>
    {#each cols as col (col.key)}
      {@const sortable = col.sortable !== false}
      <th
        class:text-center={col.align === "center"}
        class:sortable-header={sortable}
        title={col.title}
      >
        {#if sortable}
          <a href={getSortUrl(url, col.key, col.defaultOrder)}
            >{col.label}{sortIndicator(col.key, column, order)}</a
          >
        {:else}
          {col.label}
        {/if}
      </th>
    {/each}
    {@render children?.()}
  </tr>
</thead>
