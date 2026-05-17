"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { RoleSegment } from "@/lib/mock/company";

export function RoleDonut({
  segments,
  total,
}: {
  segments: RoleSegment[];
  total: number;
}) {
  return (
    <section className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <h2 className="text-sm font-semibold text-[#E6EDF3]">Role Breakdown</h2>
      <div className="relative mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              stroke="none"
            >
              {segments.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#161B22",
                border: "1px solid #30363D",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="company-tabular text-2xl font-bold text-[#E6EDF3]">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#6E7681]">Members</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[#8B949E]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
            <span className="company-tabular font-medium text-[#C9D1D9]">{s.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
