import { ImageVariants } from "@/domain/shared/ImageVariants";
import { Location } from "./value-objects/Location";
import { Dates } from "./value-objects/Dates";
import { Price } from "./value-objects/Price";
import { Promotion } from "./value-objects/Promotion";
import { CategoryInfo } from "./value-objects/CategoryInfo";

export interface Events extends Dates {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  images: ImageVariants;
  categoryInfo: CategoryInfo
  author: {
    id: string;
    displayName: string;
    photoURL: string;
  };
  location: Location;
  status: "draft" | "published" | "cancelled" | "ended";
  registrationType: "none" | "internal" | "external" | "form";
  externalUrl?: string;
  capacity?: number;
  price: Price;
  promotion: Promotion;
  analytics?: {
    views?: number;
    clicks?: number;
    likes?: number;
    registrations?: number;
    score?: number;
  };
}
