"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { SCHEDULE_DATES_MAX, SCHEDULE_NOTE_MAX, SCHEDULE_SKIP_MAX } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { addRule, previewSchedule, removeRule, toggleWeekday, updateRule, type Freq, type FormRule } from "@/presentation/activities/lib/activityForm"
import { Field, ToggleChip, selectClass } from "./ui"
import type { StepProps } from "./StepKind"

const FREQS: { value: Freq; label: string }[] = [
  { value: "weekly", label: "Cada semana" },
  { value: "everyNWeeks", label: "Cada 2 semanas o más" },
  { value: "monthlyNth", label: "Una vez al mes (ej: el primer sábado)" },
  { value: "monthlyDay", label: "Un día fijo del mes" },
  { value: "dates", label: "Fechas sueltas" },
  { value: "always", label: "Todos los días, sin fecha fija" },
  { value: "byAppointment", label: "Solo con cita" },
]
// Lunes primero, como se lee en Colombia; el valor es el día JS (0 = domingo).
const WEEK: { label: string; full: string; value: number }[] = [
  { label: "L", full: "lunes", value: 1 }, { label: "M", full: "martes", value: 2 }, { label: "X", full: "miércoles", value: 3 }, { label: "J", full: "jueves", value: 4 },
  { label: "V", full: "viernes", value: 5 }, { label: "S", full: "sábado", value: 6 }, { label: "D", full: "domingo", value: 0 },
]
const NTH = [["1", "primer"], ["2", "segundo"], ["3", "tercer"], ["4", "cuarto"], ["last", "último"]]

function Weekdays({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">¿Qué días?</div>
      <div className="flex gap-2" role="group" aria-label="Días de la semana">
        {WEEK.map((d) => (
          <ToggleChip key={d.value} pressed={value.includes(d.value)} onClick={() => onChange(toggleWeekday(value, d.value))} className="size-11 min-w-11 flex-1 px-0" >
            <span aria-hidden>{d.label}</span>
            <span className="sr-only">{d.full}</span>
          </ToggleChip>
        ))}
      </div>
    </div>
  )
}

function Times({ rule, onChange, optionalStart }: { rule: FormRule; onChange: (p: Partial<FormRule>) => void; optionalStart?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Hora de inicio" optional={optionalStart}>{(id) => <Input id={id} type="time" value={rule.start} onChange={(e) => onChange({ start: e.target.value })} />}</Field>
      <Field label="Fin" optional>{(id) => <Input id={id} type="time" value={rule.end} onChange={(e) => onChange({ end: e.target.value })} />}</Field>
    </div>
  )
}

function DateList({ dates, max, onChange, label }: { dates: string[]; max: number; onChange: (d: string[]) => void; label: string }) {
  const [draft, setDraft] = useState("")
  const add = () => {
    if (draft && !dates.includes(draft) && dates.length < max) onChange([...dates, draft].sort())
    setDraft("")
  }
  return (
    <div className="grid gap-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1"><Field label={label}>{(id) => <Input id={id} type="date" value={draft} onChange={(e) => setDraft(e.target.value)} />}</Field></div>
        <Button type="button" variant="outline" size="lg" className="h-11" onClick={add} disabled={!draft}><Plus aria-hidden /> Agregar</Button>
      </div>
      {dates.length ? (
        <ul className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <li key={d} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-sm">
              {d}
              <button type="button" aria-label={`Quitar ${d}`} className="grid size-8 place-items-center rounded-full hover:bg-border" onClick={() => onChange(dates.filter((x) => x !== d))}><X className="size-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function RuleEditor({ rule, index, count, onChange, onRemove }: { rule: FormRule; index: number; count: number; onChange: (p: Partial<FormRule>) => void; onRemove: () => void }) {
  return (
    <fieldset className="grid gap-4 rounded-2xl border border-border bg-card p-4">
      <legend className="px-1 text-xs font-semibold tracking-wide text-muted-foreground">HORARIO {index + 1}</legend>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="¿Cada cuánto?">
            {(id) => (
              <select id={id} className={selectClass} value={rule.freq} onChange={(e) => onChange({ freq: e.target.value as Freq })}>
                {FREQS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            )}
          </Field>
        </div>
        {count > 1 ? <Button type="button" variant="ghost" size="icon-lg" aria-label={`Quitar el horario ${index + 1}`} onClick={onRemove}><Trash2 aria-hidden /></Button> : null}
      </div>

      {rule.freq === "weekly" ? <><Weekdays value={rule.weekdays} onChange={(weekdays) => onChange({ weekdays })} /><Times rule={rule} onChange={onChange} /></> : null}
      {rule.freq === "everyNWeeks" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cada cuántas semanas">{(id) => <select id={id} className={selectClass} value={rule.n} onChange={(e) => onChange({ n: e.target.value })}>{[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}</select>}</Field>
            <Field label="Primera vez" hint="Desde esa fecha se cuenta.">{(id) => <Input id={id} type="date" value={rule.anchorDate} onChange={(e) => onChange({ anchorDate: e.target.value })} />}</Field>
          </div>
          <Weekdays value={rule.weekdays} onChange={(weekdays) => onChange({ weekdays })} />
          <Times rule={rule} onChange={onChange} />
        </>
      ) : null}
      {rule.freq === "monthlyNth" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="¿Cuál?">{(id) => <select id={id} className={selectClass} value={rule.nth} onChange={(e) => onChange({ nth: e.target.value })}>{NTH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
            <Field label="¿Qué día?">{(id) => <select id={id} className={selectClass} value={rule.weekday} onChange={(e) => onChange({ weekday: Number(e.target.value) })}>{WEEK.map((d) => <option key={d.value} value={d.value}>{d.full}</option>)}</select>}</Field>
          </div>
          <Times rule={rule} onChange={onChange} />
        </>
      ) : null}
      {rule.freq === "monthlyDay" ? (
        <>
          <Field label="Día del mes" hint="Si el mes no tiene ese día (29, 30, 31), ese mes se salta.">{(id) => <Input id={id} inputMode="numeric" value={rule.dayOfMonth} onChange={(e) => onChange({ dayOfMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })} />}</Field>
          <Times rule={rule} onChange={onChange} />
        </>
      ) : null}
      {rule.freq === "dates" ? <><DateList dates={rule.dates} max={SCHEDULE_DATES_MAX} onChange={(dates) => onChange({ dates })} label="Agregar una fecha" /><Times rule={rule} onChange={onChange} /></> : null}
      {rule.freq === "always" ? <Times rule={rule} onChange={onChange} optionalStart /> : null}
      {rule.freq === "byAppointment" ? <p className="text-sm text-muted-foreground">La gente te escribe para acordar el día y la hora.</p> : null}
    </fieldset>
  )
}

/** Paso 3: cuándo. Constructor de horario con vista previa de lo que verá la gente. */
export function StepSchedule({ form, patch }: StepProps) {
  const [now] = useState(() => new Date())
  const preview = useMemo(() => previewSchedule(form, now), [form, now])
  const [season, setSeason] = useState(Boolean(form.validFrom || form.validUntil))
  const [skips, setSkips] = useState(form.skipDates.length > 0)
  const setRules = (rules: FormRule[]) => patch({ rules })

  return (
    <div className="grid gap-5">
      {form.rules.map((r, i) => (
        <RuleEditor key={i} rule={r} index={i} count={form.rules.length} onChange={(p) => setRules(updateRule(form.rules, i, p))} onRemove={() => setRules(removeRule(form.rules, i))} />
      ))}
      <Button type="button" variant="outline" size="lg" className="h-12 border-dashed" onClick={() => setRules(addRule(form.rules))}><Plus aria-hidden /> Agregar otro horario</Button>

      <div className="grid gap-1 rounded-2xl border border-border bg-card px-4">
        <label className="flex min-h-14 items-center justify-between gap-3 border-b border-muted text-sm">
          Solo en una temporada
          <input type="checkbox" className="size-5 accent-[#9B0A26]" checked={season} onChange={(e) => { setSeason(e.target.checked); if (!e.target.checked) patch({ validFrom: "", validUntil: "" }) }} />
        </label>
        {season ? (
          <div className="grid grid-cols-2 gap-3 pb-3">
            <Field label="Desde">{(id) => <Input id={id} type="date" value={form.validFrom} onChange={(e) => patch({ validFrom: e.target.value })} />}</Field>
            <Field label="Hasta">{(id) => <Input id={id} type="date" value={form.validUntil} onChange={(e) => patch({ validUntil: e.target.value })} />}</Field>
          </div>
        ) : null}
        <label className="flex min-h-14 items-center justify-between gap-3 border-b border-muted text-sm">
          Hay días que no hay actividad
          <input type="checkbox" className="size-5 accent-[#9B0A26]" checked={skips} onChange={(e) => { setSkips(e.target.checked); if (!e.target.checked) patch({ skipDates: [] }) }} />
        </label>
        {skips ? <div className="pb-3"><DateList dates={form.skipDates} max={SCHEDULE_SKIP_MAX} onChange={(skipDates) => patch({ skipDates })} label="Día sin actividad" /></div> : null}
        <label className="flex min-h-14 items-center justify-between gap-3 border-b border-muted text-sm">
          Festivos
          <select aria-label="Festivos" className="h-11 rounded-2xl border border-transparent bg-input/50 px-3 text-base" value={form.holidays} onChange={(e) => patch({ holidays: e.target.value as "" | "skip" | "only" })}>
            <option value="">Igual que los demás días</option>
            <option value="skip">No hay en festivos</option>
            <option value="only">Solo en festivos</option>
          </select>
        </label>
        <label className="flex min-h-14 items-center justify-between gap-3 text-sm">
          Hay que reservar antes
          <input type="checkbox" className="size-5 accent-[#9B0A26]" checked={form.requiresReservation} onChange={(e) => patch({ requiresReservation: e.target.checked })} />
        </label>
      </div>

      <Field label="Nota del horario" optional hint='Ej: "Si llueve fuerte se reprograma".'>
        {(id) => <Input id={id} value={form.scheduleNote} maxLength={SCHEDULE_NOTE_MAX} onChange={(e) => patch({ scheduleNote: e.target.value })} />}
      </Field>

      <section aria-live="polite" className="grid gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">ASÍ LO VERÁ LA GENTE</div>
        {preview.error ? <p className="text-sm text-muted-foreground">{preview.error}</p> : <p className="font-heading text-lg font-semibold">{preview.text}</p>}
        {preview.next.length ? (
          <>
            <div className="text-xs text-muted-foreground">Próximas fechas</div>
            <ul className="flex flex-wrap gap-1.5">{preview.next.map((d) => <li key={d} className="rounded-full bg-muted px-2.5 py-1 text-sm">{d}</li>)}</ul>
          </>
        ) : null}
      </section>
    </div>
  )
}
