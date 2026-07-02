"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { cn } from "@/app/lib/utils/cn"
import { useSitesStore } from "../store/useSitesStore"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"

import { SitesMap } from "./map/SitesMap"
import { PanelHeader } from "./PanelHeader"
import { ListPanel } from "./list/ListPanel"
import { SiteFormDrawer } from "./form/SiteFormDrawer"
import { DetailModal } from "./DetailModal"
import { useSiteForm } from "../hooks/useSiteForm"
import { FILTER_TABS, getDisplayStatus } from "../lib/constants"
import type { Coordinates, MapSiteMarker, SiteDetail, SiteFilterTab } from "../view-models/SiteFormViewModel"

type PanelMode = "list" | "form"
type FormMode  = "create" | "edit"

function parsePathname(p: string): { panelMode: PanelMode; formMode: FormMode; detailId: string | null; editId: string | null } {
  if (p === "/sites/create") return { panelMode: "form", formMode: "create", detailId: null, editId: null }
  const editMatch = p.match(/^\/sites\/([^/]+)\/edit$/)
  if (editMatch) return { panelMode: "form", formMode: "edit", detailId: null, editId: editMatch[1] }
  const detailMatch = p.match(/^\/sites\/([^/]+)$/)
  if (detailMatch) return { panelMode: "list", formMode: "create", detailId: detailMatch[1], editId: null }
  return { panelMode: "list", formMode: "create", detailId: null, editId: null }
}

export function SitesModule() {
  const pathname = usePathname()
  const router   = useRouter()

  // ── Form — declared first so navigation callbacks can use it ───────────────
  const siteForm = useSiteForm()

  // ── Panel state — local for smooth animation, URL is just a reflection ─────
  const initial = parsePathname(pathname)
  const [panelMode, setPanelMode] = useState<PanelMode>(initial.panelMode)
  const [formMode,  setFormMode]  = useState<FormMode>(initial.formMode)
  const [detailId,  setDetailId]  = useState<string | null>(initial.detailId)
  const [editId,    setEditId]    = useState<string | null>(initial.editId)

  // Sync on browser back/forward
  useEffect(() => {
    const parsed = parsePathname(pathname)
    setPanelMode(parsed.panelMode)
    setFormMode(parsed.formMode)
    setDetailId(parsed.detailId)
    setEditId(parsed.editId)
  }, [pathname])

  // ── Data ───────────────────────────────────────────────────────────────────
  const { sites, fetchSites } = useSitesStore()

  useEffect(() => { fetchSites() }, []) // eslint-disable-line

  // On hard reload at /sites/{id}/edit, goToEdit() never runs — auto-load when sites arrive
  useEffect(() => {
    if (formMode !== "edit" || !editId) return
    if (siteForm.editId === editId) return  // already loaded via goToEdit
    const site = sites.find((s) => s.id === editId)
    if (site) siteForm.load(site)
  }, [sites, editId, formMode]) // eslint-disable-line
  const [tab,   setTab]   = useState<SiteFilterTab>("all")
  const [query, setQuery] = useState("")

  const searchFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? sites.filter((s) => s.name.toLowerCase().includes(q)) : sites
  }, [sites, query])

  const counts = useMemo(
    () => Object.fromEntries(
      FILTER_TABS.map(({ key }) => [
        key,
        key === "all" ? searchFiltered.length : searchFiltered.filter((s) => getDisplayStatus(s.publicationStatus, s.moderationStatus) === key).length,
      ])
    ) as Record<SiteFilterTab, number>,
    [searchFiltered],
  )

  const filtered = useMemo(
    () => searchFiltered.filter((s) => tab === "all" || getDisplayStatus(s.publicationStatus, s.moderationStatus) === tab),
    [searchFiltered, tab],
  )

  // ── Mapa ───────────────────────────────────────────────────────────────────
  const [hoveredId,  setHoveredId]  = useState<string | null>(null)
  const [focus,      setFocus]      = useState<Coordinates | null>(null)
  const [focusNonce, setFocusNonce] = useState(0)

  const markers = useMemo<MapSiteMarker[]>(
    () => (panelMode !== "form" ? filtered : []).map((s) => ({
      id: s.id, name: s.name, coordinates: s.coordinates,
      status: getDisplayStatus(s.publicationStatus, s.moderationStatus),
      coverUrl: s.coverUrl || undefined,
    })),
    [filtered, panelMode],
  )

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToList = useCallback(() => {
    siteForm.reset()
    setPanelMode("list")
    setEditId(null)
    router.push("/sites")
  }, [router]) // eslint-disable-line

  const goToCreate = useCallback(() => {
    siteForm.reset()
    setFormMode("create")
    setEditId(null)
    setPanelMode("form")
    router.push("/sites/create")
  }, [router]) // eslint-disable-line

  const goToEdit = useCallback((id: string) => {
    const site = sites.find((s) => s.id === id)
    if (!site) return
    siteForm.load(site)
    setDetailId(null)
    setFormMode("edit")
    setEditId(id)
    setPanelMode("form")
    router.push(`/sites/${id}/edit`)
  }, [sites, router]) // eslint-disable-line

  const openDetail = useCallback((id: string) => {
    const item = sites.find((s) => s.id === id)
    if (item) { setFocus(item.coordinates); setFocusNonce((n) => n + 1) }
    setDetailId(id)
    router.push(`/sites/${id}`)
  }, [sites, router])

  const closeDetail = useCallback(() => {
    setDetailId(null)
    router.push("/sites")
  }, [router])

  // ── Map props ──────────────────────────────────────────────────────────────
  const mapProps = panelMode === "form" && formMode === "create"
    ? { mode: "pick"   as const, coordinates: siteForm.form.coordinates, coverUrl: siteForm.coverUrl, onPick: siteForm.handlePick }
    : panelMode === "form" && formMode === "edit"
    ? { mode: "pick"   as const, coordinates: siteForm.form.coordinates, coverUrl: siteForm.coverUrl, onPick: siteForm.handlePick }
    : { mode: "browse" as const, markers, hoveredId, selectedId: detailId, onHoverSite: setHoveredId, onSelectSite: openDetail, focus, focusNonce }

  const selectedSite = detailId ? (sites.find((s) => s.id === detailId) ?? null) : null

  // ¿estamos editando un borrador? → el drawer muestra acciones de borrador/publicar
  const editingSite = editId ? sites.find((s) => s.id === editId) : null
  const isDraftEdit = formMode === "edit" && !!editingSite &&
    getDisplayStatus(editingSite.publicationStatus, editingSite.moderationStatus) === "draft"

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
      {/* Map — full screen on mobile in form mode so the portal drawer overlays cleanly */}
      <section
        className={cn(
          "relative w-full shrink-0 lg:h-full lg:flex-1",
          panelMode === "form" ? "h-dvh" : "h-[42dvh]",
        )}
        aria-label="Mapa de sitios"
      >
        <SitesMap {...mapProps} />
      </section>

      {/* Panel section — hidden on mobile in form mode (portal drawer owns that space) */}
      <section className={cn(
        "min-h-0 flex-1 flex-col border-t border-border bg-background lg:h-full lg:w-[420px] lg:min-w-[380px] lg:max-w-[480px] lg:flex-none lg:border-l lg:border-t-0",
        panelMode === "form" ? "hidden lg:flex" : "flex",
      )}>
        <div className={panelMode === "form" ? "hidden lg:block" : ""}>
          <PanelHeader
            panelMode={panelMode}
            formMode={formMode}
            onCreate={goToCreate}
            onBack={goToList}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {panelMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <ListPanel
                items={filtered}
                totalFiltered={filtered.length}
                counts={counts}
                tab={tab}
                onTabChange={setTab}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onOpen={openDetail}
                onEdit={goToEdit}
                onCreate={goToCreate}
                isLoading={false}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <SiteFormDrawer
                form={siteForm.form}
                errors={siteForm.errors}
                submitState={siteForm.submitState}
                coverUrl={siteForm.coverUrl}
                isMediaProcessing={siteForm.isMediaProcessing}
                addressAutoDetected={siteForm.addressAutoDetected}
                mode={formMode}
                isDraft={isDraftEdit}
                onBack={goToList}
                onAddressChange={siteForm.handleAddressChange}
                onUpdateField={siteForm.updateField}
                onClearError={siteForm.clearError}
                onReplaceCover={siteForm.replaceCover}
                onAddMedia={siteForm.addMedia}
                onMediaUploaded={siteForm.handleMediaUploaded}
                onUpdateMedia={siteForm.updateMedia}
                onRemoveMedia={siteForm.removeMedia}
                onSetCover={siteForm.setCover}
                onUpdateSchedule={siteForm.updateSchedule}
                onSaveDraft={siteForm.handleSaveDraft}
                onPublish={formMode === "edit" && !isDraftEdit ? siteForm.handleSaveEdit : siteForm.handlePublish}
                onReset={goToList}
                onEnsureDraftId={siteForm.ensureDraftId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <DetailModal
        site={selectedSite}
        onClose={closeDetail}
        onEdit={goToEdit}
      />
    </main>
  )
}
