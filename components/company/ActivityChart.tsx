"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityPoint } from "@/lib/mock/company";
import { cn } from "@/lib/utils";

const ranges = ["7d", "30d"] as const;

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]>("30d");
  const slice = range === "7d" ? 7 : data.length;

  return (
    <section className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">Team Activity</h2>
        <div className="flex gap-1 rounded-lg border border-[#30363D] p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                range === r
                  ? "bg-[#6366F1] text-white"
                  : "text-[#8B949E] hover:text-[#C9D1D9]",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(-slice)}>
            <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="#6E7681" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#6E7681" fontSize={11} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              cursor={{ fill: "#6366F115" }}
              contentStyle={{
                background: "#161B22",
                border: "1px solid #30363D",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="active" name="Active users" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
