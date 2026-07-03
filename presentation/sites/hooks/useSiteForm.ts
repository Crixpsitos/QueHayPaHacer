"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createInitialForm } from "../lib/constants"
import { reverseGeocode } from "../lib/geocoding"
import { saveDraftSiteAction } from "@/app/actions/sites/save-draft-site.action"
import { publishSiteAction } from "@/app/actions/sites/publish-site.action"
import { updateSiteAction } from "@/app/actions/sites/update-site.action"
import { notify } from "@/presentation/shared/lib/notify"
import { createClientContainer } from "@/infraestructure/di/container.client"
import { useSitesStore } from "../store/useSitesStore"
import type {
  Coordinates,
  DaySchedule,
  FormErrors,
  MediaFormItem,
  SiteDetail,
  SiteFormViewModel,
  WeekDay,
} from "../view-models/SiteFormViewModel"

export type SubmitState = "idle" | "saving" | "publishing" | "done"

export function useSiteForm() {
  const fetchSites = useSitesStore((s) => s.fetchSites)
  const [form, setForm] = useState<SiteFormViewModel>(createInitialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [addressAutoDetected, setAddressAutoDetected] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [siteId, setSiteId] = useState<string | null>(null)
  const reqRef = useRef(0)
  // ensures only one concurrent ensureDraftId call
  const ensureRef = useRef<Promise<string> | null>(null)

  // Latest committed snapshots — read inside async flows to avoid stale closures
  // and to persist WITHOUT running side effects inside a setState updater.
  const formRef = useRef(form)
  const siteIdRef = useRef<string | null>(null)
  const editIdRef = useRef<string | null>(null)
  useEffect(() => { formRef.current = form }, [form])

  // Persisted-doc id (draft created during upload, or the edited site). Single source of truth.
  const commitSiteId = useCallback((id: string) => { siteIdRef.current = id; setSiteId(id) }, [])
  const targetId = useCallback(() => editIdRef.current ?? siteIdRef.current, [])
  // serialize autosaves so parallel gallery uploads write the doc in order (last = full set)
  const persistQueue = useRef<Promise<unknown>>(Promise.resolve())

  // Real-time listener on the site doc: reflects the optimizer CF result (processing → ready/error).
  // Also prevents the app from overwriting the CF's optimized url when it re-persists.
  const sitesRepo = useMemo(() => createClientContainer().sitesRepository, [])
  useEffect(() => {
    const id = editId ?? siteId
    if (!id) return
    return sitesRepo.findByIdOnSnapshot(id, (dto) => {
      const remoteMedia = dto?.media as Array<{ id: string; status?: string; url?: string; path?: string }> | undefined
      if (!remoteMedia) return
      setForm((prev) => {
        let changed = false
        const media = prev.media.map((local) => {
          const remote = remoteMedia.find((r) => r.id === local.id)
          // only sync once the CF finished (ready/error); ignore its intermediate "processing"
          if (remote && (remote.status === "ready" || remote.status === "error") && local.status !== remote.status) {
            changed = true
            return { ...local, status: remote.status as MediaFormItem["status"], url: remote.url ?? local.url, path: remote.path ?? local.path }
          }
          return local
        })
        return changed ? { ...prev, media } : prev
      })
    })
  }, [editId, siteId, sitesRepo])

  const coverUrl = useMemo(
    // muestra la portada en el pin incluso mientras el CF optimiza
    () => form.media.find((m) => m.type === "image" && m.isCover && (m.status === "ready" || m.status === "processing"))?.url,
    [form.media],
  )

  // bloquea publicar mientras algo sube (deopt) o el CF optimiza (processing)
  const isMediaProcessing = useMemo(
    () => form.media.some((m) => m.status === "uploading" || m.status === "processing"),
    [form.media],
  )

  const clearError = useCallback((key: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const updateField = useCallback(<K extends keyof SiteFormViewModel>(key: K, value: SiteFormViewModel[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handlePick = useCallback(
    (coords: Coordinates, addressFromSearch?: string) => {
      clearError("coordinates")
      if (addressFromSearch !== undefined) {
        setForm((prev) => ({ ...prev, coordinates: coords, address: addressFromSearch || prev.address }))
        setAddressAutoDetected(Boolean(addressFromSearch))
        if (addressFromSearch) clearError("address")
        return
      }
      setForm((prev) => ({ ...prev, coordinates: coords }))
      const id = ++reqRef.current
      void reverseGeocode(coords.latitude, coords.longitude).then((addr) => {
        if (id !== reqRef.current || !addr) return
        setForm((prev) => ({ ...prev, address: addr }))
        setAddressAutoDetected(true)
        clearError("address")
      })
    },
    [clearError],
  )

  const handleAddressChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, address: value }))
    setAddressAutoDetected(false)
    clearError("address")
  }, [clearError])

  const addMedia = useCallback((items: MediaFormItem[]) => {
    setForm((prev) => {
      const hasCover = prev.media.some((m) => m.type === "image" && m.isCover)
      let coverAssigned = hasCover
      const normalized = items.map((item) => {
        if (item.type === "image" && !coverAssigned) { coverAssigned = true; return { ...item, isCover: true } }
        return item
      })
      return { ...prev, media: [...prev.media, ...normalized] }
    })
  }, [])

  // Atomically replace the cover image (used by media upload component)
  const replaceCover = useCallback((item: MediaFormItem) => {
    setForm((prev) => {
      const filtered = prev.media.filter((m) => !(m.type === "image" && m.isCover))
      return { ...prev, media: [...filtered, { ...item, isCover: true }] }
    })
  }, [])

  const updateMedia = useCallback((id: string, partial: Partial<MediaFormItem>) => {
    setForm((prev) => ({ ...prev, media: prev.media.map((m) => m.id === id ? { ...m, ...partial } : m) }))
  }, [])

  // Called after upload completes — marks item ready + persists to the SAME draft doc.
  // The persist runs OUTSIDE the setState updater (a server action inside an updater triggers
  // "Cannot update Router while rendering"), and reuses the draft id so it never duplicates.
  const handleMediaUploaded = useCallback(async (id: string, url: string, path: string) => {
    // deopt subido → "processing"; el syncer lo pasa a "ready" cuando el CF termina
    const patch = (list: MediaFormItem[]) =>
      list.map((m) => m.id === id ? { ...m, url, path, status: "processing" as const } : m)
    // sync ref immediately so concurrent gallery uploads persist the full media set
    formRef.current = { ...formRef.current, media: patch(formRef.current.media) }
    setForm((prev) => ({ ...prev, media: patch(prev.media) }))
    // chain onto the queue so writes to the same doc apply in order
    const run = persistQueue.current.then(async () => {
      const id0 = await ensureDraftId()
      const r = await saveDraftSiteAction(formRef.current, id0)
      if (r.success) commitSiteId(r.siteId)
    }).catch((e) => console.error("[handleMediaUploaded persist]", e))
    persistQueue.current = run
    return run
  }, [commitSiteId]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeMedia = useCallback((id: string) => {
    setForm((prev) => {
      const removed = prev.media.find((m) => m.id === id)
      let media = prev.media.filter((m) => m.id !== id)
      if (removed?.type === "image" && removed.isCover) {
        const first = media.find((m) => m.type === "image" && m.status === "ready")
        if (first) media = media.map((m) => m.id === first.id ? { ...m, isCover: true } : m)
      }
      return { ...prev, media }
    })
  }, [])

  const setCover = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, media: prev.media.map((m) => m.type === "image" ? { ...m, isCover: m.id === id } : m) }))
  }, [])

  const updateSchedule = useCallback((day: WeekDay, partial: Partial<DaySchedule>) => {
    setForm((prev) => ({ ...prev, schedule: { ...prev.schedule, [day]: { ...prev.schedule[day], ...partial } } }))
  }, [])

  const validate = useCallback((requireMedia = false): FormErrors => {
    const e: FormErrors = {}
    if (!form.coordinates) e.coordinates = "Selecciona una ubicación en el mapa"
    if (!form.name.trim()) e.name = "El nombre es requerido"
    if (!form.description.trim()) e.description = "La descripción es requerida"
    if (!form.category) e.category = "Selecciona una categoría"
    if (requireMedia && !form.media.some((m) => m.type === "image" && m.isCover && m.status === "ready")) {
      e.media = "Se requiere una imagen de portada"
    }
    return e
  }, [form])

  // Returns existing site/edit ID or creates ONE draft (guarded so concurrent uploads share it)
  const ensureDraftId = useCallback((): Promise<string> => {
    const existing = targetId()
    if (existing) return Promise.resolve(existing)
    if (ensureRef.current) return ensureRef.current
    const p = saveDraftSiteAction(formRef.current).then((result) => {
      if (!result.success) throw new Error(result.error)
      commitSiteId(result.siteId)
      return result.siteId
    }).finally(() => { ensureRef.current = null })
    ensureRef.current = p
    return p
  }, [targetId, commitSiteId])

  const handleSaveDraft = useCallback(async () => {
    setSubmitState("saving")
    // reuse the draft created during upload — never create a second doc
    const result = await saveDraftSiteAction(form, targetId() ?? undefined)
    if (result.success) {
      commitSiteId(result.siteId)
      notify.success("Borrador guardado")
      void fetchSites()
    } else {
      notify.error("No se pudo guardar el borrador", { description: result.error })
    }
    setSubmitState("idle")
  }, [form, fetchSites, targetId, commitSiteId])

  const handlePublish = useCallback(async () => {
    const validation = validate(true)
    if (Object.keys(validation).length) { setErrors(validation); return }
    setSubmitState("publishing")
    // a draft already exists (upload created it) → convert it in place, don't duplicate
    const result = await publishSiteAction(form, targetId() ?? undefined)
    if (!result.success) {
      notify.error("No se pudo publicar", { description: result.error })
      setSubmitState("idle")
      return
    }
    notify.success("¡Sitio enviado para revisión!")
    void fetchSites()
    setSubmitState("done")
  }, [form, validate, fetchSites, targetId])

  const reset = useCallback(() => {
    setForm(createInitialForm())
    setErrors({})
    setSubmitState("idle")
    setAddressAutoDetected(false)
    setEditId(null)
    setSiteId(null)
    editIdRef.current = null
    siteIdRef.current = null
    ensureRef.current = null
  }, [])

  const load = useCallback((site: SiteDetail) => {
    setEditId(site.id)
    editIdRef.current = site.id
    setSiteId(null)
    siteIdRef.current = null
    // usa mediaItems tipados (image/video) + conserva el path para no borrar el archivo optimizado
    const media: MediaFormItem[] = (site.mediaItems ?? []).map((m) => ({
      id: m.id, type: m.type, url: m.url, alt: "",
      isCover: m.isCover, status: "ready" as const, path: m.path,
    }))
    setForm({
      coordinates: site.coordinates,
      address: site.address,
      city: "", citySlug: "", region: "", regionSlug: "", country: "", countrySlug: "",
      name: site.name,
      description: site.description,
      category: site.category,
      media,
      schedule: structuredClone(site.schedule),
    })
    setErrors({})
    setSubmitState("idle")
    setAddressAutoDetected(false)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    const validation = validate(true)
    if (Object.keys(validation).length) { setErrors(validation); return }
    if (!editId) { console.error("[saveEdit] no editId"); return }
    setSubmitState("publishing")
    const result = await updateSiteAction(editId, form)
    if (!result.success) {
      notify.error("No se pudo guardar los cambios", { description: result.error })
      setSubmitState("idle")
      return
    }
    notify.success("¡Cambios guardados!")
    void fetchSites()
    setSubmitState("done")
  }, [form, editId, validate, fetchSites])

  return {
    form, errors, submitState, addressAutoDetected, coverUrl, isMediaProcessing,
    editId,
    clearError, updateField, handlePick, handleAddressChange,
    addMedia, replaceCover, updateMedia, handleMediaUploaded, removeMedia, setCover, updateSchedule,
    ensureDraftId, handleSaveDraft, handlePublish, handleSaveEdit, load, reset,
  }
}
