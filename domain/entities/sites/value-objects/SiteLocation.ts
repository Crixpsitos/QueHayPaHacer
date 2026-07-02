import type { Coordinates } from "./Coordinates";

export class SiteLocation {
  constructor(
    public readonly coordinates: Coordinates,
    public readonly countrySlug: string,
    public readonly country: string,
    public readonly regionSlug: string,
    public readonly region: string,
    public readonly citySlug: string,
    public readonly city: string,
    public readonly address: string,
  ) {}
}
