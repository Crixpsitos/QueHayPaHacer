import type {
  StudioEventListItem,
  EventStatsViewModel,
  EventRegistrationsViewModel,
  RegistrationRow,
  TeamMemberVM,
} from "../view-models/StudioEventsViewModel";

// MOCK — equipo del evento (dueño + colaboradores)
const MOCK_EVENT_TEAM: TeamMemberVM[] = [
  {
    uid: "owner-me",
    displayName: "Mi Organización",
    brandName: "Mi Organización Cultural",
    photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Mi%20Organizacion",
    professionalType: "organizer",
    role: "owner",
  },
  {
    uid: "collab-1",
    displayName: "Eventos Andinos",
    brandName: "Eventos Andinos S.A.S",
    photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Eventos%20Andinos",
    professionalType: "organizer",
    role: "collaborator",
  },
  {
    uid: "collab-2",
    displayName: "Café de la Plaza",
    brandName: "Café de la Plaza",
    photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Cafe%20Plaza",
    professionalType: "business",
    role: "collaborator",
  },
];

/**
 * Proveedores de datos MOCK para la sección "Mis eventos".
 * Reemplazar por llamadas a `studioService` cuando el repositorio esté listo.
 * Incluye un evento de cada `registrationType` para demostrar las 4 vistas.
 */

// MOCK — lista de eventos del organizador
export const MOCK_STUDIO_EVENTS: StudioEventListItem[] = [
  {
    id: "evt-internal",
    name: "Noche de Salsa",
    date: "2026-07-12T20:00:00.000Z",
    status: "published",
    image: "https://picsum.photos/seed/salsa/200/200",
    views: 4200,
    registrations: 320,
    registrationType: "internal",
  },
  {
    id: "evt-form",
    name: "Feria Gastronómica",
    date: "2026-07-19T15:00:00.000Z",
    status: "published",
    image: "https://picsum.photos/seed/feria/200/200",
    views: 3800,
    registrations: 410,
    registrationType: "form",
  },
  {
    id: "evt-external",
    name: "Concierto Andino",
    date: "2026-08-02T19:00:00.000Z",
    status: "published",
    image: "https://picsum.photos/seed/concierto/200/200",
    views: 5100,
    registrations: 280,
    registrationType: "external",
  },
  {
    id: "evt-none",
    name: "Mercado Artesanal",
    date: "2026-06-28T09:00:00.000Z",
    status: "published",
    image: "https://picsum.photos/seed/mercado/200/200",
    views: 2600,
    registrations: 0,
    registrationType: "none",
  },
  {
    id: "evt-draft",
    name: "Ruta del Café (borrador)",
    date: "2026-09-05T08:00:00.000Z",
    status: "draft",
    image: "https://picsum.photos/seed/cafe/200/200",
    views: 0,
    registrations: 0,
    registrationType: "internal",
  },
];

const FIRST_NAMES = ["Laura", "Carlos", "Daniela", "Andrés", "Valentina", "Sebastián", "Camila", "Mateo", "Sofía", "Juan"];
const LAST_NAMES = ["Gómez", "Rodríguez", "Martínez", "López", "Ramírez", "Torres", "Vargas", "Castro"];

const buildRows = (count: number, withForm: boolean): RegistrationRow[] =>
  Array.from({ length: count }, (_, i) => {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
    const day = 10 + (i % 18);
    // Simulamos que las pares son cuentas profesionales (con "@handle" + chulito).
    const isProfessional = i % 2 === 0;
    return {
      userId: `user-${i + 1}`,
      name,
      handle: isProfessional ? name.toLowerCase().replace(/\s+/g, "") : undefined,
      verified: isProfessional,
      // MOCK — avatar de demostración. En real vendrá del perfil del usuario.
      photoURL: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name + i)}`,
      registeredAt: `2026-06-${String(day).padStart(2, "0")}T${String(9 + (i % 12)).padStart(2, "0")}:30:00.000Z`,
      attendanceConfirmed: i % 3 === 0,
      formResponses: withForm
        ? [
            { label: "¿Cómo te enteraste?", value: ["Instagram", "Un amigo", "Facebook", "Cartelera"][i % 4] },
            { label: "Restricciones alimentarias", value: ["Ninguna", "Vegetariano", "Sin gluten", "Vegano"][i % 4] },
            { label: "Número de acompañantes", value: String(i % 4) },
          ]
        : undefined,
    };
  });

const registrationRamp = (() => {
  const totalDays = 14;
  let cumulative = 0;
  return Array.from({ length: totalDays + 1 }, (_, i) => {
    const unitsBeforeEvent = totalDays - i;
    const dailyShare = unitsBeforeEvent <= 2 ? 0.22 : unitsBeforeEvent <= 6 ? 0.08 : 0.03;
    cumulative += Math.round(320 * dailyShare);
    return { unitsBeforeEvent, cumulativeRegistrations: Math.min(cumulative, 320) };
  });
})();

// MOCK — estadísticas por evento (SLOT A)
export function getMockEventStats(eventId: string): EventStatsViewModel | null {
  const event = MOCK_STUDIO_EVENTS.find((e) => e.id === eventId);
  if (!event) return null;
  return {
    eventId: event.id,
    name: event.name,
    status: event.status,
    date: event.date,
    registrationType: event.registrationType,
    views: event.views,
    registrations: event.registrations,
    clicks: Math.round(event.views * 0.12),
    likes: Math.round(event.views * 0.23),
    shares: Math.round(event.views * 0.05),
    score: Math.min(99, 50 + Math.round(event.views / 120)),
    rampUnit: "day",
    registrationRamp,
    // El "Mercado Artesanal" no tiene colaboradores (solo dueño) para variar.
    team: event.id === "evt-none" ? [MOCK_EVENT_TEAM[0]] : MOCK_EVENT_TEAM,
  };
}

// MOCK — registros por evento (SLOT B), según registrationType
export function getMockEventRegistrations(eventId: string): EventRegistrationsViewModel | null {
  const event = MOCK_STUDIO_EVENTS.find((e) => e.id === eventId);
  if (!event) return null;

  switch (event.registrationType) {
    case "internal":
      return { eventId, registrationType: "internal", rows: buildRows(24, false), requiresAttendance: true, nextCursor: null, prevCursor: null };
    case "form":
      return { eventId, registrationType: "form", rows: buildRows(18, true), requiresAttendance: false, nextCursor: null, prevCursor: null };
    case "external":
      return {
        eventId,
        registrationType: "external",
        rows: [],
        externalClicks: 642,
        externalUrl: "https://tuboleta.com/evento-ejemplo",
        requiresAttendance: false,
        nextCursor: null,
        prevCursor: null,
      };
    case "none":
    default:
      return { eventId, registrationType: "none", rows: [], requiresAttendance: false, nextCursor: null, prevCursor: null };
  }
}
