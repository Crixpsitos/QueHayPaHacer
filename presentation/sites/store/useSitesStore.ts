"use client"

import { create } from "zustand"
import { getMySitesAction } from "@/app/actions/sites/get-my-sites.action"
import { deleteSiteAction } from "@/app/actions/sites/delete-site.action"
import { setSiteActiveAction } from "@/app/actions/sites/set-site-active.action"
import { notify } from "@/presentation/shared/lib/notify"
import type { SiteDetail } from "../view-models/SiteFormViewModel"

interface SitesStore {
  sites: SiteDetail[]
  loading: boolean
  fetchSites: () => Promise<void>
  deleteSite: (id: string) => Promise<void>
  setActive: (id: string, active: boolean) => Promise<void>
}

export const useSitesStore = create<SitesStore>((set, get) => ({
  sites: [],
  loading: false,
  fetchSites: async () => {
    set({ loading: true })
    try {
      const data = await getMySitesAction()
      set({ sites: data })
    } catch (e) {
      console.error("[SitesStore] fetchSites", e)
    } finally {
      set({ loading: false })
    }
  },
  deleteSite: async (id) => {
    const prev = get().sites
    set({ sites: prev.filter((s) => s.id !== id) }) // optimistic
    const r = await deleteSiteAction(id)
    if (!r.success) {
      set({ sites: prev }) // rollback
      notify.error("No se pudo eliminar", { description: r.error })
      return
    }
    notify.success("Sitio eliminado")
  },
  setActive: async (id, active) => {
    const prev = get().sites
    set({ sites: prev.map((s) => s.id === id ? { ...s, isActive: active } : s) }) // optimistic
    const r = await setSiteActiveAction(id, active)
    if (!r.success) {
      set({ sites: prev }) // rollback
      notify.error("No se pudo cambiar la visibilidad", { description: r.error })
      return
    }
    notify.success(active ? "Sitio activado" : "Sitio desactivado")
  },
}))
