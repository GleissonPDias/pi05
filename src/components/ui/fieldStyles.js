import { cn } from "../../utils/cn";

/** Classes compartilhadas por campos de texto e seleção (TextField, SelectField). */
export const fieldClassName = (hasError) =>
  cn(
    "w-full rounded-lg border bg-blue-50 px-3 py-2.5 text-sm text-slate-900",
    "placeholder:text-slate-500 transition-colors",
    "focus:outline-none focus:ring-2",
    "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
    hasError
      ? "border-red-500 bg-red-50 focus:ring-red-500"
      : "border-transparent focus:border-blue-500 focus:ring-blue-500",
  );
