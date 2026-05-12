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

export const createServerContainer = () => {
  const userFirebaseRepository = new UserFirebaseRepository(getFirebaseFirestore());
  const userRepository = new UserAdapter(userFirebaseRepository);
  const userService = new UserService(userRepository);

  const campaignFirebaseRepository = new CampaignFirebaseRepository(getFirebaseFirestore());
  const campaignRepository = new CampaignAdapter(campaignFirebaseRepository);
  const campaignService = new CampaignService(campaignRepository);

  return {
    userService,
    campaignService,
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