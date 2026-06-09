import { cn } from "@/app/lib/utils/cn";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

export const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      "rounded p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed",
      isActive && "bg-gray-900 text-white hover:bg-gray-700",
    )}
  >
    {children}
  </button>
);
