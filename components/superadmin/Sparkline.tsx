"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { SparklinePoint } from "@/lib/mock/superadmin";

export function Sparkline({ data }: { data: SparklinePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00D4FF"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
