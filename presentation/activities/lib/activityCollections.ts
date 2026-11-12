import type { ActivityFilters } from "@/domain/entities/activities/filters"

/** Landings de actividades: prefijo `actividades-` en la raíz (como `donde-ir-` y `eventos-`). Textos aprobados por el dueño (docs/34). */
export const ACTIVITY_PREFIX = "actividades-"

export interface ActivityCollectionDef {
  /** Segmento completo de la URL, p. ej. `actividades-gratis-ibague`. */
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  /** Texto propio de la página (2 párrafos). Es lo que la distingue del hub. */
  intro: string[]
  filters: ActivityFilters
}

export const ACTIVITY_COLLECTIONS: ActivityCollectionDef[] = [
  {
    slug: "actividades-hoy-ibague",
    title: "Actividades para hacer hoy en Ibagué",
    metaTitle: "Qué hacer hoy en Ibagué: actividades con horario y precio",
    metaDescription: "Actividades que salen hoy en Ibagué: clubes, caminatas, clases y planes en sitios, ordenadas por la hora en que empiezan.",
    intro: [
      "Aquí están las actividades que todavía no han empezado hoy en Ibagué, ordenadas por hora. No son eventos de una sola fecha: son planes que se repiten, como el club de lectura de los miércoles o el trote de la tarde, así que puedes llegar sin haberlo sabido con semanas de anticipación.",
      "Cada una trae el punto de encuentro, el precio y cuántos cupos quedan. Si prefieres algo único con fecha marcada, mira también los eventos de hoy.",
    ],
    filters: { when: "hoy" },
  },
  {
    slug: "actividades-fin-de-semana-ibague",
    title: "Actividades para el fin de semana en Ibagué",
    metaTitle: "Qué hacer este fin de semana en Ibagué: actividades",
    metaDescription: "Actividades del viernes al domingo en Ibagué: caminatas, mercados, clases y planes en familia, con horario, precio y cupos.",
    intro: [
      "El fin de semana en Ibagué suele repartirse entre salidas al cañón del Combeima, mercados campesinos y planes en los parques. Esta lista reúne lo que se hace de viernes a domingo, con la hora de salida y el valor de cada plan para que decidas rápido.",
      "Algunas actividades tienen cupo limitado y piden reservar con tu cuenta; las que son de entrada libre aparecen marcadas como gratis. Se actualiza sola cada semana.",
    ],
    filters: { when: "este-fin-de-semana" },
  },
  {
    slug: "actividades-gratis-ibague",
    title: "Actividades gratis en Ibagué",
    metaTitle: "Actividades gratis en Ibagué: planes sin pagar entrada",
    metaDescription: "Planes gratis en Ibagué: clubes, trotes, picnics y clases abiertas. Mira horarios, punto de encuentro y cupos.",
    intro: [
      "Hay mucho por hacer en Ibagué sin gastar: trotes en grupo, clubes de lectura, picnics en el parque y clases abiertas. Estas actividades no cobran entrada; si alguna pide una cuota para algo extra, lo dice en su ficha.",
      "Para que sea fácil salir de casa, cada una indica a qué hora empieza, dónde nos vemos y cuántas personas suelen ir. Todo lo que ves aquí lo publicó su organizador y fue revisado antes de salir.",
    ],
    filters: { budget: "gratis" },
  },
  {
    slug: "actividades-al-aire-libre-ibague",
    title: "Actividades al aire libre en Ibagué",
    metaTitle: "Actividades al aire libre en Ibagué: caminatas y aventura",
    metaDescription: "Senderismo, caminatas y planes al aire libre en Ibagué y el Tolima, con guía, punto de encuentro, precio y nivel de dificultad.",
    intro: [
      "Ibagué queda al pie de la cordillera Central: en menos de una hora hay cañones, ríos y páramo. Esta página reúne las salidas organizadas de aire libre, con la dificultad, la duración y lo que incluye cada una (transporte, guía, comida).",
      "Si es tu primera vez, busca las de dificultad fácil y salida desde el centro; las de más exigencia dicen qué llevar y desde qué edad se puede ir.",
    ],
    filters: { category: "aire-libre" },
  },
  {
    slug: "actividades-en-familia-ibague",
    title: "Actividades en familia en Ibagué",
    metaTitle: "Planes en familia en Ibagué: actividades para ir con niños",
    metaDescription: "Actividades para ir en familia en Ibagué: parques, talleres, picnics y paseos pensados para niños, con horario y precio.",
    intro: [
      "Planear con niños pide saber la hora exacta, cuánto cuesta y si hay dónde sentarse. Aquí se juntan las actividades marcadas para ir en familia en Ibagué: picnics, talleres, juegos en el parque y paseos cortos.",
      "Cada ficha indica la edad recomendada y si hay opciones de precio para niños. Guarda las que te interesen y mira la semana completa en tu agenda.",
    ],
    filters: { category: "en-familia" },
  },
  {
    slug: "actividades-deporte-y-bienestar-ibague",
    title: "Deporte y bienestar en Ibagué",
    metaTitle: "Deporte y bienestar en Ibagué: clases y grupos",
    metaDescription: "Trote en grupo, yoga, ciclopaseos y clases de baile en Ibagué: horarios, puntos de encuentro y precios.",
    intro: [
      "Entrenar acompañado es la forma más fácil de no abandonar. En esta lista están los grupos y clases de Ibagué: trote al atardecer, yoga al aire libre, ciclopaseos nocturnos y clases de baile para principiantes.",
      "Casi todas aceptan gente nueva sin experiencia. Mira el horario, el punto de encuentro y, si piden reserva, cuántos cupos quedan.",
    ],
    filters: { category: "deporte-y-bienestar" },
  },
]

export const getActivityCollectionBySlug = (slug: string): ActivityCollectionDef | null => ACTIVITY_COLLECTIONS.find((c) => c.slug === slug) ?? null
