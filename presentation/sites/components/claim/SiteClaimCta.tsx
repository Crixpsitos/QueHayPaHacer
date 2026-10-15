"use client"

import { useEffect, useId, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BadgeCheck, Clock, XIcon } from "lucide-react"
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
import { CLAIM_EVIDENCE_MAX, CLAIM_EVIDENCE_MIN, type ClaimRelation } from "@/domain/entities/siteClaim/SiteClaim"
import { hasPendingSiteClaimAction, requestSiteClaimAction } from "@/app/actions/site-claims/request-site-claim.action"
import type { SiteDetail } from "../../view-models/SiteFormViewModel"

const RELATIONS: { value: ClaimRelation; label: string }[] = [
  { value: "owner", label: "Soy el dueño" },
  { value: "legal_representative", label: "Soy representante legal" },
  { value: "authorized", label: "Estoy autorizado para administrarlo" },
]

const DECLARATION =
  "Declaro que soy dueño o represento este lugar y que lo que informo es verídico; entiendo que un reclamo falso puede llevar a retirar mi contenido y mi cuenta."

const btnClass = "min-h-11 rounded-xl bg-[#E63946] px-5 text-white hover:bg-[#E63946]/90"

/** "¿Es tu negocio? Reclámalo" / "Soy el administrador". Solo si la ficha no está verificada y no eres su autor. */
export function SiteClaimCta({ site }: { site: SiteDetail }) {
  const { user, isHydrating } = useAuth()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const uid = user?.uid
  const isAuthor = !!uid && uid === site.author.id

  // Lectura sin caché (server action): el estado del cliente no basta tras recargar.
  useEffect(() => {
    if (!uid || isAuthor || site.verification === "verified") return
    let alive = true
    hasPendingSiteClaimAction(site.id).then((p) => alive && setPending(p))
    return () => { alive = false }
  }, [uid, isAuthor, site.id, site.verification])

  if (isHydrating || isAuthor || site.verification === "verified") return null

  const isBusiness = site.kind !== "public"
  const label = isBusiness ? "Reclamar este lugar" : "Soy el administrador"

  if (pending) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Clock className="size-4 shrink-0" aria-hidden />
        Reclamo enviado, lo revisaremos.
      </p>
    )
  }

  const trigger = !user ? (
    <Button asChild variant="outline" className="min-h-11 rounded-xl">
      <Link href={`/login?redirect_to=${encodeURIComponent(pathname)}`}>
        <BadgeCheck className="size-4" aria-hidden />
        {label}
      </Link>
    </Button>
  ) : (
    <Button variant="outline" className="min-h-11 rounded-xl" onClick={() => setOpen(true)}>
      <BadgeCheck className="size-4" aria-hidden />
      {label}
    </Button>
  )

  const form = (
    <ClaimForm
      site={site}
      isBusiness={isBusiness}
      onDone={() => setPending(true)}
    />
  )
  const title = isBusiness ? "Reclamar este lugar" : "Administras este lugar"
  const description = isBusiness
    ? "Cuéntanos cómo comprobar que es tuyo. Lo revisamos manualmente."
    : "Si administras u operas este lugar, cuéntanos cómo comprobarlo. Lo revisamos manualmente."

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

function ClaimForm({ site, isBusiness, onDone }: { site: SiteDetail; isBusiness: boolean; onDone: () => void }) {
  const ids = useId()
  const [relation, setRelation] = useState<ClaimRelation>(isBusiness ? "owner" : "authorized")
  const [phone, setPhone] = useState("")
  const [evidence, setEvidence] = useState("")
  const [declared, setDeclared] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, startTransition] = useTransition()

  const trimmed = evidence.trim()
  const canSubmit = declared && trimmed.length >= CLAIM_EVIDENCE_MIN && !busy
  const relations = isBusiness ? RELATIONS : RELATIONS.slice(2)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    startTransition(async () => {
      const res = await requestSiteClaimAction({
        siteId: site.id, relation, contactPhone: phone, evidence: trimmed, declaration: declared,
      })
      if (res.success) onDone()
      else setError(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-5 text-left">
      {relations.length > 1 && (
        <fieldset className="grid gap-1" disabled={busy}>
          <legend className="mb-1 text-sm font-medium">Tu relación con el lugar</legend>
          {relations.map((r) => (
            <label key={r.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio" name={`${ids}-rel`} className="size-5 accent-[#E63946]"
                checked={relation === r.value} onChange={() => setRelation(r.value)}
              />
              {r.label}
            </label>
          ))}
        </fieldset>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-phone`} className="text-sm font-medium">
          Teléfono de contacto <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${ids}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={phone}
          onChange={(e) => setPhone(e.target.value)} disabled={busy} placeholder="+57 300 000 0000"
          className="h-11 text-base"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-ev`} className="text-sm font-medium">¿Cómo podemos comprobarlo?</Label>
        <Textarea
          id={`${ids}-ev`} value={evidence} onChange={(e) => setEvidence(e.target.value)}
          maxLength={CLAIM_EVIDENCE_MAX} rows={4} disabled={busy} aria-describedby={`${ids}-ev-hint`}
          placeholder="Ej.: instagram.com/minegocio, escribiré desde esa cuenta"
          className="min-h-28 text-base"
        />
        <p id={`${ids}-ev-hint`} className="text-xs text-muted-foreground">
          Sirve: el enlace a tu Instagram o web oficial, tu Cámara de Comercio o RUT (solo el dato, no lo adjuntes),
          un teléfono del negocio al que podamos llamar. {trimmed.length}/{CLAIM_EVIDENCE_MAX}
        </p>
      </div>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#E63946]"
          checked={declared} onChange={(e) => setDeclared(e.target.checked)} disabled={busy}
        />
        <span>{DECLARATION}</span>
      </label>

      {error && <p role="alert" className="text-sm text-[#E63946]">{error}</p>}

      <Button type="submit" disabled={!canSubmit} className={btnClass}>
        {busy ? "Enviando…" : "Enviar reclamo"}
      </Button>
    </form>
  )
}
