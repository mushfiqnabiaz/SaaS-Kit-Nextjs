/** Mock time-series for company dashboard charts — swap for real analytics in production. */

export interface ActivityPoint {
  day: string;
  active: number;
}

export interface RoleSegment {
  name: string;
  value: number;
  color: string;
}

export function buildActivitySeries(memberCount: number, days = 30): ActivityPoint[] {
  const points: ActivityPoint[] = [];
  const base = Math.max(1, Math.round(memberCount * 0.4));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const variance = Math.sin(i * 0.5) * 2 + Math.random() * 3;
    points.push({
      day: label,
      active: Math.max(0, Math.round(base + variance)),
    });
  }
  return points;
}

export function buildRoleSegments(adminCount: number, userCount: number): RoleSegment[] {
  return [
    { name: "Admins", value: adminCount, color: "#6366F1" },
    { name: "Users", value: userCount, color: "#64748B" },
  ];
}
