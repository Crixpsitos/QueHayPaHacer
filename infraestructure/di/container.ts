import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";
import { AuthFirebaseRepository } from "@/infraestructure/firebase/repositories/auth/AuthFirebaseRepository";
import { UserAdapter } from "@/infraestructure/adapters/user/UserAdapter";
import { UserFirebaseRepository } from "@/infraestructure/firebase/repositories/user/UserFirebaseRepository";
import { CampaignFirebaseRepository } from "@/infraestructure/firebase/repositories/campaign/CampaignFirebaseRepository";
import { CampaignAdapter } from "@/infraestructure/adapters/campaign/CampaignAdapter";
import { UserService } from "@/application/services/user/UserService";
import { CampaignService } from "@/application/services/campaign/CampaignService";
import { AuthService } from "@/application/services/auth/AuthService";
import { getFirebaseFirestore } from "../firebase/config/admin/firebase";
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

export const createServerContainer = () => {
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
  const eventsService = new EventsService(eventsRepository);

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
  const userPreferencesRepository = new UserPreferencesAdapter();
  const userPreferencesService = new UserPreferencesService(userPreferencesRepository);

  return {
    userService,
    campaignService,
    categoriesService,
    eventsService,
    eventInteractionsService,
    eventRegistrationService,
    eventFeed,
    userPreferencesService,
  };
};

export const createClientContainer = () => {
  const authRepository = new AuthFirebaseRepository(getFirebaseAuth());
  const authService = new AuthService(authRepository);

  return {
    authService,
  };
};

export const createContainer = createServerContainer;

export type AppContainer = ReturnType<typeof createContainer>;
export type ClientContainer = ReturnType<typeof createClientContainer>;
