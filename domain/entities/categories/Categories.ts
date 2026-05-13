import type { Navigation } from "./value-objects/Navigation";

export interface Categories {
  id: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;

  navigation: Navigation;
  createdAt: Date;
  updatedAt: Date;
}
