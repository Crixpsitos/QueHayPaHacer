"use client"

import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, MapPin, Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"

interface PanelHeaderProps {
  panelMode: "list" | "form"
  formMode?: "create" | "edit"
  onCreate: () => void
  onBack: () => void
}

export function PanelHeader({ panelMode, formMode, onCreate, onBack }: PanelHeaderProps) {
  const isForm = panelMode === "form"

  return (
    <header className="shrink-0 border-b border-border px-5 py-4">
      <AnimatePresence mode="wait" initial={false}>
        {isForm ? (
          <motion.div
            key="form-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              onClick={onBack}
              className="-ml-1 mb-2 flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Volver
            </button>
            <p className="text-base font-semibold text-foreground">
              {formMode === "edit" ? "Editar sitio" : "Agregar nuevo sitio"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {formMode === "edit"
                ? "Modifica la información y guarda los cambios."
                : "Completa los campos. Puedes guardar como borrador en cualquier momento."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FDF2F4]">
                  <MapPin className="size-4 text-[#E63946]" aria-hidden />
                </div>
                <h1
                  className="text-lg font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Mis sitios
                </h1>
              </div>
              <p className="mt-0.5 pl-9 text-xs text-muted-foreground">Gestiona tus puntos de interés en Ibagué.</p>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5 bg-[#E63946] text-white shadow-primary-glow hover:bg-[#9B0A26]" onClick={onCreate}>
              <Plus className="size-4" aria-hidden />
              Nuevo sitio
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
