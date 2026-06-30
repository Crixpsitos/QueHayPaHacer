import type { StudioCollaboratorsViewModel } from "../view-models/StudioCollaboratorsViewModel";

/**
 * Datos MOCK para la sección "Colaboradores".
 * Reemplazar por studioService.getCollaborators / getReceivedInvitations.
 */
export const MOCK_STUDIO_COLLABORATORS: StudioCollaboratorsViewModel = {
  myEntityName: "Mi Organización Cultural",
  collaborators: [
    {
      uid: "collab-1",
      displayName: "Eventos Andinos",
      brandName: "Eventos Andinos S.A.S",
      photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Eventos%20Andinos",
      professionalType: "organizer",
    },
    {
      uid: "collab-2",
      displayName: "Café de la Plaza",
      brandName: "Café de la Plaza",
      photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Cafe%20Plaza",
      professionalType: "business",
    },
    {
      uid: "collab-3",
      displayName: "Alcaldía de Ibagué",
      brandName: "Secretaría de Cultura",
      photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Alcaldia%20Ibague",
      professionalType: "government",
    },
  ],
  entities: [
    {
      uid: "entity-1",
      displayName: "Festival Ibagué Vive",
      brandName: "Corporación Ibagué Vive",
      photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Ibague%20Vive",
      professionalType: "organizer",
    },
    {
      uid: "entity-2",
      displayName: "Teatro Tolima",
      brandName: "Teatro Tolima",
      photoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Teatro%20Tolima",
      professionalType: "business",
    },
  ],
  invitations: [
    {
      id: "inv-1",
      fromDisplayName: "Bar La Terraza",
      fromBrandName: "Bar La Terraza",
      fromPhotoURL: "https://api.dicebear.com/9.x/initials/svg?seed=La%20Terraza",
      professionalType: "business",
      invitedAt: "2026-06-20T14:00:00.000Z",
    },
    {
      id: "inv-2",
      fromDisplayName: "Productora Sonido Vivo",
      fromBrandName: "Sonido Vivo",
      fromPhotoURL: "https://api.dicebear.com/9.x/initials/svg?seed=Sonido%20Vivo",
      professionalType: "organizer",
      invitedAt: "2026-06-22T09:30:00.000Z",
    },
  ],
};
