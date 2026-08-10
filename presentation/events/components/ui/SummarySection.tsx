import { Pencil } from "lucide-react";

export function SummarySection({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#09090B]">{title}</h4>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-lg border border-[#E4E4E7] px-2.5 py-1.5 text-xs font-medium text-[#71717A] transition-colors hover:border-[#A1A1AA] hover:text-[#09090B]"
        >
          <Pencil className="size-3" />
          Editar
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}