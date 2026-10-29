"use client"

import { useEffect, useId, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, MessageSquareDiff, XIcon } from "lucide-react"
import { useAuth } from "@/app/store/auth/AuthContext"
import { useMediaQuery } from "@/app/lib/hooks/useMediaQuery"
import { Button } from "@/app/components/ui/button"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Input } from "@/app/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/app/components/ui/dialog"
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,
} from "@/app/components/ui/drawer"
import {
  SUGGESTION_DESCRIPTION_MAX, SUGGESTION_DESCRIPTION_MIN, SUGGESTION_FIELDS, SUGGESTION_FIELD_LABELS,
  SUGGESTION_SOURCE_MAX, type SuggestionField,
} from "@/domain/entities/siteSuggestion/SiteSuggestion"
import {
  hasPendingSiteSuggestionAction, suggestSiteChangeAction,
} from "@/app/actions/site-suggestions/suggest-site-change.action"
import type { SiteDetail } from "../../view-models/SiteFormViewModel"

const DECLARATION =
  "Lo que informo es verídico y no incluye datos personales de otras personas. Entiendo que lo revisa el equipo antes de aplicarse."

const btnClass = "min-h-11 rounded-xl bg-[#D42F3C] px-5 text-white hover:bg-[#D42F3C]/90"

/** "Sugerir un cambio": cualquiera con sesión menos el autor (que edita directo). Nunca se aplica solo. */
export function SiteSuggestCta({ site }: { site: SiteDetail }) {
  const { user, isHydrating } = useAuth()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const uid = user?.uid
  const isAuthor = !!uid && uid === site.author.id

  // Lectura sin caché (server action): el estado del cliente no basta tras recargar.
  useEffect(() => {
    if (!uid || isAuthor) return
    let alive = true
    hasPendingSiteSuggestionAction(site.id).then((p) => alive && setSent(p))
    return () => { alive = false }
  }, [uid, isAuthor, site.id])

  if (isHydrating || isAuthor) return null

  // Sugerida ya (esta sesión o pendiente de antes): aviso en vez de botón. Puede sugerir otro campo tras resolverse.
  if (sent) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Clock className="size-4 shrink-0" aria-hidden />
        Sugerencia enviada, la revisaremos.
      </p>
    )
  }

  const trigger = !user ? (
    <Button asChild variant="outline" className="min-h-11 rounded-xl">
      <Link href={`/login?redirect_to=${encodeURIComponent(pathname)}`}>
        <MessageSquareDiff className="size-4" aria-hidden />
        Sugerir un cambio
      </Link>
    </Button>
  ) : (
    <Button variant="outline" className="min-h-11 rounded-xl" onClick={() => setOpen(true)}>
      <MessageSquareDiff className="size-4" aria-hidden />
      Sugerir un cambio
    </Button>
  )

  const form = <SuggestForm site={site} onDone={() => { setSent(true); setOpen(false) }} />
  const title = "Sugerir un cambio"
  const description = "¿Algo está desactualizado o mal? Cuéntanoslo. El equipo lo revisa antes de cambiar la ficha."

  return (
    <>
      {trigger}
      {user &&
        (isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="max-h-[92dvh]">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" aria-label="Cerrar" className="absolute top-3 right-3 z-10 size-11 bg-secondary">
                  <XIcon />
                </Button>
              </DrawerClose>
              <DrawerHeader className="pr-14">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto overscroll-contain px-4 pb-6">{form}</div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              {form}
            </DialogContent>
          </Dialog>
        ))}
    </>
  )
}

function SuggestForm({ site, onDone }: { site: SiteDetail; onDone: () => void }) {
  const ids = useId()
  const [field, setField] = useState<SuggestionField | null>(null)
  const [description, setDescription] = useState("")
  const [source, setSource] = useState("")
  const [declared, setDeclared] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, startTransition] = useTransition()

  const trimmed = description.trim()
  const canSubmit = !!field && declared && trimmed.length >= SUGGESTION_DESCRIPTION_MIN && !busy

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !field) return
    setError(null)
    startTransition(async () => {
      const res = await suggestSiteChangeAction({
        siteId: site.id, field, description: trimmed, source: source.trim(), declaration: declared,
      })
      if (res.success) onDone()
      else setError(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-5 text-left">
      <fieldset className="grid gap-1" disabled={busy}>
        <legend className="mb-1 text-sm font-medium">¿Qué quieres cambiar?</legend>
        {SUGGESTION_FIELDS.map((f) => (
          <label key={f} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio" name={`${ids}-field`} className="size-5 accent-[#D42F3C]"
              checked={field === f} onChange={() => setField(f)}
            />
            {SUGGESTION_FIELD_LABELS[f]}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-desc`} className="text-sm font-medium">¿Qué debería decir?</Label>
        <Textarea
          id={`${ids}-desc`} value={description} onChange={(e) => setDescription(e.target.value)}
          maxLength={SUGGESTION_DESCRIPTION_MAX} rows={4} disabled={busy} aria-describedby={`${ids}-desc-hint`}
          placeholder="Ej.: Ahora abren de lunes a sábado de 8 a. m. a 6 p. m."
          className="min-h-28 text-base"
        />
        <p id={`${ids}-desc-hint`} className="text-xs text-muted-foreground">
          Mínimo {SUGGESTION_DESCRIPTION_MIN} caracteres. {trimmed.length}/{SUGGESTION_DESCRIPTION_MAX}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-src`} className="text-sm font-medium">
          Fuente <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${ids}-src`} value={source} onChange={(e) => setSource(e.target.value)}
          maxLength={SUGGESTION_SOURCE_MAX} disabled={busy} className="h-11 text-base"
          placeholder="Enlace o “estuve ahí el 12 de octubre”"
        />
      </div>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#D42F3C]"
          checked={declared} onChange={(e) => setDeclared(e.target.checked)} disabled={busy}
        />
        <span>{DECLARATION}</span>
      </label>

      {error && <p role="alert" className="text-sm text-[#D42F3C]">{error}</p>}

      <Button type="submit" disabled={!canSubmit} className={btnClass}>
        {busy ? "Enviando…" : "Enviar sugerencia"}
      </Button>
    </form>
  )
}
