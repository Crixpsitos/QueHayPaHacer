import type { ReactNode } from "react";
import { StudioHeader } from "./StudioHeader";
import { StudioSidebar } from "./StudioSidebar";

interface StudioShellProps {
  displayName: string;
  email?: string;
  photoURL?: string;
  professionalLabel: string;
  children: ReactNode;
}

/**
 * Layout raíz del Estudio del Organizador: tema claro, header fijo y sidebar
 * fija. Completamente independiente del layout del home y del perfil.
 */
export function StudioShell({
  displayName,
  email,
  photoURL,
  professionalLabel,
  children,
}: StudioShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased">
      <StudioHeader displayName={displayName} email={email} photoURL={photoURL} />
      <div className="flex flex-1">
        <StudioSidebar professionalLabel={professionalLabel} />
        <main className="min-w-0 flex-1 bg-gray-50/40">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
