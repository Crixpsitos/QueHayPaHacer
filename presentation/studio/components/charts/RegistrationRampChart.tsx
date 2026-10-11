"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RampUnit, RegistrationRampPoint } from "@/domain/entities/studio/Studio";
import { AXIS_TICK, CHART, TooltipCard, formatCompact, formatNumber } from "./chartTheme";

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
  const total = data[data.length - 1].cumulativeRegistrations;

  return (
    <div
      role="img"
      aria-label={`Inscripciones acumuladas antes del evento: ${formatNumber(total)} al último punto registrado.`}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
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
            content={
              <TooltipCard
                labelFormatter={(label) =>
                  label === eventLabel ? label : `Faltando ${label.replace("-", "")}`
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="cumulativeRegistrations"
            name="Inscripciones acumuladas"
            stroke={CHART.primary}
            fill={CHART.primary}
            fillOpacity={0.08}
            strokeWidth={2}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
