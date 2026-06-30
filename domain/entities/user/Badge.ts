export type BadgeCategory = "system" | "achievement" | "milestone";

export interface BadgeCriteria {
  type: "automatic" | "manual";
  requirement?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  createdAt: Date;
  active: boolean;
}
