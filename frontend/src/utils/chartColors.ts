export const CHART_COLORS = {
  gold: '#daa520',
  silver: '#a0a0a0',
  bronze: '#cd7f32',
  hm: '#d9536f',
  none: '#8fb8de',
  line: '#1a2744',
  grid: '#e0ddd6',
  label: '#888',
  title: '#1a2744',
  bg: '#fff',
} as const;

export const STACKED_BAR_ORDER = [
  { key: 'gold',   color: CHART_COLORS.gold },
  { key: 'silver', color: CHART_COLORS.silver },
  { key: 'bronze', color: CHART_COLORS.bronze },
  { key: 'hm',     color: CHART_COLORS.hm },
  { key: 'none',   color: CHART_COLORS.none },
] as const;
