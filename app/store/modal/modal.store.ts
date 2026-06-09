import { create } from "zustand";
import { ReactNode } from "react";


interface ModalStore {
    modal: ReactNode | null;
    openModal: (modal: ReactNode) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
    modal: null,
    openModal: (modal: ReactNode) => set({ modal }),
    closeModal: () => set({ modal: null }),
}));