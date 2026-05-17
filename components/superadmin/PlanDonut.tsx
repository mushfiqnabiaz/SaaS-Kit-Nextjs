"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PlanSegment } from "@/lib/mock/superadmin";

export function PlanDonut({
  segments,
  total,
}: {
  segments: PlanSegment[];
  total: number;
}) {
  return (
    <section className="rounded border border-[#00D4FF]/20 bg-[#1A1A1E] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
        Companies by Plan
      </h2>
      <div className="relative mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {segments.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1A1A1E",
                border: "1px solid #00D4FF33",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="admin-tabular font-mono text-3xl font-bold text-[#00D4FF]">
            {total}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#6B7280]">companies</span>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5">
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#9CA3AF]">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.fill }} />
                {s.name}
              </span>
              <span className="admin-tabular font-mono text-[#E5E7EB]">
                {s.value} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
