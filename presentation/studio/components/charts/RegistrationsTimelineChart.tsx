"use client";

import { useReducedMotion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, CHART, TooltipCard, formatCompact, formatDay, formatNumber } from "./chartTheme";
import { ChartEmpty } from "./ChartEmpty";

interface RegistrationsTimelineChartProps {
  data: { date: string; registrations: number }[];
}

export default function RegistrationsTimelineChart({ data }: RegistrationsTimelineChartProps) {
  const still = useReducedMotion();
  if (data.every((d) => d.registrations === 0)) return <ChartEmpty height={260} />;

  const total = data.reduce((sum, d) => sum + d.registrations, 0);
  const peak = data.reduce((best, d) => (d.registrations > best.registrations ? d : best), data[0]);
  const summary = `Inscripciones por día este mes: ${formatNumber(total)} en total; el día con más fue el ${formatDay(peak.date)} con ${formatNumber(peak.registrations)}.`;

  return (
    <div role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
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
            content={<TooltipCard labelFormatter={formatDay} />}
          />
          <Area
            isAnimationActive={!still}
            animationDuration={600}
            type="monotone"
            dataKey="registrations"
            name="Inscripciones"
            stroke={CHART.primary}
            strokeWidth={2}
            fill={CHART.primary}
            fillOpacity={0.08}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
