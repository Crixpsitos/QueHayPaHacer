import { AuthService } from "@/application/services/auth/AuthService";
import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";
import { AuthFirebaseRepository } from "@/infraestructure/firebase/repositories/auth/AuthFirebaseRepository";
import { EventsFirebaseRepository as WebEventsFirebaseRepository } from "../firebase/repositories/web/events/EventsFirebaseREpository";
import { getFirebaseFirestore as getWebFirebaseFirestore } from "../firebase/config/client/firebase";

export const createClientContainer = () => {
  const authRepository = new AuthFirebaseRepository(getFirebaseAuth());
  const authService = new AuthService(authRepository);

  const eventsRepository = new WebEventsFirebaseRepository(
    getWebFirebaseFirestore(),
  );

  return {
    authService,
    eventsRepository,
  };
};

export type ClientContainer = ReturnType<typeof createClientContainer>;
