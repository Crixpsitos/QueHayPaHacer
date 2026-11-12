"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { saveActivityAction } from "@/app/actions/activities/save-activity.action"
import type { EditableActivity, WizardContext } from "@/app/actions/activities/wizard-data.action"
import { WIZARD_STEPS, emptyForm, stepError, toRawInput, type ActivityForm } from "@/presentation/activities/lib/activityForm"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { StepKind } from "./StepKind"
import { StepBasics } from "./StepBasics"
import { StepSchedule } from "./StepSchedule"
import { StepPrice } from "./StepPrice"
import { StepMeeting } from "./StepMeeting"
import { StepMedia } from "./StepMedia"
import { StepCta } from "./StepCta"
import { StepSections } from "./StepSections"
import { StepPublish } from "./StepPublish"
import { Submitted } from "./Submitted"

const TITLES: Record<number, { title: string; lead: string }> = {
  1: { title: "¿Qué tipo de actividad es?", lead: "Elige si depende de un lugar o no." },
  2: { title: "¿Qué es?", lead: "Cuéntalo claro y corto: es lo que la gente lee primero." },
  3: { title: "¿Cuándo es?", lead: "Elige cómo se repite. La gente verá la próxima fecha automáticamente." },
  4: { title: "¿Cuánto cuesta?", lead: "Una o varias opciones, y los extras que se pagan aparte." },
  5: { title: "¿Dónde nos encontramos?", lead: "Cómo llega la gente." },
  6: { title: "Fotos y video", lead: "Una portada y hasta 8 fotos más." },
  7: { title: "¿Cómo se unen?", lead: "El botón que verá la gente." },
  8: { title: "Más información", lead: "Qué incluye, qué llevar, reglas." },
  9: { title: "Quién ofrece esta actividad", lead: "La ley pide que quien ofrece algo se identifique." },
}

const DRAFT_KEY = "qhpa-activity-draft-v1"
const LAST_LOCAL_STEP = 5 // desde el paso 6 la actividad ya existe en el servidor (hace falta su id para subir fotos)

interface Props {
  context: WizardContext
  initial?: EditableActivity
}

/** Asistente de creación y edición. El estado vive aquí; la validación real la repite el servidor al guardar. */
export function ActivityWizard({ context, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ActivityForm>(initial?.form ?? emptyForm())
  const [media, setMedia] = useState<ActivityMedia[]>(initial?.media ?? [])
  const [activityId, setActivityId] = useState<string | undefined>(initial?.id)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ slug: string; moderationStatus: "pending" | "approved" | "rejected" } | null>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  /** El borrador local solo se escribe después de haberlo leído: si no, el formulario vacío pisaría el guardado. */
  const draftLoaded = useRef(Boolean(initial))
  const patch = useCallback((p: Partial<ActivityForm>) => setForm((f) => ({ ...f, ...p })), [])

  // Borrador local mientras la actividad aún no existe en el servidor (antes del paso 6).
  useEffect(() => {
    if (initial) return
    // Se lee en un callback (no en el cuerpo del efecto) para no re-renderizar en cascada ni romper la hidratación.
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) setForm({ ...emptyForm(), ...(JSON.parse(raw) as Partial<ActivityForm>) })
      } catch {
        /* sin almacenamiento: no pasa nada */
      }
      draftLoaded.current = true
    }, 0)
    return () => clearTimeout(t)
  }, [initial])
  useEffect(() => {
    if (initial || activityId || !draftLoaded.current) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {
      /* ignorar */
    }
  }, [form, initial, activityId])

  const fail = (message: string) => {
    setError(message)
    requestAnimationFrame(() => alertRef.current?.focus())
  }

  /** Guarda como borrador (o edita) y devuelve el id. null si falló (ya mostró el error). */
  const persist = useCallback(async (mediaOverride?: ActivityMedia[]): Promise<string | null> => {
    setSaving(true)
    try {
      const r = await saveActivityAction(toRawInput(form), mediaOverride ?? media, { id: activityId, publish: false, declaration: false })
      if (!r.success) {
        fail(r.error)
        return null
      }
      setActivityId(r.id)
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* ignorar */
      }
      return r.id
    } finally {
      setSaving(false)
    }
  }, [form, media, activityId])

  /** Publica (o reenvía a revisión). Devuelve el error o null si salió bien. */
  const publish = useCallback(async (): Promise<string | null> => {
    if (!activityId) return "Guarda el borrador primero."
    const r = await saveActivityAction(toRawInput(form), media, { id: activityId, publish: true, declaration: true })
    if (!r.success) return r.error
    setDone({ slug: r.slug, moderationStatus: r.moderationStatus })
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignorar */
    }
    return null
  }, [form, media, activityId])

  const next = async () => {
    const e = stepError(step, form, { coverCount: step === 6 ? media.filter((m) => m.type === "image" && m.isCover).length : undefined })
    if (e) return fail(e)
    setError(null)
    if (step === LAST_LOCAL_STEP || (activityId && step > LAST_LOCAL_STEP && step < WIZARD_STEPS)) {
      if (!(await persist())) return
    }
    setStep((s) => Math.min(WIZARD_STEPS, s + 1))
    window.scrollTo({ top: 0 })
  }
  const back = () => {
    setError(null)
    if (step === 1) router.back()
    else setStep((s) => s - 1)
  }

  if (done) return <Submitted id={activityId!} title={form.title} slug={done.slug} coverUrl={media.find((m) => m.type === "image" && m.isCover)?.url} moderationStatus={done.moderationStatus} />

  const head = TITLES[step]
  let body: ReactNode
  switch (step) {
    case 1: body = <StepKind form={form} patch={patch} context={context} />; break
    case 2: body = <StepBasics form={form} patch={patch} context={context} />; break
    case 3: body = <StepSchedule form={form} patch={patch} context={context} />; break
    case 4: body = <StepPrice form={form} patch={patch} context={context} />; break
    case 5: body = <StepMeeting form={form} patch={patch} context={context} />; break
    case 6:
      body = activityId ? (
        <StepMedia activityId={activityId} media={media} setMedia={setMedia} persist={async (m) => (await persist(m)) !== null} onError={fail} />
      ) : (
        <p className="text-sm text-muted-foreground">Guardando tu borrador…</p>
      )
      break
    case 7: body = <StepCta form={form} patch={patch} context={context} />; break
    case 8: body = <StepSections form={form} patch={patch} context={context} activityId={activityId} />; break
    default: body = <StepPublish context={context} onPublish={publish} onError={fail} />
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-4">
      <header className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="secondary" size="icon-lg" aria-label="Volver" onClick={back}><ArrowLeft aria-hidden /></Button>
          <span className="text-sm font-semibold text-muted-foreground">Paso {step} de {WIZARD_STEPS}</span>
          <span className="min-w-28 text-right text-xs text-muted-foreground" aria-live="polite">{activityId ? "Borrador guardado" : "Se guarda en este dispositivo"}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={WIZARD_STEPS} aria-valuenow={step} aria-label="Progreso">
          <div className="h-full bg-grad-primary transition-[width]" style={{ width: `${(step / WIZARD_STEPS) * 100}%` }} />
        </div>
      </header>

      <div className="grid gap-1.5">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{head.title}</h1>
        <p className="text-sm text-muted-foreground">{head.lead}</p>
      </div>

      {body}

      <div ref={alertRef} tabIndex={-1} role="alert" className="outline-none">
        {error ? <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p> : null}
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <Button type="button" variant="outline" size="lg" className="h-12 w-28" onClick={back}>Atrás</Button>
        {step < WIZARD_STEPS ? <Button type="button" size="lg" className="h-12 flex-1 text-base" onClick={next} disabled={saving}>{saving ? "Guardando…" : "Continuar"}</Button> : null}
      </div>
    </div>
  )
}
