import { useId } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { fieldClassName } from "./fieldStyles";

/**
 * Lista suspensa com o mesmo visual do TextField.
 *
 * - options: [{ value, label }]
 * - placeholder: texto da primeira opção vazia (ex.: "Selecione...")
 * - labelAddon: elemento à direita do rótulo (ex.: link "+ Novo Cliente")
 * Demais props (name, value, onChange, disabled...) vão para o <select>.
 */
function SelectField({
  label,
  required = false,
  error,
  options,
  placeholder,
  labelAddon,
  className,
  ...selectProps
}) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={className}>
      <div className="mb-1.5 flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={id} className="min-w-0 truncate text-xs font-semibold text-slate-700">
          {label}
          {required && (
            <span aria-hidden="true" className="text-red-600">
              {" "}
              *
            </span>
          )}
        </label>
        {labelAddon}
      </div>

      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className={cn(fieldClassName(Boolean(error)), "appearance-none pr-9")}
          {...selectProps}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      </div>

      {error && (
        <p
          id={messageId}
          role="alert"
          className="mt-1 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default SelectField;
