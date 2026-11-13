/** Clases compartidas de los formularios de la carta (misma identidad que el resto: vinotinto, dorado, blanco). */
export const field = "min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-primary-dark focus-visible:ring-2 focus-visible:ring-primary-dark/20"
export const label = "grid gap-1.5 text-sm font-semibold text-foreground"
export const hint = "text-xs font-normal text-muted-foreground"
export const primaryBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-4px_rgba(230,57,70,.35)] outline-none focus-visible:ring-3 focus-visible:ring-primary-dark/40 disabled:opacity-50"
export const outlineBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary-dark bg-white px-5 text-sm font-semibold text-primary-dark outline-none hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-primary-dark/30 disabled:opacity-50"
export const chip = (on: boolean) => `inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-primary-dark/30 ${on ? "border-transparent bg-primary-dark text-white" : "border-gray-300 bg-white text-foreground hover:bg-muted"}`
