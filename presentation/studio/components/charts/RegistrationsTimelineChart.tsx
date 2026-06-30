"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STUDIO_COLORS } from "../../lib/tokens";

interface RegistrationsTimelineChartProps {
  data: { date: string; registrations: number }[];
}

// "YYYY-MM-DD" -> "DD/MM", sin pasar por Date() para no arrastrar desfases de timezone.
function formatDateLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

export default function RegistrationsTimelineChart({ data }: RegistrationsTimelineChartProps) {
  const formatted = data.map((d) => ({ ...d, label: formatDateLabel(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="registrationsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STUDIO_COLORS.primary} stopOpacity={0.25} />
            <stop offset="100%" stopColor={STUDIO_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={STUDIO_COLORS.slate200} vertical={false} />
        <XAxis
          dataKey="label"
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
          cursor={{ stroke: STUDIO_COLORS.primary, strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${STUDIO_COLORS.slate200}`,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="registrations"
          name="Inscripciones"
          stroke={STUDIO_COLORS.primary}
          strokeWidth={2}
          fill="url(#registrationsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
