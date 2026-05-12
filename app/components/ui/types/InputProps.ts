import type {
  FieldError,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

export interface InputProps<TFieldValues extends FieldValues = FieldValues> {
  id: string;
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
  label: string;
  className?: string;
}
