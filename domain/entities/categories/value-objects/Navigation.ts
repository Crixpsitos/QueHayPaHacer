import type { NavigationSort } from "./NavigationSort";

export interface Navigation {
    resource: string;
    filters: Record<string, string | number | boolean>;
    sort?: NavigationSort;
}