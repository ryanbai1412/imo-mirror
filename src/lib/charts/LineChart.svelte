<script lang="ts">
  import ChartTooltip from "./ChartTooltip.svelte";
  import { niceMax, tickValues, thinLabels, tooltipPosition } from "./_core";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import "$lib/styles/chart.css";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ChartDatum = Record<string, any>;
  type LineSeries = {
    key: string;
    color: string;
    label?: string;
  };

  let {
    data,
    lines,
    xKey = "year",
    xFormat = undefined,
    title = "",
    yLabel = "",
    yLabelRight = "",
    height = 320,
    maxLabels = 15,
    fixedYMax = undefined,
    fixedYStep = undefined,
    tooltipFn,
    rightAxis = undefined,
    padding = {
      top: 20,
      right: 16,
      bottom: 36,
      left: 40,
    },
  }: {
    data: ChartDatum[];
    lines: LineSeries[];
    xKey?: string;
    xFormat?: ((d: ChartDatum) => string) | undefined;
    title?: string;
    yLabel?: string;
    yLabelRight?: string;
    height?: number;
    maxLabels?: number;
    fixedYMax?: number | undefined;
    fixedYStep?: number | undefined;
    tooltipFn: (d: ChartDatum, idx: number) => string;
    rightAxis?:
      | {
          key: string;
          color: string;
          label?: string;
        }
      | undefined;
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  } = $props();

  // ── Container resize ──────────────────────
  let containerW = $state(600);
  let measured = $state(false);
  let W = $derived(containerW);
  let H = $derived(height);
  let pad = $derived(padding);
  let cw = $derived(W - pad.left - pad.right);
  let ch = $derived(H - pad.top - pad.bottom);

  // ── X positions ───────────────────────────
  function xPos(i: number): number {
    const last = Math.max(1, data.length - 1);
    return pad.left + (i / last) * cw;
  }

  // ── Y-axis (left) ────────────────────────
  let allLeftKeys = $derived(
    rightAxis
      ? lines.filter((l) => l.key !== rightAxis.key).map((l) => l.key)
      : lines.map((l) => l.key)
  );

  let yMinLeft = 0;

  let yMaxLeft = $derived(
    (() => {
      if (fixedYMax != null) return fixedYMax;
      let max = 0;
      for (const d of data) {
        for (const k of allLeftKeys) {
          const v = d[k] as number | null | undefined;
          if (v != null && v > max) max = v;
        }
      }
      return niceMax(max);
    })()
  );

  let yTicksLeft = $derived(
    fixedYStep != null
      ? Array.from(
          { length: Math.floor(yMaxLeft / fixedYStep) + 1 },
          (_, i) => i * fixedYStep!
        )
      : tickValues(yMinLeft, yMaxLeft)
  );

  function yScaleLeft(v: number): number {
    const span = yMaxLeft - yMinLeft || 1;
    return pad.top + ch - ((v - yMinLeft) / span) * ch;
  }

  // ── Y-axis (right, optional) ──────────────
  let yMinRight = 0;

  let rawMaxRight = $derived(
    (() => {
      if (!rightAxis) return 0;
      let max = 0;
      for (const d of data) {
        const v = d[rightAxis.key] as number | null | undefined;
        if (v != null && v > max) max = v;
      }
      return max;
    })()
  );

  let rawMaxLeft = $derived(
    (() => {
      let max = 0;
      for (const d of data) {
        for (const k of allLeftKeys) {
          const v = d[k] as number | null | undefined;
          if (v != null && v > max) max = v;
        }
      }
      return max;
    })()
  );

  let yMaxRight = $derived(
    (() => {
      if (!rightAxis || !rawMaxLeft) {
        return niceMax(rawMaxRight);
      }
      const ratio = rawMaxRight / rawMaxLeft;
      return Math.round(yMaxLeft * ratio);
    })()
  );

  let yTicksRight = $derived(rightAxis ? tickValues(yMinRight, yMaxRight) : []);

  function yScaleRight(v: number): number {
    const span = yMaxRight - yMinRight || 1;
    return pad.top + ch - ((v - yMinRight) / span) * ch;
  }

  // ── Build line paths ──────────────────────
  interface LinePathData {
    path: string;
    color: string;
    key: string;
    isRight: boolean;
    dots: { x: number; y: number }[];
  }

  let linePaths = $derived(
    (() => {
      const result: LinePathData[] = [];
      for (const line of lines) {
        const isRight = !!rightAxis && line.key === rightAxis.key;
        const yFn = isRight ? yScaleRight : yScaleLeft;
        let path = "";
        const dots: { x: number; y: number }[] = [];
        let started = false;

        for (let i = 0; i < data.length; i++) {
          const v = data[i][line.key] as number | null | undefined;
          if (v == null) continue;
          const x = xPos(i);
          const y = yFn(v);
          dots.push({ x, y });
          if (!started) {
            path += `M${x},${y}`;
            started = true;
          } else {
            path += `L${x},${y}`;
          }
        }

        result.push({
          path,
          color: line.color,
          key: line.key,
          isRight,
          dots,
        });
      }
      return result;
    })()
  );

  // ── X labels ──────────────────────────────
  let visibleLabels = $derived(
    thinLabels(
      data.map(() => ""),
      maxLabels
    )
  );

  // ── Hover state ───────────────────────────
  let hoverIdx = $state(-1);
  let hoveredLine = $state<string | null>(null);
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
      hoveredLine = null;
      tipVisible = false;
      return;
    }

    // 1) 2D hit-test: find closest dot
    const DOT_HIT = 12;
    let dotIdx = -1;
    let dotLine: string | null = null;
    let dotDist = Infinity;

    for (const lp of linePaths) {
      for (let i = 0; i < data.length; i++) {
        const v = data[i]?.[lp.key] as number | null | undefined;
        if (v == null) continue;
        const dx = mx - xPos(i);
        const dy = my - (lp.isRight ? yScaleRight(v) : yScaleLeft(v));
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < dotDist) {
          dotDist = dist;
          dotIdx = i;
          dotLine = lp.key;
        }
      }
    }

    // 2) Snap to nearest x-index
    const X_SNAP = 20;
    let snapIdx = -1;
    let snapDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(mx - xPos(i));
      if (d < snapDist) {
        snapDist = d;
        snapIdx = i;
      }
    }

    // Direct dot hit → highlight single line
    if (dotIdx >= 0 && dotDist <= DOT_HIT) {
      hoverIdx = dotIdx;
      hoveredLine = dotLine;
      tipHtml = tooltipFn(data[dotIdx], dotIdx);
      tipVisible = true;
      // X-snap → show all lines at that index
    } else if (snapIdx >= 0 && snapDist <= X_SNAP) {
      hoverIdx = snapIdx;
      hoveredLine = null;
      tipHtml = tooltipFn(data[snapIdx], snapIdx);
      tipVisible = true;
    } else {
      hoverIdx = -1;
      hoveredLine = null;
      tipVisible = false;
      return;
    }

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const pos = tooltipPosition(e.clientX, e.clientY, 180, 60, vpW, vpH);
    tipX = pos.x;
    tipY = pos.y;
  }

  function onMouseLeave() {
    hoverIdx = -1;
    hoveredLine = null;
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
    <!-- Y grid (left) + labels -->
    {#each yTicksLeft as v (v)}
      {@const y = yScaleLeft(v)}
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

    <!-- Y labels (right axis) -->
    {#if rightAxis}
      {#each yTicksRight as v (v)}
        {@const y = yScaleRight(v)}
        <text
          x={W - pad.right + 6}
          y={y + 4}
          text-anchor="start"
          class="axis-label">{v}</text
        >
      {/each}
    {/if}

    <!-- Hover vertical line -->
    {#if hoverIdx >= 0}
      <line
        x1={xPos(hoverIdx)}
        y1={pad.top}
        x2={xPos(hoverIdx)}
        y2={pad.top + ch}
        stroke={CHART_COLORS.grid}
        stroke-width="1"
        stroke-dasharray="4,3"
      />
    {/if}

    <!-- Lines -->
    {#each linePaths as lp (lp.key)}
      <path
        d={lp.path}
        fill="none"
        stroke={lp.color}
        stroke-width="2"
        class="line-path"
        opacity={hoveredLine != null && hoveredLine !== lp.key ? 0.2 : 1}
      />
    {/each}

    <!-- Dots (small, always visible) -->
    {#each linePaths as lp (lp.key)}
      {#each lp.dots as dot, di (di)}
        <circle
          cx={dot.x}
          cy={dot.y}
          r={2.5}
          fill={lp.color}
          class="line-dot"
          opacity={hoveredLine != null && hoveredLine !== lp.key ? 0.2 : 1}
        />
      {/each}
    {/each}

    <!-- Hover highlight dots (larger) -->
    {#if hoverIdx >= 0}
      {#each linePaths as lp (lp.key)}
        {@const isRight = lp.isRight}
        {@const v = data[hoverIdx]?.[lp.key]}
        {#if v != null}
          {@const y = isRight ? yScaleRight(v) : yScaleLeft(v)}
          <circle
            cx={xPos(hoverIdx)}
            cy={y}
            r={5}
            fill={lp.color}
            stroke="white"
            stroke-width="2"
            opacity={hoveredLine != null && hoveredLine !== lp.key ? 0.2 : 1}
          />
        {/if}
      {/each}
    {/if}

    <!-- X-axis labels -->
    {#each data as d, i (i)}
      {#if visibleLabels.has(i)}
        <text
          x={xPos(i)}
          y={pad.top + ch + 16}
          text-anchor="middle"
          class="axis-label"
          >{xFormat ? xFormat(d) : "'" + String(d[xKey]).slice(-2)}</text
        >
      {/if}
    {/each}

    <!-- Y-axis label (left) -->
    {#if yLabel}
      <text
        x={12}
        y={pad.top + ch / 2}
        text-anchor="middle"
        class="axis-label"
        transform="rotate(-90, 12, {pad.top + ch / 2})">{yLabel}</text
      >
    {/if}

    <!-- Y-axis label (right) -->
    {#if yLabelRight}
      <text
        x={W - 2}
        y={pad.top + ch / 2}
        text-anchor="middle"
        class="axis-label"
        dominant-baseline="text-before-edge"
        transform="rotate(90, {W - 2}, {pad.top + ch / 2})">{yLabelRight}</text
      >
    {/if}
  </svg>
</div>

<ChartTooltip visible={tipVisible} x={tipX} y={tipY} html={tipHtml} />

<style>
  .line-path {
    transition: opacity 0.12s ease;
  }
  .line-dot {
    transition: r 0.12s ease;
  }
</style>
