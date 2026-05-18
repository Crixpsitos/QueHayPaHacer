import { Events } from "../events/Events";
import { User } from "../user/User";

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: "pending" | "accepted" | "canceled";
  event: Partial<Events>;
  user: Partial<User>;
  registeredAt: Date;

  formData?: Record<
    string,
    string | string[] | number | boolean | null | Record<string, unknown>
  >;
  qrCode: string;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
