"use client"
import { useModalStore } from "@/app/store/modal/modal.store";

export const GlobalModal = () => {
  const { modal } = useModalStore();

  if (!modal) return null;

  return <>{modal}</>;
};
