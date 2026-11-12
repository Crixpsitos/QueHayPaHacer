"use client"

import { useState } from "react"
import { Lock, Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { saveHostIdentityAction } from "@/app/actions/activities/host-identity.action"
import type { WizardContext } from "@/app/actions/activities/wizard-data.action"
import { emptyIdentity, identityError, identityToRaw, withKind, type IdentityForm } from "@/presentation/activities/lib/identityForm"
import { Field, RadioCard, selectClass } from "./ui"

interface Props {
  context: WizardContext
  /** Publica la actividad (declaración incluida). Devuelve el error o null si salió bien. */
  onPublish: () => Promise<string | null>
  onError: (message: string) => void
}

/** Paso 9: datos de identificación (Ley 1480 art. 53, solo la primera vez), declaración y envío a revisión. */
export function StepPublish({ context, onPublish, onError }: Props) {
  const needsIdentity = !context.identity.ok
  const [identity, setIdentity] = useState<IdentityForm>(emptyIdentity())
  const [authorized, setAuthorized] = useState(false)
  const [declared, setDeclared] = useState(context.isAdmin)
  const [busy, setBusy] = useState(false)
  const set = (p: Partial<IdentityForm>) => setIdentity((f) => ({ ...f, ...p }))

  const idError = needsIdentity ? identityError(identity) : null
  const ready = declared && (!needsIdentity || (authorized && idError === null))

  const submit = async () => {
    setBusy(true)
    try {
      if (needsIdentity) {
        const r = await saveHostIdentityAction(identityToRaw(identity), authorized)
        if (!r.success) return onError(r.error)
      }
      const err = await onPublish()
      if (err) onError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      {needsIdentity ? (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
            <Lock className="mt-0.5 size-5 shrink-0 text-primary-dark" aria-hidden />
            <p><strong>Tus datos no se muestran en la página.</strong> Los guardamos en privado, los entregamos a la autoridad si los pide, y los puede consultar quien necesite presentar una queja sobre tu actividad.</p>
          </div>

          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Publicas como">
            <RadioCard name="who" checked={identity.kind === "person"} onChange={() => setIdentity((f) => withKind(f, "person"))} title="Persona" />
            <RadioCard name="who" checked={identity.kind === "company"} onChange={() => setIdentity((f) => withKind(f, "company"))} title="Empresa" />
          </div>

          <Field label={identity.kind === "person" ? "Nombre completo" : "Razón social"}>
            {(id) => <Input id={id} autoComplete={identity.kind === "person" ? "name" : "organization"} value={identity.name} onChange={(e) => set({ name: e.target.value })} />}
          </Field>
          {identity.kind === "company" ? (
            <Field label="Representante legal">{(id) => <Input id={id} value={identity.representative} onChange={(e) => set({ representative: e.target.value })} />}</Field>
          ) : null}
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <Field label="Documento">
              {(id) =>
                identity.kind === "company" ? (
                  <select id={id} className={selectClass} value="NIT" disabled><option>NIT</option></select>
                ) : (
                  <select id={id} className={selectClass} value={identity.documentType} onChange={(e) => set({ documentType: e.target.value as IdentityForm["documentType"] })}>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                )
              }
            </Field>
            <Field label="Número">{(id) => <Input id={id} inputMode={identity.documentType === "PAS" ? "text" : "numeric"} value={identity.documentNumber} onChange={(e) => set({ documentNumber: e.target.value })} />}</Field>
          </div>
          <Field label="Dirección" hint="Calle o carrera, número y ciudad.">{(id) => <Input id={id} autoComplete="street-address" value={identity.address} onChange={(e) => set({ address: e.target.value })} />}</Field>
          <Field label="Correo electrónico">{(id) => <Input id={id} type="email" autoComplete="email" value={identity.email} onChange={(e) => set({ email: e.target.value })} />}</Field>
          <div className="grid gap-2">
            {identity.phones.map((p, i) => (
              <Field key={i} label={i === 0 ? "Teléfono" : `Teléfono ${i + 1}`} hint={i === 0 ? "Celular o fijo de 10 dígitos." : undefined}>
                {(id) => <Input id={id} type="tel" autoComplete="tel" placeholder="300 123 4567" value={p} onChange={(e) => set({ phones: identity.phones.map((x, j) => (j === i ? e.target.value : x)) })} />}
              </Field>
            ))}
            {identity.phones.length < 3 ? <Button type="button" variant="ghost" size="lg" className="h-11 justify-start" onClick={() => set({ phones: [...identity.phones, ""] })}><Plus aria-hidden /> Agregar otro teléfono</Button> : null}
          </div>
          {idError && (identity.name || identity.documentNumber || identity.address || identity.email) ? <p className="text-sm text-muted-foreground" aria-live="polite">{idError}</p> : null}
        </>
      ) : (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm">Tus datos de identificación ya están registrados. No tienes que volver a escribirlos.</p>
      )}

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4">
        {needsIdentity ? (
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#9B0A26]" />
            Autorizo a Qué Hay Pa Hacer a guardar y tratar estos datos para cumplir con la ley y atender quejas. <a href="/privacidad" target="_blank" rel="noreferrer" className="font-semibold text-primary-dark underline">Política de datos</a>
          </label>
        ) : null}
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#9B0A26]" />
          Declaro que tengo derecho a usar los textos y las fotos, que lo publicado es verdadero y que respondo por mi actividad.
        </label>
      </div>

      <div className="grid gap-2">
        <Button type="button" size="lg" className="h-12 text-base" disabled={!ready || busy} onClick={() => void submit()}>{busy ? "Enviando…" : context.isAdmin ? "Publicar" : "Enviar a revisión"}</Button>
        {!ready ? <p className="text-center text-xs text-muted-foreground">Se activa cuando completas los datos y marcas {needsIdentity ? "las dos casillas" : "la casilla"}.</p> : null}
      </div>
    </div>
  )
}
