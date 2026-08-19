// Ruta exclusiva de desarrollo — no indexada, no expuesta a usuarios finales

export const metadata = {
  title: "ProfileHeader — UI Playground",
  robots: { index: false, follow: false },
};

export default function DevProfileHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Barra de aviso: entorno de desarrollo */}
      <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 backdrop-blur-sm">
        <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-900">
          DEV
        </span>
        <span className="text-xs font-medium text-yellow-300">
          ProfileHeader — UI Playground
        </span>
        <span className="ml-auto text-[11px] text-yellow-500/70">
          Solo visible en desarrollo · Sin escrituras en producción
        </span>
      </div>
      {children}
    </div>
  );
}
