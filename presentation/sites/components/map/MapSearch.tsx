"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Search, X } from "lucide-react"
import { forwardGeocode } from "../../lib/geocoding"
import type { GeocodingResult } from "../../view-models/SiteFormViewModel"
import { cn } from "@/app/lib/utils/cn"

interface MapSearchProps {
  onSelect: (result: GeocodingResult) => void
  embedded?: boolean
}

interface DropdownRect { top: number; left: number; width: number }

export function MapSearch({ onSelect, embedded = false }: MapSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const skipSearch = useRef(false)

  const search = useCallback((q: string) => {
    if (skipSearch.current) { skipSearch.current = false; return }
    if (debounce.current) clearTimeout(debounce.current)
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      const res = await forwardGeocode(q)
      setResults(res)
      if (res.length > 0 && embedded && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownRect({ top: rect.bottom + 6, left: rect.left, width: rect.width })
      }
      setOpen(res.length > 0)
      setLoading(false)
    }, 350)
  }, [embedded])

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { search(query) }, [query, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (r: GeocodingResult) => {
    skipSearch.current = true
    setQuery(r.label)
    setOpen(false)
    setResults([])
    onSelect(r)
  }

  const dropdown = (
    <ul
      role="listbox"
      className="overflow-hidden rounded-xl border border-border bg-background shadow-lg"
      style={
        embedded && dropdownRect
          ? { position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }
          : { position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0 }
      }
    >
      {results.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            role="option"
            aria-selected={false}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
            className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-muted"
          >
            <span className="text-sm font-medium text-foreground">{r.label}</span>
            {r.address && <span className="text-xs text-muted-foreground">{r.address}</span>}
          </button>
        </li>
      ))}
    </ul>
  )

  const loadingEl = (
    <p
      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-muted-foreground shadow-lg"
      style={
        embedded && dropdownRect
          ? { position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }
          : { position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0 }
      }
    >
      Buscando...
    </p>
  )

  return (
    <div ref={containerRef} className={cn("pointer-events-auto relative w-full", embedded ? "h-full" : "max-w-sm")}>
      <div className={cn("relative", embedded && "h-full")}>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una dirección..."
          aria-label="Buscar dirección"
          className={cn(
            "w-full pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground",
            embedded
              ? "h-full bg-transparent"
              : "h-10 rounded-full border border-border bg-background/95 shadow-md backdrop-blur focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false) }}
            aria-label="Limpiar"
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (embedded
        ? createPortal(dropdown, document.body)
        : <div className="relative">{dropdown}</div>
      )}

      {loading && !open && (embedded
        ? createPortal(loadingEl, document.body)
        : <div className="relative">{loadingEl}</div>
      )}
    </div>
  )
}
