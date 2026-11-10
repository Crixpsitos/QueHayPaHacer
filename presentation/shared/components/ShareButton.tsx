"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ShareKit, type ShareKitProps } from "./ShareKit";

/** Botón "Compartir" que abre el kit (enlaces por canal, QR y afiche). Para las listas de Mis eventos y Mis sitios, también en cuentas básicas. */
export function ShareButton(props: Omit<ShareKitProps, "open" | "onClose"> & { variant?: "outline" | "ghost" | "default"; className?: string }) {
  const [open, setOpen] = useState(false);
  const { variant = "outline", className, ...kit } = props;
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={variant}
        className={className}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <Share2 aria-hidden />
        Compartir
      </Button>
      {open && <ShareKit {...kit} open onClose={() => setOpen(false)} />}
    </>
  );
}
