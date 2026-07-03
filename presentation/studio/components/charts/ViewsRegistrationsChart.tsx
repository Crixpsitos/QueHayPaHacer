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

interface ViewsRegistrationsChartProps {
  data: { eventName: string; views: number; registrations: number }[];
}

export default function ViewsRegistrationsChart({ data }: ViewsRegistrationsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={STUDIO_COLORS.slate200} vertical={false} />
        <XAxis
          dataKey="eventName"
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate500 }}
          tickLine={false}
          axisLine={{ stroke: STUDIO_COLORS.slate200 }}
          interval={0}
          height={48}
          angle={-12}
          textAnchor="end"
        />
        <YAxis
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate400 }}
          tickLine={false}
          axisLine={false}
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
        <Bar dataKey="views" name="Vistas" fill={STUDIO_COLORS.primary} radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="registrations"
          name="Registros"
          fill={STUDIO_COLORS.positive}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
