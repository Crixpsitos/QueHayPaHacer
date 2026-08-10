export function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const isEmpty = value === undefined || value === null || value === "";
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-xs font-medium text-[#71717A]">{label}</span>
      <span className="text-sm text-[#09090B]">
        {isEmpty ? <span className="text-[#A1A1AA]">No proporcionado</span> : value}
      </span>
    </div>
  );
}