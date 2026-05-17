"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthPoint } from "@/lib/mock/superadmin";
import { cn } from "@/lib/utils";

const ranges = ["7d", "30d", "90d", "1y"] as const;

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]>("1y");
  const slice = range === "7d" ? 2 : range === "30d" ? 4 : range === "90d" ? 6 : data.length;

  return (
    <section className="rounded border border-[#00D4FF]/20 bg-[#1A1A1E] p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Platform Growth
        </h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-2 py-1 font-mono text-[10px] uppercase",
                range === r
                  ? "bg-[#00D4FF]/15 text-[#00D4FF]"
                  : "text-[#6B7280] hover:text-[#9CA3AF]",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.slice(-slice)}>
            <CartesianGrid stroke="#2A2A30" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{
                background: "#1A1A1E",
                border: "1px solid #00D4FF33",
                borderRadius: 4,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="totalUsers"
              name="Total Users"
              stroke="#00D4FF"
              fill="#00D4FF22"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="newSignups"
              name="New Signups"
              stroke="#00FF94"
              fill="#00FF9422"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
