"use client"

import dynamic from "next/dynamic"

/** MapLibre pesa: se carga solo en el navegador y después del primer pintado. */
export const PlaceMapLazy = dynamic(() => import("./PlaceMap"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-muted" aria-hidden /> })
