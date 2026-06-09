"use client";

import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

interface CustomToastProps {
  t: string | number;
  title: string;
  description?: string;
  type?: "success" | "error" | "warning" | "info";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const CustomToast = ({ t, title, description, type = "info", action }: CustomToastProps) => {
  const icons = {
    success: <CheckCircle2 className="size-5 text-emerald-500" />,
    error: <XCircle className="size-5 text-rose-500" />,
    warning: <AlertTriangle className="size-5 text-amber-500" />,
    info: <Info className="size-5 text-blue-500" />,
  };

  return (
    <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-zinc-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        )}
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              toast.dismiss(t);
            }}
            className="mt-2 text-xs font-medium text-zinc-950 underline underline-offset-4 hover:opacity-80 dark:text-white"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(t)}
        className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};