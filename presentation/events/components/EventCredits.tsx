import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

const initials = (name: string) => name.slice(0, 2).toUpperCase();

type CollaboratorsData = Record<
  string,
  { displayName: string; photoURL?: string; role: "editor" | "viewer" | "credit" }
>;

/**
 * Créditos de colaboradores acreditados en el evento ("con X, Y y Z").
 * Lee `collaboratorsData` (denormalizado), sin joins. No renderiza nada si vacío.
 */
export function EventCredits({
  collaboratorsData,
  className,
  compact = false,
}: {
  collaboratorsData?: CollaboratorsData;
  className?: string;
  compact?: boolean;
}) {
  const list = Object.entries(collaboratorsData ?? {});
  if (list.length === 0) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
        <div className="flex -space-x-2">
          {list.slice(0, 3).map(([refId, c]) => (
            <Avatar key={refId} className="h-6 w-6 border border-white">
              {c.photoURL && <AvatarImage src={c.photoURL} alt={c.displayName} />}
              <AvatarFallback className="bg-slate-100 text-[9px] font-semibold text-slate-600">
                {initials(c.displayName)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {list.length === 1 ? list[0][1].displayName : `+${list.length} colaboradores`}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs text-gray-500">Con la colaboración de</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        {list.map(([refId, c]) => (
          <div key={refId} className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {c.photoURL && <AvatarImage src={c.photoURL} alt={c.displayName} />}
              <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-600">
                {initials(c.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-800">{c.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
