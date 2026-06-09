export function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">
        {value || <span className="text-gray-400">No proporcionado</span>}
      </span>
    </div>
  );
}