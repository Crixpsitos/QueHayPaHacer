import { cn } from "@/app/lib/utils/cn";
import type { FieldValues } from "react-hook-form";

import { InputProps } from "../types/InputProps";

export const EmailInput = <TFieldValues extends FieldValues>({
  id,
  name,
  register,
  error,
  label,
  className,
}: InputProps<TFieldValues>) => {
  return (
    <div>
      <div className="relative">
        <input
          {...register(name)}
          type="text"
          id={id}
          aria-describedby={error ? `${id}_help` : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "peer block w-full appearance-none rounded-md border bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-foreground outline-none transition-colors focus:ring-0",
            error
              ? "border-red-500 focus:border-red-500"
              : "border-zinc-300 focus:border-foreground",
            className,
          )}
          placeholder=" "
        />
        <label
          htmlFor={id}
          className={cn(
            "absolute start-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 bg-background px-2 text-sm duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4",
            error
              ? "text-red-500 peer-focus:text-red-500"
              : "text-zinc-500 peer-focus:text-foreground",
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <p
          id={`${id}_help`}
          role="alert"
          className="mt-2 text-xs text-red-500"
        >
          <span className="font-medium">{error.message}</span>
        </p>
      )}
    </div>
  );
};

