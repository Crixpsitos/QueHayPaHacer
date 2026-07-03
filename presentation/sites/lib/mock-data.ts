// ponytail: mock temporal — reemplazar con query Firebase cuando el repo esté listo
import type { SiteDetail } from "../view-models/SiteFormViewModel"
import { DEFAULT_SCHEDULE } from "./constants"

// Unsplash placeholders — reemplazar con URLs reales de Storage
const M = {
  cafe:     ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=70", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=70", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=70"],
  view:     ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70", "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70"],
  cultural: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=70"],
  hostel:   [] as string[],
  rest:     ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=70", "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&q=70"],
  park:     ["https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=70", "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=400&q=70"],
}

const ME = { id: "user-1", displayName: "Cristian P.", photoURL: undefined }

export const MOCK_SITES: SiteDetail[] = [
  {
    id: "1", name: "Café Berlín", category: "cafe", isActive: true,
    address: "Calle 60 #5-32, Centro, Ibagué", coverUrl: M.cafe[0],
    coordinates: { latitude: 4.4389, longitude: -75.2322 },
    publicationStatus: "published", moderationStatus: "approved", rejectionReason: null,
    analytics: { clicks: 312, likes: 48, shares: 12, eventCount: 4 }, updatedAt: "2026-06-28T10:00:00Z",
    description: "Café de especialidad con ambiente berlinés en el corazón de Ibagué. Granos de origen colombiano, preparaciones de filtro y espresso de alta calidad.",
    views: 890, schedule: structuredClone(DEFAULT_SCHEDULE), author: ME, mediaUrls: M.cafe,
  },
  {
    id: "2", name: "Mirador Combeima", category: "viewpoint", isActive: false,
    address: "Cañón del Combeima, Ibagué", coverUrl: M.view[0],
    coordinates: { latitude: 4.4605, longitude: -75.2804 },
    publicationStatus: "published", moderationStatus: "pending", rejectionReason: null,
    analytics: { clicks: 87, likes: 9, shares: 3, eventCount: 1 }, updatedAt: "2026-06-29T14:00:00Z",
    description: "Vista panorámica del cañón del Combeima. Ideal para senderismo y fotografía de paisaje.",
    views: 210, schedule: structuredClone(DEFAULT_SCHEDULE), author: ME, mediaUrls: M.view,
  },
  {
    id: "3", name: "Teatro Tolima", category: "cultural", isActive: false,
    address: "Carrera 3 #10-35, Centro, Ibagué", coverUrl: M.cultural[0],
    coordinates: { latitude: 4.4360, longitude: -75.2310 },
    publicationStatus: "published", moderationStatus: "rejected",
    rejectionReason: "Las imágenes del sitio no cumplen los requisitos de calidad mínimos.",
    analytics: { clicks: 54, likes: 5, shares: 1, eventCount: 0 }, updatedAt: "2026-06-27T09:00:00Z",
    description: "Teatro histórico de la ciudad, sede de óperas, conciertos y obras de teatro desde 1886.",
    views: 130, schedule: { ...structuredClone(DEFAULT_SCHEDULE), sunday: { open: "09:00", close: "12:00", closed: false } }, author: ME, mediaUrls: M.cultural,
  },
  {
    id: "4", name: "Hostal Musical", category: "hostel", isActive: false,
    address: "Calle 37 #2-15, Ibagué", coverUrl: "",
    coordinates: { latitude: 4.4420, longitude: -75.2270 },
    publicationStatus: "draft", moderationStatus: "pending", rejectionReason: null,
    analytics: { clicks: 0, likes: 0, shares: 0, eventCount: 0 }, updatedAt: "2026-06-30T08:00:00Z",
    description: "Hostal temático musical en la ciudad musical de Colombia. Habitaciones privadas y dormitorios.",
    views: 0, schedule: structuredClone(DEFAULT_SCHEDULE), author: ME, mediaUrls: M.hostel,
  },
  {
    id: "5", name: "Restaurante Andino", category: "restaurant", isActive: false,
    address: "Carrera 5 #22-10, Ibagué", coverUrl: M.rest[0],
    coordinates: { latitude: 4.4350, longitude: -75.2350 },
    publicationStatus: "published", moderationStatus: "approved", rejectionReason: null,
    analytics: { clicks: 201, likes: 33, shares: 7, eventCount: 8 }, updatedAt: "2026-06-25T12:00:00Z",
    description: "Cocina tradicional tolimense: lechona, tamal y viudo de pescado. Ambiente familiar.",
    views: 540, schedule: structuredClone(DEFAULT_SCHEDULE), author: ME, mediaUrls: M.rest,
  },
  {
    id: "6", name: "Parque Centenario", category: "park", isActive: true,
    address: "Calle 40 con Carrera 3, Ibagué", coverUrl: M.park[0],
    coordinates: { latitude: 4.4400, longitude: -75.2295 },
    publicationStatus: "published", moderationStatus: "approved", rejectionReason: null,
    analytics: { clicks: 445, likes: 91, shares: 24, eventCount: 12 }, updatedAt: "2026-06-20T16:00:00Z",
    description: "Parque central de Ibagué con zona verde, fuentes y área de descanso. Punto de encuentro ciudadano.",
    views: 1200, schedule: { ...structuredClone(DEFAULT_SCHEDULE), sunday: { open: "06:00", close: "22:00", closed: false } }, author: ME, mediaUrls: M.park,
  },
]
