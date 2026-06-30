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
import type { RampUnit, RegistrationRampPoint } from "@/domain/entities/studio/Studio";

interface RegistrationRampChartProps {
  data: RegistrationRampPoint[];
  /** Unidad del eje: "hour" para eventos de corto plazo, "day" para varios días. */
  unit: RampUnit;
}

export default function RegistrationRampChart({ data, unit }: RegistrationRampChartProps) {
  // Con un solo punto la curva no aporta nada: mostramos un aviso amable.
  if (data.length < 2) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-50 text-center">
        <p className="text-sm font-medium text-slate-500">
          Aún no hay suficientes inscripciones
        </p>
        <p className="text-xs text-slate-400">
          La curva de ritmo aparecerá cuando recibas inscripciones en distintos momentos.
        </p>
      </div>
    );
  }

  const eventLabel = unit === "hour" ? "Hora del evento" : "Día del evento";
  const suffix = unit === "hour" ? "h" : "d";

  const formatted = data.map((d) => ({
    ...d,
    label: d.unitsBeforeEvent === 0 ? eventLabel : `-${d.unitsBeforeEvent}${suffix}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={STUDIO_COLORS.slate200} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: STUDIO_COLORS.slate400 }}
          tickLine={false}
          axisLine={{ stroke: STUDIO_COLORS.slate200 }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: STUDIO_COLORS.slate400 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ stroke: STUDIO_COLORS.primary, strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${STUDIO_COLORS.slate200}`,
            fontSize: 12,
          }}
          labelFormatter={(label) =>
            label === eventLabel ? label : `Faltando ${String(label).replace("-", "")}`
          }
        />
        <Area
          type="monotone"
          dataKey="cumulativeRegistrations"
          name="Inscripciones acumuladas"
          stroke={STUDIO_COLORS.primary}
          fill={STUDIO_COLORS.primary}
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
