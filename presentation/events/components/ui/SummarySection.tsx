import { Button } from "@/app/components/ui/button";
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
    <div className="rounded border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 text-gray-600 hover:text-black"
        >
          <Pencil className="mr-1 h-3 w-3" />
          Editar
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}