/** Resolución de portadas (evento y sesiones): una sola fuente para validar y para los textos. */
export const MIN_IMAGE = { width: 1280, height: 720 } as const
export const RECOMMENDED_IMAGE = { width: 1920, height: 1080 } as const

export const meetsMinResolution = (width: number, height: number) =>
  width >= MIN_IMAGE.width && height >= MIN_IMAGE.height

export const minResolutionText = () => `${MIN_IMAGE.width}×${MIN_IMAGE.height} px`
