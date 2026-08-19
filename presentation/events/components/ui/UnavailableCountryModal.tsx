"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { MapPin, Sparkles } from "lucide-react";

const REDIRECT_DELAY_MS = 6000;

interface UnavailableCountryModalProps {
  open: boolean;
  countryName?: string;
}

export const UnavailableCountryModal = ({
  open,
  countryName,
}: UnavailableCountryModalProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => router.push("/"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, router]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md text-center gap-6 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <MapPin className="h-8 w-8 text-amber-500" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Lo sentimos{countryName ? `, ${countryName}` : ""}
            </DialogTitle>
            <DialogDescription className="text-gray-500 leading-relaxed">
              Tu país aún no está disponible en nuestra plataforma. Pero no te
              preocupes — ¡pronto llegaremos con sorpresas!
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <span>Estamos trabajando para estar cerca de ti.</span>
          </div>

          <p className="text-xs text-gray-400">
            Serás redirigido al inicio en unos segundos…
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
