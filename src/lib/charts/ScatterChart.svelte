<script lang="ts">
  import ChartTooltip from "./ChartTooltip.svelte";
  import { tickValues, tooltipPosition, awardColor } from "./_core";
  import { awardType } from "$lib/utils/awardClass";
  import { CHART_COLORS } from "$lib/utils/chartColors";
  import "$lib/styles/chart.css";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ScatterDatum = Record<string, any>;

  let {
    data,
    xKey,
    yKey,
    xLabel = "",
    yLabel = "",
    title = "",
    height = 400,
    xMin = 0,
    xMax = 21,
    yMin = 0,
    yMax = 21,
    invertX = false,
    invertY = false,
    xTicks = 7,
    yTicks = 7,
    mode = "jitter",
    tooltipFn = undefined,
    padding = {
      top: 28,
      right: 20,
      bottom: 40,
      left: 48,
    },
  }: {
    data: ScatterDatum[];
    xKey: string;
    yKey: string;
    xLabel?: string;
    yLabel?: string;
    title?: string;
    height?: number;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    invertX?: boolean;
    invertY?: boolean;
    xTicks?: number;
    yTicks?: number;
    mode?: "jitter" | "weighted";
    tooltipFn?: ((d: ScatterDatum) => string) | undefined;
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

  // ── Scales ────────────────────────────────
  function xScale(v: number): number {
    const norm = (v - xMin) / (xMax - xMin || 1);
    return invertX ? pad.left + cw - norm * cw : pad.left + norm * cw;
  }

  function yScale(v: number): number {
    const norm = (v - yMin) / (yMax - yMin || 1);
    return invertY ? pad.top + norm * ch : pad.top + ch - norm * ch;
  }

  // ── Grid ticks ────────────────────────────
  let xTickVals = $derived(tickValues(xMin, xMax, xTicks));
  let yTickVals = $derived(tickValues(yMin, yMax, yTicks));

  // ── Award ordering ────────────────────────
  const AWARD_ORDER = ["none", "hm", "bronze", "silver", "gold"];

  function getAwardKey(d: ScatterDatum): string {
    const inner = d.d as ScatterDatum | undefined;
    const award = inner?.award || d.award;
    if (!award || !Array.isArray(award)) return "none";
    return awardType(award);
  }

  function getAwardColor(d: ScatterDatum): string {
    const inner = d.d as ScatterDatum | undefined;
    return awardColor(
      (inner?.award || d.award) as
        | import("$lib/utils/awardClass").AwardType[]
        | null
        | undefined,
      CHART_COLORS
    );
  }

  // ── Jitter computation ────────────────────
  interface DotPoint {
    cx: number;
    cy: number;
    color: string;
    awardKey: string;
    d: ScatterDatum;
  }

  let dots = $derived(
    (() => {
      if (mode === "jitter") {
        return jitterDots();
      } else {
        return weightedDots();
      }
    })()
  );

  function jitterDots(): DotPoint[] {
    const jitterR = 3;
    const countMap = new Map<string, number>();
    const idxMap = new Map<string, number>();

    for (const d of data) {
      const k = d[xKey] + "," + d[yKey];
      countMap.set(k, (countMap.get(k) || 0) + 1);
    }

    const items = data.map((d) => {
      const k = d[xKey] + "," + d[yKey];
      const idx = idxMap.get(k) || 0;
      idxMap.set(k, idx + 1);
      const total = countMap.get(k) || 1;
      let cx = xScale(d[xKey] as number);
      let cy = yScale(d[yKey] as number);
      if (total > 1) {
        const angle = (idx / total) * Math.PI * 2;
        cx += Math.cos(angle) * jitterR;
        cy += Math.sin(angle) * jitterR;
      }
      return {
        cx,
        cy,
        color: getAwardColor(d),
        awardKey: getAwardKey(d),
        d,
      };
    });

    // Sort so gold renders on top
    items.sort(
      (a, b) =>
        AWARD_ORDER.indexOf(a.awardKey) - AWARD_ORDER.indexOf(b.awardKey)
    );
    return items;
  }

  function weightedDots(): DotPoint[] {
    const pointMap = new Map<
      string,
      { x: number; y: number; items: ScatterDatum[] }
    >();
    for (const d of data) {
      const pk = d[xKey] + "," + d[yKey];
      if (!pointMap.has(pk)) {
        pointMap.set(pk, {
          x: d[xKey] as number,
          y: d[yKey] as number,
          items: [],
        });
      }
      pointMap.get(pk)!.items.push(d);
    }
    const groups = [...pointMap.values()];
    let maxGroupSize = 1;
    for (const g of groups) {
      if (g.items.length > maxGroupSize) maxGroupSize = g.items.length;
    }
    groups.sort((a, b) => a.items.length - b.items.length);
    return groups.map((g) => {
      const r = 2 + Math.sqrt(g.items.length / maxGroupSize) * 6;
      const colorCounts = new Map<string, number>();
      const awardCounts = new Map<string, number>();
      for (const item of g.items) {
        const c = getAwardColor(item);
        colorCounts.set(c, (colorCounts.get(c) || 0) + 1);
        const ak = getAwardKey(item);
        awardCounts.set(ak, (awardCounts.get(ak) || 0) + 1);
      }
      let bestColor: string = CHART_COLORS.none;
      let bestCount = 0;
      for (const [c, n] of colorCounts) {
        if (n > bestCount) {
          bestCount = n;
          bestColor = c;
        }
      }
      let bestAward = "none";
      let bestAwardCount = 0;
      for (const [a, n] of awardCounts) {
        if (n > bestAwardCount) {
          bestAwardCount = n;
          bestAward = a;
        }
      }
      return {
        cx: xScale(g.x),
        cy: yScale(g.y),
        color: bestColor,
        awardKey: bestAward,
        d: { _group: g, _r: r },
      };
    });
  }

  // ── Hover state ───────────────────────────
  let hoverIdx = $state(-1);
  let hoveredAward = $state<string | null>(null);
  let tipVisible = $state(false);
  let tipX = $state(0);
  let tipY = $state(0);
  let tipHtml = $state("");

  // ── Render order (hovered award on top) ────
  let renderDots = $derived(
    (() => {
      const indexed = dots.map((dot, i) => ({
        ...dot,
        origIdx: i,
      }));
      if (!hoveredAward) return indexed;
      const a = hoveredAward;
      return [
        ...indexed.filter((d) => d.awardKey !== a),
        ...indexed.filter((d) => d.awardKey === a),
      ];
    })()
  );

  function onMouseMove(e: MouseEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    // Find closest dot
    let best = -1;
    let bestDist = 20;
    for (let i = 0; i < dots.length; i++) {
      const dx = mx - dots[i].cx;
      const dy = my - dots[i].cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = (dots[i].d._r as number) || 3.5;
      if (
        dist < Math.max(bestDist, r + 4) &&
        dist < (best >= 0 ? bestDist : Infinity)
      ) {
        bestDist = dist;
        best = i;
      }
    }

    if (best < 0) {
      hoverIdx = -1;
      hoveredAward = null;
      tipVisible = false;
      return;
    }

    hoverIdx = best;
    hoveredAward = dots[best].awardKey;

    const d = dots[best].d;
    if (tooltipFn) {
      tipHtml = tooltipFn(d);
    } else if (d._group) {
      const g = d._group;
      const n = g.items.length;
      let html =
        `<b>${xLabel}: ${g.x}, ` +
        `${yLabel}: ${g.y}</b><br>` +
        `${n} contestant${n === 1 ? "" : "s"}`;
      if (n <= 8) {
        for (const item of g.items) {
          html +=
            `<br><span style="color:` +
            `${getAwardColor(item)}">\u25CF</span> ` +
            `${item.name || ""} (${item.year || ""})`;
        }
      }
      tipHtml = html;
    } else {
      tipHtml =
        `<b>${d.d?.name || d.name || ""}</b><br>` +
        `${xLabel}: ${d[xKey]}<br>` +
        `${yLabel}: ${d[yKey]}`;
    }

    tipVisible = true;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const pos = tooltipPosition(e.clientX, e.clientY, 200, 80, vpW, vpH);
    tipX = pos.x;
    tipY = pos.y;
  }

  function onMouseLeave() {
    hoverIdx = -1;
    hoveredAward = null;
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
    <!-- X grid + labels -->
    {#each xTickVals as v (v)}
      {@const x = xScale(v)}
      <line
        x1={x}
        y1={pad.top}
        x2={x}
        y2={pad.top + ch}
        stroke={CHART_COLORS.grid}
        stroke-width="0.5"
      />
      <text {x} y={pad.top + ch + 14} text-anchor="middle" class="axis-label"
        >{Math.round(v)}</text
      >
    {/each}

    <!-- Y grid + labels -->
    {#each yTickVals as v (v)}
      {@const y = yScale(v)}
      <line
        x1={pad.left}
        y1={y}
        x2={pad.left + cw}
        y2={y}
        stroke={CHART_COLORS.grid}
        stroke-width="0.5"
      />
      <text x={pad.left - 6} y={y + 3} text-anchor="end" class="axis-label"
        >{Math.round(v)}</text
      >
    {/each}

    <!-- Hover crosshairs -->
    {#if hoverIdx >= 0}
      {@const hd = dots[hoverIdx]}
      <line
        x1={hd.cx}
        y1={pad.top}
        x2={hd.cx}
        y2={pad.top + ch}
        stroke={CHART_COLORS.grid}
        stroke-width="1"
        stroke-dasharray="4,3"
      />
      <line
        x1={pad.left}
        y1={hd.cy}
        x2={pad.left + cw}
        y2={hd.cy}
        stroke={CHART_COLORS.grid}
        stroke-width="1"
        stroke-dasharray="4,3"
      />
    {/if}

    <!-- Dots -->
    {#each renderDots as dot (dot.origIdx)}
      {@const r = dot.d._r || 3.5}
      {@const isHovered = dot.origIdx === hoverIdx}
      {@const dimmed = hoveredAward != null && dot.awardKey !== hoveredAward}
      <circle
        cx={dot.cx}
        cy={dot.cy}
        r={isHovered ? r + 2 : r}
        fill={dot.color}
        class="scatter-dot"
        opacity={dimmed ? 0.12 : 0.7}
        stroke={isHovered ? "white" : "none"}
        stroke-width={isHovered ? 2 : 0}
      />
    {/each}

    <!-- Axis labels -->
    <text
      x={pad.left + cw / 2}
      y={H - 4}
      text-anchor="middle"
      class="axis-label">{xLabel}</text
    >
    <text
      x={12}
      y={pad.top + ch / 2}
      text-anchor="middle"
      class="axis-label"
      transform="rotate(-90, 12, {pad.top + ch / 2})">{yLabel}</text
    >
  </svg>
</div>

<ChartTooltip visible={tipVisible} x={tipX} y={tipY} html={tipHtml} />

<style>
  .axis-label {
    font-size: 10px;
  }
  .scatter-dot {
    transition:
      opacity 0.15s ease,
      r 0.1s ease;
  }
</style>
