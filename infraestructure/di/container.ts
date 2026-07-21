
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
import { ProfileService } from "@/application/services/profile/ProfileService";
import { BadgeFirebaseRepository } from "../firebase/repositories/user/BadgeFirebaseRepository";
import { BadgeAdapter } from "../adapters/user/BadgeAdapter";
import { BadgeFirebaseMapper } from "../firebase/mappers/user/BadgeFirebaseMapper";
import { BadgeService } from "@/application/services/user/BadgeService";
import { ProfessionalRequestFirebaseRepository } from "../firebase/repositories/professional/ProfessionalRequestFirebaseRepository";
import { ProfessionalRequestAdapter } from "../adapters/professional/ProfessionalRequestAdapter";
import { ProfessionalRequestFirebaseMapper } from "../firebase/mappers/professional/ProfessionalRequestFirebaseMapper";
import { ProfessionalRequestService } from "@/application/services/professional/ProfessionalRequestService";
import { StudioFirebaseRepository } from "../firebase/repositories/studio/StudioFirebaseRepository";
import { StudioAdapter } from "../adapters/studio/StudioAdapter";
import { StudioService } from "@/application/services/studio/StudioService";
import { SitesFirebaseRepository } from "../firebase/repositories/sites/SitesFirebaseRepository";
import { SitesAdapter } from "../adapters/sites/SitesAdapter";
import { SiteFirebaseMapper } from "../firebase/mappers/sites/SiteFirebaseMapper";
import { SitesService } from "@/application/services/sites/SitesService";
import { EventSessionFirebaseRepository } from "../firebase/repositories/events/EventSessionFirebaseRepository";
import { EventSessionService } from "@/application/services/events/EventSessionService";


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
  const eventSessionRepository = new EventSessionFirebaseRepository(getFirebaseFirestore());
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
  const profileRepository = new ProfileAdapter(profileFirebaseRepository);
  const profileService = new ProfileService(profileRepository);

  // badges
  const badgeFirebaseRepository = new BadgeFirebaseRepository(getFirebaseFirestore());
  const badgeRepository = new BadgeAdapter(badgeFirebaseRepository, new BadgeFirebaseMapper());
  const badgeService = new BadgeService(badgeRepository);

  // professional requests
  const professionalRequestFirebaseRepository = new ProfessionalRequestFirebaseRepository(getFirebaseFirestore());
  const professionalRequestRepository = new ProfessionalRequestAdapter(
    professionalRequestFirebaseRepository,
    new ProfessionalRequestFirebaseMapper(),
  );
  const professionalRequestService = new ProfessionalRequestService(professionalRequestRepository, userRepository);

  // studio (Estudio del Organizador) — repo en stubs por ahora
  const studioFirebaseRepository = new StudioFirebaseRepository(getEnterpriseFirestore());
  const studioRepository = new StudioAdapter(studioFirebaseRepository);
  const studioService = new StudioService(studioRepository);

  // sites
  const sitesFirebaseRepository = new SitesFirebaseRepository(getFirebaseFirestore());
  const sitesAdapter = new SitesAdapter(sitesFirebaseRepository, new SiteFirebaseMapper());
  const sitesService = new SitesService(sitesAdapter);

  return {
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
    storageService,
    profileService,
    badgeService,
    professionalRequestService,
    studioService,
  };
};

export const createContainer = createServerContainer;

export type AppContainer = ReturnType<typeof createContainer>;

