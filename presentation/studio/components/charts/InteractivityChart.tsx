"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STUDIO_COLORS } from "../../lib/tokens";

interface InteractivityChartProps {
  data: { eventName: string; views: number; likes: number; shares: number }[];
}

export default function InteractivityChart({ data }: InteractivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={STUDIO_COLORS.slate200} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate400 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="eventName"
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate500 }}
          tickLine={false}
          axisLine={{ stroke: STUDIO_COLORS.slate200 }}
          width={110}
        />
        <Tooltip
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${STUDIO_COLORS.slate200}`,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="views" name="Vistas" fill={STUDIO_COLORS.primary} radius={[0, 3, 3, 0]} />
        <Bar dataKey="likes" name="Likes" fill={STUDIO_COLORS.amber} radius={[0, 3, 3, 0]} />
        <Bar dataKey="shares" name="Compartidos" fill={STUDIO_COLORS.positive} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
