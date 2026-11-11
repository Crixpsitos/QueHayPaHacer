
import { UserAdapter } from "@/infraestructure/adapters/user/UserAdapter";
import { UserFirebaseRepository } from "@/infraestructure/firebase/repositories/user/UserFirebaseRepository";
import { CampaignFirebaseRepository } from "@/infraestructure/firebase/repositories/campaign/CampaignFirebaseRepository";
import { CampaignAdapter } from "@/infraestructure/adapters/campaign/CampaignAdapter";
import { UserService } from "@/application/services/user/UserService";
import { CampaignService } from "@/application/services/campaign/CampaignService";

import { getFirebaseFirestore, getEnterpriseFirestore } from "../firebase/config/admin/firebase";
import { CampaignFirebaseMapper } from "../firebase/mappers/campaing/CampaignFirebaseMapper";
import { UserFirebaseMapper } from "../firebase/mappers/user/UserFirebaseMapper";
import { CategoriesFirebaseRepository } from "../firebase/repositories/categories/CategoriesFirebaseRepository";
import { CategoriesAdapter } from "../adapters/categories/CategoriesAdapter";
import { CategoriesFirebaseMapper } from "../firebase/mappers/categories/CategoriesFirebaseMapper";
import { CategoriesService } from "@/application/services/categories/CategoriesService";
import { EventsFirebaseRepository } from "../firebase/repositories/events/EventsFirebaseRepository";
import { EventsAdapter } from "../adapters/events/EventsAdapter";
import { EventsFirebaseMapper } from "../firebase/mappers/events/EventsFirebaseMapper";
import { EventsService } from "@/application/services/events/EventsService";
import { EventInteractionsFirebaseRepository } from "../firebase/repositories/EventInteraction/EventInteractionsFirebaseRepository";
import { EventInteractionsAdapter } from "../adapters/EventInteraction/EventInteractionsAdapter";
import { EventInteractionsFirebaseMapper } from "../firebase/mappers/EventInteraction/EventInteractionsFirebaseMapper";
import { EventInteractionsService } from "@/application/services/events/EventInteractionsService";
import { UserEventInteractionsProjectionFirebaseRepository } from "../firebase/repositories/EventInteraction/UserEventInteractionsProjectionFirebaseRepository";
import { EventRegistrationFirebaseRepository } from "../firebase/repositories/EventRegistration/EventRegistrationFirebaseRepository";
import { EventRegistrationAdapter } from "../adapters/EventRegistration/EventRegistrationAdapter";
import { EventRegistrationFirebaseMapper } from "../firebase/mappers/EventRegistration/EventRegistrationFirebaseMapper";
import { EventRegistrationService } from "@/application/services/events/EventRegistrationService";
import { EventFeed } from "@/application/aggregations/EventFeed/EventFeed";
import { UserPreferencesAdapter } from "../adapters/UserPreferences/UserPreferencesAdapter";
import { UserPreferencesService } from "@/application/services/user/UserPreferencesService";
import { StorageService } from "../storage/firebase/FirebaseStorageService";
import { UserPreferencesFirebaseRepository } from "../firebase/repositories/UserPreferences/UserPreferencesFirebaseRepository";
import { UserPreferencesFirebaseMapper } from "../firebase/mappers/UserPreferences/UserPreferencesFirebaseMapper";
import { ProfileFirebaseRepository } from "../firebase/repositories/profile/ProfileFirebaseRepository";
import { ProfileAdapter } from "../adapters/profile/ProfileAdapter";
import { ProfileFirebaseMapper } from "../firebase/mappers/profile/ProfileFirebaseMapper";
import { ProfileService } from "@/application/services/profile/ProfileService";
import { BadgeFirebaseRepository } from "../firebase/repositories/user/BadgeFirebaseRepository";
import { BadgeAdapter } from "../adapters/user/BadgeAdapter";
import { BadgeFirebaseMapper } from "../firebase/mappers/user/BadgeFirebaseMapper";
import { BadgeService } from "@/application/services/user/BadgeService";
import { StudioFirebaseRepository } from "../firebase/repositories/studio/StudioFirebaseRepository";
import { StudioAdapter } from "../adapters/studio/StudioAdapter";
import { StudioFirebaseMapper } from "../firebase/mappers/studio/StudioFirebaseMapper";
import { StudioService } from "@/application/services/studio/StudioService";
import { SitesFirebaseRepository } from "../firebase/repositories/sites/SitesFirebaseRepository";
import { SitesAdapter } from "../adapters/sites/SitesAdapter";
import { SiteFirebaseMapper } from "../firebase/mappers/sites/SiteFirebaseMapper";
import { SitesService } from "@/application/services/sites/SitesService";
import { ActivityService } from "@/application/services/activities/ActivityService";
import { HostIdentityService } from "@/application/services/activities/HostIdentityService";
import { ActivityPublishService } from "@/application/services/activities/ActivityPublishService";
import { ActivityJoinService } from "@/application/services/activities/ActivityJoinService";
import { ActivityJoinFirebaseRepository } from "../firebase/repositories/activities/ActivityJoinFirebaseRepository";
import { LEGAL_VERSION } from "@/app/lib/legal/version";
import { ActivityEngagementService } from "@/application/services/activities/ActivityEngagementService";
import { ActivityEngagementFirebaseRepository } from "../firebase/repositories/activities/ActivityEngagementFirebaseRepository";
import { ActivityAccountFirebaseRepository } from "../firebase/repositories/activities/ActivityAccountFirebaseRepository";
import { HostIdentityFirebaseRepository } from "../firebase/repositories/activities/HostIdentityFirebaseRepository";
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit";
import { ActivityFirebaseRepository } from "../firebase/repositories/activities/ActivityFirebaseRepository";
import { DailyStatsFirebaseRepository } from "@/infraestructure/firebase/repositories/analytics/DailyStatsFirebaseRepository";
import { LinksService } from "@/application/services/links/LinksService";
import { LinksFirebaseRepository } from "@/infraestructure/firebase/repositories/links/LinksFirebaseRepository";
import { EventSessionFirebaseRepository } from "../firebase/repositories/events/EventSessionFirebaseRepository";
import { EventSessionAdapter } from "../adapters/events/EventSessionAdapter";
import { EventSessionFirebaseMapper } from "../firebase/mappers/events/EventSessionFirebaseMapper";
import { EventSessionService } from "@/application/services/events/EventSessionService";
import { ContactFirebaseRepository } from "../firebase/repositories/contact/ContactFirebaseRepository";
import { ContactAdapter } from "../adapters/contact/ContactAdapter";
import { ContactFirebaseMapper } from "../firebase/mappers/contact/ContactFirebaseMapper";
import { ContactService } from "@/application/services/contact/ContactService";
import { SiteInteractionFirebaseRepository } from "../firebase/repositories/SiteInteraction/SiteInteractionFirebaseRepository";
import { SiteInteractionAdapter } from "../adapters/SiteInteraction/SiteInteractionAdapter";
import { SiteInteractionFirebaseMapper } from "../firebase/mappers/SiteInteraction/SiteInteractionFirebaseMapper";
import { ReportFirebaseRepository } from "../firebase/repositories/report/ReportFirebaseRepository";
import { ReportService } from "@/application/services/report/ReportService";
import { ContentDeclarationFirebaseRepository } from "../firebase/repositories/contentDeclaration/ContentDeclarationFirebaseRepository";
import { SiteClaimFirebaseRepository } from "../firebase/repositories/siteClaim/SiteClaimFirebaseRepository";
import { SiteClaimService } from "@/application/services/siteClaim/SiteClaimService";
import { SiteSuggestionFirebaseRepository } from "../firebase/repositories/siteSuggestion/SiteSuggestionFirebaseRepository";
import { SiteSuggestionService } from "@/application/services/siteSuggestion/SiteSuggestionService";
import { NotificationFirebaseRepository } from "../firebase/repositories/notification/NotificationFirebaseRepository";
import { NotificationService } from "@/application/services/notification/NotificationService";
import { ConfigFirebaseRepository } from "../firebase/repositories/config/ConfigFirebaseRepository";
import { TransitRouteService } from "@/application/services/config/TransitRouteService";
import { SiteTransitService } from "@/application/services/sites/SiteTransitService";
import { SiteTransitReportFirebaseRepository } from "../firebase/repositories/siteTransit/SiteTransitReportFirebaseRepository";
import { HolidayService } from "@/application/services/config/HolidayService";
import { ContentDeclarationService } from "@/application/services/contentDeclaration/ContentDeclarationService";
import { SiteInteractionService } from "@/application/services/sites/SiteInteractionService";


/** Consultas de datos de oferentes para quejas: 5 por minuto por persona, en memoria de la instancia. */
const complaintLimiter = createIpLimiter(5);

export const createServerContainer = () => {

  //storage service
  const storageService = new StorageService();
  
  const userFirebaseRepository = new UserFirebaseRepository(getFirebaseFirestore());
  const userRepository = new UserAdapter(userFirebaseRepository, new UserFirebaseMapper());
  const userService = new UserService(userRepository);

  const campaignFirebaseRepository = new CampaignFirebaseRepository(getFirebaseFirestore());
  const campaignRepository = new CampaignAdapter(campaignFirebaseRepository, new CampaignFirebaseMapper());
  const campaignService = new CampaignService(campaignRepository);

  // categories
  const categoriesFirebaseRepository = new CategoriesFirebaseRepository(getFirebaseFirestore());
  const categoriesRepository = new CategoriesAdapter(categoriesFirebaseRepository, new CategoriesFirebaseMapper());
  const categoriesService = new CategoriesService(categoriesRepository);

  // events
  const eventsFirebaseRepository = new EventsFirebaseRepository(getFirebaseFirestore());
  const eventsRepository = new EventsAdapter(eventsFirebaseRepository, new EventsFirebaseMapper());
  const eventsService = new EventsService(eventsRepository, storageService);

  // event sessions (solo para eventos multi-date)
  const eventSessionFirebaseRepository = new EventSessionFirebaseRepository(getFirebaseFirestore());
  const eventSessionRepository = new EventSessionAdapter(
    eventSessionFirebaseRepository,
    new EventSessionFirebaseMapper(),
  );
  const eventSessionService = new EventSessionService(eventSessionRepository);

  // event interactions
  const eventInteractionsFirebaseRepository = new EventInteractionsFirebaseRepository(getFirebaseFirestore());
  const eventInteractionsRepository = new EventInteractionsAdapter(
    eventInteractionsFirebaseRepository,
    new EventInteractionsFirebaseMapper(),
  );
  const userEventInteractionsProjectionRepository =
    new UserEventInteractionsProjectionFirebaseRepository(getFirebaseFirestore());
  const eventInteractionsService = new EventInteractionsService(
    eventInteractionsRepository,
    userEventInteractionsProjectionRepository,
    eventsRepository,
    eventSessionRepository,
  );

  // event registrations
  const eventRegistrationFirebaseRepository = new EventRegistrationFirebaseRepository(getFirebaseFirestore());
  const eventRegistrationRepository = new EventRegistrationAdapter(
    eventRegistrationFirebaseRepository,
    new EventRegistrationFirebaseMapper(),
  );
  const eventRegistrationService = new EventRegistrationService(eventRegistrationRepository);

  const eventFeed = new EventFeed(
    eventsService,
    eventInteractionsService,
  );

  // user preferences
  const userPreferencesFirebaseRepository = new UserPreferencesFirebaseRepository(getFirebaseFirestore());
  const userPreferencesRepository = new UserPreferencesAdapter(userPreferencesFirebaseRepository, new UserPreferencesFirebaseMapper());
  const userPreferencesService = new UserPreferencesService(userPreferencesRepository);

  // profile
  const profileFirebaseRepository = new ProfileFirebaseRepository(getFirebaseFirestore(), getEnterpriseFirestore());
  const profileRepository = new ProfileAdapter(profileFirebaseRepository, new ProfileFirebaseMapper());
  const profileService = new ProfileService(profileRepository);

  // badges
  const badgeFirebaseRepository = new BadgeFirebaseRepository(getFirebaseFirestore());
  const badgeRepository = new BadgeAdapter(badgeFirebaseRepository, new BadgeFirebaseMapper());
  const badgeService = new BadgeService(badgeRepository);

  // sites
  const sitesFirebaseRepository = new SitesFirebaseRepository(getFirebaseFirestore());
  const sitesAdapter = new SitesAdapter(sitesFirebaseRepository, new SiteFirebaseMapper());
  const sitesService = new SitesService(sitesAdapter);

  // actividades (el estado del sitio vinculado decide la visibilidad de las actividades de sitio)
  const activityService = new ActivityService(new ActivityFirebaseRepository(getFirebaseFirestore()), async (siteId) => {
    const s = await sitesService.getActivityLinkSnapshot(siteId);
    return s ? { published: s.published, active: s.active } : null;
  });

  // registro de oferentes (Ley 1480 art. 53); el límite vive a nivel de módulo (createServerContainer se ejecuta en cada llamada)
  const hostIdentityService = new HostIdentityService(new HostIdentityFirebaseRepository(getFirebaseFirestore()), () => new Date(), complaintLimiter);

  // estadísticas diarias por ficha (solo lectura)
  const dailyStatsRepository = new DailyStatsFirebaseRepository(getFirebaseFirestore());

  // enlaces de campaña (/r/<código>)
  const linksService = new LinksService(new LinksFirebaseRepository(getFirebaseFirestore()));

  // studio (Estudio del Organizador)
  const studioFirebaseRepository = new StudioFirebaseRepository(getEnterpriseFirestore());
  const studioRepository = new StudioAdapter(studioFirebaseRepository, new StudioFirebaseMapper());
  const studioService = new StudioService(studioRepository);

  // site interactions
  const siteInteractionFirebaseRepository = new SiteInteractionFirebaseRepository(getFirebaseFirestore());
  const siteInteractionAdapter = new SiteInteractionAdapter(
    siteInteractionFirebaseRepository,
    new SiteInteractionFirebaseMapper(),
  );
  const siteInteractionService = new SiteInteractionService(siteInteractionAdapter);

  // contact
  const contactFirebaseRepository = new ContactFirebaseRepository(getFirebaseFirestore());
  const contactAdapter = new ContactAdapter(contactFirebaseRepository, new ContactFirebaseMapper());
  const contactService = new ContactService(contactAdapter);

  // reports (moderación de contenido)
  const reportService = new ReportService(
    new ReportFirebaseRepository(getFirebaseFirestore()),
    eventsService,
    eventSessionService,
    sitesService,
  );

  // declaración del autor al publicar (evidencia legal)
  const contentDeclarationService = new ContentDeclarationService(
    new ContentDeclarationFirebaseRepository(getFirebaseFirestore()),
  );

  // publicar/editar actividades (propiedad del sitio, moderación por confianza, registro de oferente)
  const activityRepository = new ActivityFirebaseRepository(getFirebaseFirestore());
  const activityPublishService = new ActivityPublishService({
    repo: activityRepository,
    accounts: new ActivityAccountFirebaseRepository(getFirebaseFirestore()),
    siteSnapshot: (siteId) => sitesService.getActivityLinkSnapshot(siteId),
    hostGate: (uid) => hostIdentityService.gate(uid),
    declare: (uid, activityId) => contentDeclarationService.record(uid, "activity", activityId),
    markCreator: async (uid) => {
      await userService.markAsCreator(uid);
    },
    hostProfile: async (uid) => {
      const u = await userService.getUserById(uid);
      return { displayName: u?.displayName ?? "", photoURL: u?.photoURL ?? "" };
    },
    clock: () => new Date(),
    log: (entry) => console.log(JSON.stringify(entry)),
  });

  // guardar y "Yo fui" de actividades (solo sobre públicas)
  const activityEngagementService = new ActivityEngagementService(
    new ActivityEngagementFirebaseRepository(getFirebaseFirestore()),
    async (id) => (await activityService.getPublicById(id)) !== null,
  );

  // reclamos de sitios (dueños que piden verificación)
  const siteClaimService = new SiteClaimService(
    new SiteClaimFirebaseRepository(getFirebaseFirestore()),
    sitesService,
  );

  // sugerencias de cambio de sitios (las revisa el administrador)
  const siteSuggestionService = new SiteSuggestionService(
    new SiteSuggestionFirebaseRepository(getFirebaseFirestore()),
    sitesService,
  );

  // campanita de avisos (invitaciones, moderación, sugerencias)
  const notificationService = new NotificationService(
    new NotificationFirebaseRepository(getFirebaseFirestore()),
  );

  // unirse a una salida (cupo opcional) con avisos por la campanita
  const activityJoinService = new ActivityJoinService({
    repo: new ActivityJoinFirebaseRepository(getFirebaseFirestore()),
    getPublic: (id) => activityService.getPublicById(id),
    getForManager: (id, viewer) => activityService.getForManager(id, viewer),
    displayName: async (uid) => (await userService.getUserById(uid))?.displayName ?? "",
    notify: (uid, n, id) => notificationService.notify(uid, n, id),
    clock: () => new Date(),
    legalVersion: LEGAL_VERSION,
  });

  // configuración editable por el administrador (festivos; luego rutas de bus)
  const holidayService = new HolidayService(new ConfigFirebaseRepository(getFirebaseFirestore()));
  const transitRouteService = new TransitRouteService(new ConfigFirebaseRepository(getFirebaseFirestore()));
  const siteTransitService = new SiteTransitService(
    new SiteTransitReportFirebaseRepository(getFirebaseFirestore()),
    sitesService,
    transitRouteService,
  );

  return {
    dailyStatsRepository,
    linksService,
    userService,
    campaignService,
    categoriesService,
    eventsService,
    eventSessionService,
    eventInteractionsService,
    eventRegistrationService,
    eventFeed,
    userPreferencesService,
    sitesService,
    activityService,
    activityPublishService,
    activityEngagementService,
    activityJoinService,
    hostIdentityService,
    siteInteractionService,
    storageService,
    profileService,
    badgeService,
    studioService,
    contactService,
    reportService,
    contentDeclarationService,
    siteClaimService,
    siteSuggestionService,
    notificationService,
    holidayService,
    transitRouteService,
    siteTransitService,
  };
};

export const createContainer = createServerContainer;

export type AppContainer = ReturnType<typeof createContainer>;

