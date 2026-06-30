import { create } from "zustand";

type selectedSectionSetting =
  | "main"
  | "edit-profile"
  | "change-password"
  | "professional"
  | "delete";

interface ProfileConfig {
    openSettings: boolean;
    onOpenSettings: (open: boolean) => void;
    selectedSectionSetting: selectedSectionSetting;
    onSelectSectionSetting: (section: selectedSectionSetting) => void;
}

export const useProfileConfigStore = create<ProfileConfig>((set) => ({
    openSettings: false,
    onOpenSettings: (open: boolean) => set({ openSettings: open }),
    selectedSectionSetting: "main",
    onSelectSectionSetting: (section: selectedSectionSetting) => set({ selectedSectionSetting: section }),
}));