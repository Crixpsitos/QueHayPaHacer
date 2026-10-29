"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { MessageSquareDiff, Pencil, XIcon } from "lucide-react"
import { useMediaQuery } from "@/app/lib/hooks/useMediaQuery"
import { cn } from "@/app/lib/utils/cn"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/app/components/ui/dialog"
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,
} from "@/app/components/ui/drawer"
import {
  SUGGESTION_FIELD_LABELS, SUGGESTION_NOTE_MAX, type SiteSuggestionItem,
} from "@/domain/entities/siteSuggestion/SiteSuggestion"
import { listMySiteSuggestionsAction } from "@/app/actions/site-suggestions/list-my-site-suggestions.action"
import { resolveSiteSuggestionAction } from "@/app/actions/site-suggestions/resolve-site-suggestion.action"

/** Sugerencias recibidas en mis sitios. Se carga al montar "Mis sitios" y se refresca tras resolver. */
export function useMySuggestions() {
  const [items, setItems] = useState<SiteSuggestionItem[]>([])
  const refresh = useCallback(async () => {
    const res = await listMySiteSuggestionsAction().catch(() => null)
    if (res?.success) setItems(res.items)
  }, [])
  useEffect(() => {
    let alive = true
    listMySiteSuggestionsAction().then((res) => { if (alive && res.success) setItems(res.items) }).catch(() => {})
    return () => { alive = false }
  }, [])
  const pendingBySite = useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of items) if (s.status === "pending") m[s.siteId] = (m[s.siteId] ?? 0) + 1
    return m
  }, [items])
  const pendingTotal = useMemo(() => Object.values(pendingBySite).reduce((a, b) => a + b, 0), [pendingBySite])
  return { items, refresh, pendingBySite, pendingTotal }
}

const fmtDate = (ms: number) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(ms)

interface PanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SiteSuggestionItem[]
  refresh: () => Promise<void>
  /** Abre el editor del sitio (cierra el panel). */
  onEdit: (siteId: string) => void
}

export function MySuggestionsPanel({ open, onOpenChange, items, refresh, onEdit }: PanelProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [tab, setTab] = useState<"pending" | "done">("pending")
  // Recién aprobadas se quedan en "Pendientes" para ofrecer "Editar sitio" justo ahí.
  const [kept, setKept] = useState<Set<string>>(new Set())
  // Las recién aprobadas van arriba para que "Editar sitio" quede a la vista.
  const pending = [...items.filter((s) => kept.has(s.id)), ...items.filter((s) => s.status === "pending" && !kept.has(s.id))]
  const done = items.filter((s) => s.status !== "pending" && !kept.has(s.id))
  const list = tab === "pending" ? pending : done
  const edit = (siteId: string) => { onOpenChange(false); onEdit(siteId) }

  const body = (
    <div className="grid gap-4">
      <div role="tablist" className="flex gap-1 border-b border-border">
        {([["pending", `Pendientes (${pending.length})`], ["done", `Resueltas (${done.length})`]] as const).map(([k, label]) => (
          <button
            key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn(
              "min-h-11 border-b-2 px-3 text-sm font-medium",
              tab === k ? "border-[#D42F3C] text-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tab === "pending" ? "No tienes sugerencias pendientes" : "Aún no has resuelto sugerencias"}
        </p>
      ) : (
        <ul className="grid gap-3">
          {list.map((s) => (
            <SuggestionRow key={s.id} s={s} refresh={refresh} onEdit={edit} onApproved={() => setKept((k) => new Set(k).add(s.id))} />
          ))}
        </ul>
      )}
    </div>
  )
  const title = "Sugerencias recibidas"
  const description = "Personas proponen cambios a tus sitios. Aprobar no edita la ficha: después de aprobar, edítala tú."

  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange}>
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
        <div className="overflow-y-auto overscroll-contain px-4 pb-6">{body}</div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}

function SuggestionRow({ s, refresh, onEdit, onApproved }: { s: SiteSuggestionItem; refresh: () => Promise<void>; onEdit: (siteId: string) => void; onApproved: () => void }) {
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, startTransition] = useTransition()
  const isPending = s.status === "pending"

  function resolve(decision: "approve" | "reject") {
    setError(null)
    startTransition(async () => {
      const res = await resolveSiteSuggestionAction(s.id, decision, note.trim())
      if (res.success) {
        if (decision === "approve") onApproved()
        await refresh()
      }
      else setError(res.error)
    })
  }

  return (
    <li className="grid gap-2 rounded-2xl border border-border bg-card p-3.5 text-left">
      <div className="flex items-start gap-2">
        <MessageSquareDiff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{s.siteName}</span> · {SUGGESTION_FIELD_LABELS[s.field]}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{s.description}</p>
          {s.source && <p className="mt-1 break-words text-xs text-muted-foreground">Fuente: {s.source}</p>}
          <p className="mt-1 text-xs text-muted-foreground">De {s.authorName} · {fmtDate(s.createdAt)}</p>
        </div>
      </div>

      {isPending ? (
        <>
          <Input
            value={note} onChange={(e) => setNote(e.target.value)} maxLength={SUGGESTION_NOTE_MAX} disabled={busy}
            aria-label="Nota opcional" placeholder="Nota (opcional)" className="h-11 text-base"
          />
          {error && <p role="alert" className="text-sm text-[#D42F3C]">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => resolve("reject")} className="min-h-11 rounded-xl">
              Rechazar
            </Button>
            <Button disabled={busy} onClick={() => resolve("approve")} className="min-h-11 rounded-xl bg-[#D42F3C] text-white hover:bg-[#D42F3C]/90">
              Aprobar
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {s.status === "applied" ? "Aprobada" : "Rechazada"}
            {s.resolvedAt ? ` · ${fmtDate(s.resolvedAt)}` : ""}
            {s.resolutionNote ? ` · ${s.resolutionNote}` : ""}
          </p>
          {s.status === "applied" && (
            <Button variant="outline" onClick={() => onEdit(s.siteId)} className="min-h-11 rounded-xl">
              <Pencil className="size-4" aria-hidden />
              Editar sitio
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
