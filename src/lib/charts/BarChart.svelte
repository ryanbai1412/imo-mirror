<script lang="ts">
  import ChartTooltip from "./ChartTooltip.svelte";
  import {
    niceMax,
    tickValues,
    thinLabels,
    tooltipPosition,
    barHitIndex,
  } from "./_core";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import "$lib/styles/chart.css";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ChartDatum = Record<string, any>;
  type Layer = { key: string; color: string };
  type OverlayPoint = {
    x: number;
    y: number;
  };
  type DotOverlay = { score: number; idx: number };
  type RankDotEntry = { dataIdx: number; ranks: number[] };

  let {
    data,
    xKey = "year",
    xFormat = undefined,
    yKey = undefined,
    layers = undefined,
    title = "",
    height = 320,
    bandPadding = 0.15,
    yStep = undefined,
    barColor = CHART_COLORS.line,
    highlightIdx = -1,
    highlightColor = CHART_COLORS.gold,
    overlayLineKey = undefined,
    overlayLineColor = CHART_COLORS.line,
    overlayTotalKey = undefined,
    dotOverlays = [] as DotOverlay[],
    dotColor = CHART_COLORS.line,
    rankDots = [] as RankDotEntry[],
    rankDotColor = CHART_COLORS.line,
    tooltipFn,
    sumFn = undefined,
    maxLabels = 15,
    xLabel = "",
    rotateLabels = false,
    padding = {
      top: 20,
      right: 16,
      bottom: 36,
      left: 40,
    },
  }: {
    data: ChartDatum[];
    xKey?: string;
    xFormat?: ((v: ChartDatum) => string) | undefined;
    yKey?: string | undefined;
    layers?: Layer[] | undefined;
    title?: string;
    height?: number;
    bandPadding?: number;
    yStep?: number | undefined;
    barColor?: string;
    highlightIdx?: number;
    highlightColor?: string;
    overlayLineKey?: string | undefined;
    overlayLineColor?: string;
    overlayTotalKey?: string | undefined;
    dotOverlays?: DotOverlay[];
    dotColor?: string;
    rankDots?: RankDotEntry[];
    rankDotColor?: string;
    tooltipFn: (d: ChartDatum, idx: number) => string;
    sumFn?: ((d: ChartDatum) => number) | undefined;
    maxLabels?: number;
    xLabel?: string;
    rotateLabels?: boolean;
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  } = $props();

  // ── Derived layout ──────────────────────────
  let containerW = $state(600);
  let measured = $state(false);
  let W = $derived(containerW);
  let H = $derived(height);
  let pad = $derived(padding);
  let cw = $derived(W - pad.left - pad.right);
  let ch = $derived(H - pad.top - pad.bottom);

  // ── Stacked vs simple ──────────────────────
  let isStacked = $derived(!!layers && layers.length > 0);

  function defaultSum(d: ChartDatum): number {
    if (!layers) return (d[yKey || "_val"] as number) || 0;
    let s = 0;
    for (const l of layers!) s += (d[l.key] as number) || 0;
    return s;
  }

  let sumFunc = $derived(sumFn || defaultSum);

  // ── Y-axis ─────────────────────────────────
  let yMax = $derived(
    (() => {
      const maxVal = data.reduce((m, d) => Math.max(m, sumFunc(d)), 0);
      return niceMax(maxVal, yStep);
    })()
  );

  let yTicks = $derived(tickValues(0, yMax));

  // ── X-axis ─────────────────────────────────
  let labels = $derived(data.map((d) => String(d[xKey])));

  let n = $derived(data.length);

  let step = $derived(cw / (n || 1));
  let bw = $derived(step * (1 - bandPadding));
  let gap = $derived((step - bw) / 2);

  function barX(i: number): number {
    return pad.left + i * step + gap;
  }

  let visibleLabels = $derived(thinLabels(labels, maxLabels));

  // ── Stacked bar geometry ───────────────────
  interface BarRect {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    layerIdx: number;
    dataIdx: number;
  }

  let barRects = $derived(
    (() => {
      const rects: BarRect[] = [];
      if (!isStacked) {
        for (let i = 0; i < n; i++) {
          const val = (data[i][yKey || "_val"] as number) || 0;
          if (!val) continue;
          const h = (val / yMax) * ch;
          const color = i === highlightIdx ? highlightColor : barColor;
          rects.push({
            x: barX(i),
            y: pad.top + ch - h,
            w: bw,
            h,
            color,
            layerIdx: 0,
            dataIdx: i,
          });
        }
      } else {
        for (let i = 0; i < n; i++) {
          let y = pad.top + ch;
          for (let j = 0; j < layers!.length; j++) {
            const val = (data[i][layers![j].key] as number) || 0;
            if (!val) continue;
            const h = (val / yMax) * ch;
            y -= h;
            rects.push({
              x: barX(i),
              y,
              w: bw,
              h,
              color: layers![j].color,
              layerIdx: j,
              dataIdx: i,
            });
          }
        }
      }
      return rects;
    })()
  );

  // ── Overlay line (rank line on bars) ───────
  let overlayPath = $derived(
    (() => {
      if (!overlayLineKey) return "";
      let d = "";
      for (let i = 0; i < n; i++) {
        const rank = data[i][overlayLineKey] as number | null | undefined;
        if (rank == null) continue;
        const total = overlayTotalKey
          ? (data[i][overlayTotalKey] as number) || 0
          : sumFunc(data[i]);
        const rv = Math.min(rank, total);
        const x = barX(i) + bw / 2;
        const y = pad.top + ch - (rv / yMax) * ch;
        d += (d ? "L" : "M") + x + "," + y;
      }
      return d;
    })()
  );

  let overlayDots = $derived(
    (() => {
      if (!overlayLineKey) return [];
      const pts: OverlayPoint[] = [];
      for (let i = 0; i < n; i++) {
        const rank = data[i][overlayLineKey] as number | null | undefined;
        if (rank == null) continue;
        const total = overlayTotalKey
          ? (data[i][overlayTotalKey] as number) || 0
          : sumFunc(data[i]);
        const rv = Math.min(rank, total);
        pts.push({
          x: barX(i) + bw / 2,
          y: pad.top + ch - (rv / yMax) * ch,
        });
      }
      return pts;
    })()
  );

  // ── Hover state ────────────────────────────
  let hoverIdx = $state(-1);
  let tipVisible = $state(false);
  let tipX = $state(0);
  let tipY = $state(0);
  let tipHtml = $state("");

  function onMouseMove(e: MouseEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    if (my < pad.top || my > pad.top + ch) {
      hoverIdx = -1;
      tipVisible = false;
      return;
    }

    const idx = barHitIndex(mx, pad.left, step, n);

    if (idx < 0) {
      hoverIdx = -1;
      tipVisible = false;
      return;
    }

    // Only show tooltip if bar has data
    const total = sumFunc(data[idx]);
    if (!total) {
      hoverIdx = -1;
      tipVisible = false;
      return;
    }

    hoverIdx = idx;
    tipHtml = tooltipFn(data[idx], idx);
    tipVisible = true;

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const pos = tooltipPosition(e.clientX, e.clientY, 180, 60, vpW, vpH);
    tipX = pos.x;
    tipY = pos.y;
  }

  function onMouseLeave() {
    hoverIdx = -1;
    tipVisible = false;
  }

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    onMouseMove({
      currentTarget: e.currentTarget,
      clientX: t.clientX,
      clientY: t.clientY,
    } as unknown as MouseEvent);
  }

  // ── Container resize ──────────────────────
  function measureWidth(node: HTMLDivElement) {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerW = entry.contentRect.width;
      }
    });
    ro.observe(node);
    containerW = node.clientWidth;
    measured = true;
    return { destroy: () => ro.disconnect() };
  }
</script>

<div
  class="chart-container"
  class:chart-loading={!measured}
  use:measureWidth
  style:height="{H + (title ? 20 : 0)}px"
>
  {#if title}
    <div class="chart-title" style:opacity={measured ? 1 : 0}>{title}</div>
  {/if}
  <svg
    viewBox="0 0 {W} {H}"
    class="chart-svg"
    style:opacity={measured ? 1 : 0}
    role="img"
    onmousemove={onMouseMove}
    onmouseleave={onMouseLeave}
    ontouchstart={onTouchStart}
  >
    <!-- Y grid + labels -->
    {#each yTicks as v (v)}
      {@const y = pad.top + ch - (v / yMax) * ch}
      <line
        x1={pad.left}
        y1={y}
        x2={W - pad.right}
        y2={y}
        stroke={CHART_COLORS.grid}
        stroke-width="0.5"
      />
      <text x={pad.left - 6} y={y + 4} text-anchor="end" class="axis-label"
        >{v}</text
      >
    {/each}

    <!-- Hover band highlight -->
    {#if hoverIdx >= 0}
      <rect
        x={pad.left + hoverIdx * step}
        y={pad.top}
        width={step}
        height={ch}
        fill="rgba(0,0,0,0.04)"
      />
    {/if}

    <!-- Bars -->
    {#each barRects as r (r.dataIdx + "-" + r.layerIdx)}
      <rect
        x={r.x}
        y={r.y}
        width={r.w}
        height={r.h}
        fill={r.color}
        class="bar-rect"
        opacity={1}
      />
    {/each}

    <!-- Dot overlays (team member scores) -->
    {#each dotOverlays as dot (dot.score + "-" + dot.idx)}
      {@const dotR = 3.5}
      {@const cx = barX(dot.score) + bw / 2}
      {@const cy = pad.top + ch - dotR - 1 - dot.idx * (dotR * 2 + 2)}
      <circle {cx} {cy} r={dotR} fill={dotColor} />
      <circle {cx} {cy} r={1.5} fill="white" />
    {/each}

    <!-- Rank dots overlay (per-bar rank positions) -->
    {#each rankDots as entry (entry.dataIdx)}
      {#each entry.ranks as rank, ri (ri)}
        {@const cx = barX(entry.dataIdx) + bw / 2}
        {@const cy = pad.top + ch - (rank / yMax) * ch}
        <circle {cx} {cy} r={3.5} fill={rankDotColor} />
        <circle {cx} {cy} r={1.5} fill="white" />
      {/each}
    {/each}

    <!-- Overlay line (rank) -->
    {#if overlayPath}
      <path
        d={overlayPath}
        fill="none"
        stroke={overlayLineColor}
        stroke-width="2"
      />
      {#each overlayDots as pt, pi (pi)}
        <circle cx={pt.x} cy={pt.y} r={3.5} fill={overlayLineColor} />
        <circle cx={pt.x} cy={pt.y} r={1.5} fill="white" />
      {/each}
    {/if}

    <!-- X-axis labels -->
    {#each labels as label, i (i)}
      {#if visibleLabels.has(i)}
        <text
          x={barX(i) + bw / 2}
          y={pad.top + ch + 16}
          text-anchor={rotateLabels ? "end" : "middle"}
          class="axis-label"
          transform={rotateLabels
            ? `rotate(-45, ${barX(i) + bw / 2}, ${pad.top + ch + 16})`
            : undefined}>{xFormat ? xFormat(data[i]) : label}</text
        >
      {/if}
    {/each}

    <!-- X-axis label (e.g. "Total Score") -->
    {#if xLabel}
      <text x={W / 2} y={H - 4} text-anchor="middle" class="axis-label"
        >{xLabel}</text
      >
    {/if}
  </svg>
</div>

<ChartTooltip visible={tipVisible} x={tipX} y={tipY} html={tipHtml} />

<style>
  .bar-rect {
    transition: opacity 0.12s ease;
  }
</style>
