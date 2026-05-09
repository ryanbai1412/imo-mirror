/**
 * Shared chart math — scales, grid, tooltip positioning.
 * No D3. No DOM. Pure arithmetic.
 */
import { awardType, type AwardType } from "$lib/utils/awardClass";

// ── Linear scale ──────────────────────────────
export function linearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

// ── Band scale (bar charts) ───────────────────
export interface BandScaleResult {
  (label: string): number;
  bandwidth: number;
  labels: string[];
}

export function bandScale(
  labels: string[],
  range: [number, number],
  padding = 0.15
): BandScaleResult {
  const [r0, r1] = range;
  const totalW = r1 - r0;
  const n = labels.length || 1;
  const step = totalW / n;
  const bw = step * (1 - padding);
  const offset = (step - bw) / 2;
  const map = new Map<string, number>();
  for (let i = 0; i < labels.length; i++) {
    map.set(labels[i], r0 + i * step + offset);
  }
  const fn = (label: string) => map.get(label) ?? r0;
  return Object.assign(fn, { bandwidth: bw, labels });
}

// ── Nice axis ticks ───────────────────────────
export function niceMin(value: number, step?: number): number {
  if (value <= 0) return 0;
  if (!step) {
    if (value <= 5) step = 1;
    else if (value <= 20) step = 5;
    else if (value <= 50) step = 10;
    else if (value <= 200) step = 50;
    else if (value <= 500) step = 100;
    else step = Math.pow(10, Math.floor(Math.log10(value)));
  }
  return Math.floor(value / step) * step;
}

export function niceMax(value: number, step?: number): number {
  if (!step) {
    if (value <= 5) step = 1;
    else if (value <= 15) step = 5;
    else if (value <= 40) step = 10;
    else if (value <= 100) step = 20;
    else if (value <= 300) step = 50;
    else if (value <= 1000) step = 100;
    else step = Math.pow(10, Math.floor(Math.log10(value)));
  }
  return Math.ceil(value / step) * step || step;
}

export function tickValues(min: number, max: number, count = 5): number[] {
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    const v = Math.round(min + ((max - min) * i) / count);
    if (!ticks.length || ticks[ticks.length - 1] !== v) {
      ticks.push(v);
    }
  }
  return ticks;
}

// ── X-axis label thinning ─────────────────────
export function thinLabels(labels: string[], maxLabels = 15): Set<number> {
  const visible = new Set<number>();
  if (labels.length === 0) return visible;
  const step = Math.max(1, Math.ceil(labels.length / maxLabels));
  for (let i = 0; i < labels.length; i++) {
    if (i % step === 0 || i === labels.length - 1) {
      visible.add(i);
    }
  }
  return visible;
}

// ── Tooltip positioning ───────────────────────
export interface TooltipPos {
  x: number;
  y: number;
}

export function tooltipPosition(
  mouseX: number,
  mouseY: number,
  tipW: number,
  tipH: number,
  vpW: number,
  vpH: number
): TooltipPos {
  const x = mouseX + tipW + 12 > vpW ? mouseX - tipW - 12 : mouseX + 12;
  let y = mouseY - 10;
  if (mouseY - 10 + tipH > vpH) y = vpH - tipH - 4;
  if (y < 4) y = 4;
  return { x, y };
}

// ── Bar hit-test ──────────────────────────────
export function barHitIndex(
  mx: number,
  left: number,
  barStep: number,
  count: number
): number {
  const idx = Math.floor((mx - left) / barStep);
  return idx >= 0 && idx < count ? idx : -1;
}

// ── Line hit-test (closest x) ─────────────────
export function lineHitIndex(mx: number, xs: number[], threshold = 20): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const dist = Math.abs(mx - xs[i]);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return bestDist <= threshold ? best : -1;
}

// ── Award color helper ────────────────────────
export function awardColor(
  award: AwardType[] | null | undefined,
  colors: Record<string, string>
): string {
  if (!award || !award.length) return colors.none;
  const t = awardType(award);
  return colors[t] ?? colors.none;
}
