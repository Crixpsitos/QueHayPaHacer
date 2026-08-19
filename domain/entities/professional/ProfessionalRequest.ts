export type ProfessionalType = "organizer" | "business" | "government";

export type ProfessionalRequestStatus = "pending" | "approved" | "rejected";

export interface OrganizerDetails {
  organizerType: "natural_person" | "organization";
  organizationName: string | null;
  nit: string | null;
  eventCategories: string[];
}

export type BusinessCategory =
  | "bar"
  | "cafe"
  | "restaurante"
  | "discoteca"
  | "hotel"
  | "teatro_cine"
  | "museo_galeria"
  | "parque_tematico"
  | "gimnasio"
  | "spa_bienestar"
  | "salon_eventos"
  | "tienda"
  | "otro";

export interface BusinessDetails {
  businessCategory: BusinessCategory;
  businessDescription: string | null;
  mapsLink: string | null;
  socialLink: string | null;
  /** NIT del negocio */
  nit: string | null;
  /** Coordenadas extraídas automáticamente del mapsLink al enviar la solicitud. */
  locationLat: number | null;
  locationLng: number | null;
  /** Teléfono comercial/público del negocio — independiente de User.phoneNumber. */
  businessPhone?: string | null;
}

export interface GovernmentDetails {
  entityName: string;
  department: string;
  institutionalEmail: string;
  /** Teléfono oficial de la entidad — independiente de User.phoneNumber. */
  institutionalPhone: string;
  mapsLink: string | null;
  /** NIT de la entidad — solo para verificación/identificación. */
  nit?: string | null;
}

export type ProfessionalRequestDetails = OrganizerDetails | BusinessDetails | GovernmentDetails;

export interface ProfessionalRequest {
  id: string;
  uid: string;
  status: ProfessionalRequestStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  professionalType: ProfessionalType;
  brandName: string;
  description: string;
  phone: string;
  website: string | null;
  previousRequestId: string | null;
  reapplyReason: string | null;
  details: ProfessionalRequestDetails;
}
