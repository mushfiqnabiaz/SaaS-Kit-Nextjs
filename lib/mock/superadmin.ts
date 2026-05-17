/**
 * Chart series & trend helpers for the superadmin dashboard.
 * KPI counts come from repositories in lib/data/superadmin.ts — not from here.
 * Replace sparkline/growth generators with time-series DB queries in production.
 */

export interface SparklinePoint {
  day: string;
  value: number;
}

export interface GrowthPoint {
  month: string;
  totalUsers: number;
  newSignups: number;
}

export interface PlanSegment {
  name: string;
  value: number;
  fill: string;
}

export type TrendDirection = "up" | "down" | "flat";

export function computeTrend(current: number, previous: number): {
  percent: number;
  direction: TrendDirection;
} {
  if (previous === 0) {
    return { percent: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "flat" };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { percent: 0, direction: "flat" };
  return { percent: Math.abs(percent), direction: percent > 0 ? "up" : "down" };
}

/** Last 7 days sparkline anchored to end value */
export function buildSparkline(endValue: number, variance = 0.08): SparklinePoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const points: SparklinePoint[] = [];
  let v = Math.max(1, endValue * (1 - variance * 3));
  for (let i = 0; i < days.length; i++) {
    const step = (endValue - v) / (days.length - 1 - i || 1);
    v = i === days.length - 1 ? endValue : Math.round(v + step + (Math.random() - 0.5) * endValue * 0.02);
    points.push({ day: days[i], value: Math.max(0, v) });
  }
  return points;
}

/** 12-month growth series scaled from current totals */
export function buildGrowthSeries(
  totalUsers: number,
  newSignups30d: number,
): GrowthPoint[] {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now = new Date().getMonth();
  const ordered = [...months.slice(now + 1), ...months.slice(0, now + 1)].slice(-12);

  let running = Math.max(0, totalUsers - newSignups30d * 8);
  return ordered.map((month, i) => {
    const growth = Math.round(newSignups30d * (0.6 + (i / 12) * 0.8) + Math.random() * 3);
    running += growth;
    return {
      month,
      totalUsers: Math.min(totalUsers, running),
      newSignups: growth,
    };
  });
}

const PLAN_COLORS: Record<string, string> = {
  free: "#6B7280",
  pro: "#A855F7",
  enterprise: "#F59E0B",
};

export function buildPlanSegments(counts: Record<string, number>): PlanSegment[] {
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: PLAN_COLORS[name] ?? "#00D4FF",
    }));
}
