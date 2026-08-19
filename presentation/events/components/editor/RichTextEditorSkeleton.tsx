import { Skeleton } from "@/app/components/ui/skeleton";

export function RichTextEditorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[240px] w-full" />
    </div>
  );
}
