"use client";

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
import { STUDIO_COLORS } from "../../lib/tokens";

interface InteractionsPoint {
  date: string;
  clicks: number;
  likes: number;
  shares: number;
}

interface InteractionsOverTimeChartProps {
  data: InteractionsPoint[];
}

// Mismo lenguaje de color que las métricas del sitio (siteMetrics.tsx).
const SERIES = [
  { key: "clicks", name: "Clicks", color: STUDIO_COLORS.primary },
  { key: "likes", name: "Me gusta", color: STUDIO_COLORS.rose },
  { key: "shares", name: "Compartidos", color: STUDIO_COLORS.sky },
] as const;

export default function InteractionsOverTimeChart({ data }: InteractionsOverTimeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={STUDIO_COLORS.slate200} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate500 }}
          tickLine={false}
          axisLine={{ stroke: STUDIO_COLORS.slate200 }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate400 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: STUDIO_COLORS.slate400, strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${STUDIO_COLORS.slate200}`,
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {SERIES.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stackId="interactions"
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
