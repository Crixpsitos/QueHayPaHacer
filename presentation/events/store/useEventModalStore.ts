import { create } from "zustand";

interface EventModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const useEventModalStore = create<EventModalState>((set) => ({
  isOpen: true,
  setIsOpen: (open) => set({ isOpen: open }),
}));