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
import { AXIS_TICK, CHART, TooltipCard, formatCompact, formatDay, formatNumber } from "./chartTheme";
import { ChartEmpty } from "./ChartEmpty";

interface InteractionsPoint {
  date: string;
  clicks: number;
  likes: number;
  shares: number;
}

interface InteractionsOverTimeChartProps {
  data: InteractionsPoint[];
}

const SERIES = [
  { key: "clicks", name: "Clicks", color: CHART.primary },
  { key: "likes", name: "Me gusta", color: CHART.ink },
  { key: "shares", name: "Compartidos", color: CHART.neutral },
] as const;

export default function InteractionsOverTimeChart({ data }: InteractionsOverTimeChartProps) {
  if (data.length === 0) return <ChartEmpty />;
  const totals = SERIES.map(
    (s) => `${formatNumber(data.reduce((sum, d) => sum + d[s.key], 0))} ${s.name.toLowerCase()}`,
  ).join(", ");

  return (
    <div role="img" aria-label={`Interacciones por semana: ${totals} en el periodo.`}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={AXIS_TICK}
            tickFormatter={formatCompact}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: CHART.neutral, strokeWidth: 1 }}
            content={<TooltipCard labelFormatter={(d) => `Semana del ${formatDay(d)}`} />}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stackId="interactions"
              stroke={s.color}
              strokeWidth={2}
              fill={s.color}
              fillOpacity={0.08}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
