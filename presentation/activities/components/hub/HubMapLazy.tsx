"use client"

import dynamic from "next/dynamic"

export const HubMapLazy = dynamic(() => import("./HubMap").then((m) => m.HubMap), { ssr: false, loading: () => <div className="h-[30rem] animate-pulse rounded-[2rem] bg-muted" aria-hidden /> })
