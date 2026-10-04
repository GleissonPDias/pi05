import { useId } from "react";
import { cn } from "../../utils/cn";
import { fieldClassName } from "./fieldStyles";

/**
 * Rótulo + campo + mensagem de erro, com acessibilidade já ligada
 * (label/for, aria-invalid, aria-describedby).
 *
 * Props extras (name, value, onChange, type, placeholder, maxLength,
 * inputMode, disabled, autoComplete...) vão direto para o <input>.
 * - labelAddon: elemento à direita do rótulo (ex.: selo "WhatsApp")
 * - trailing: elemento dentro do campo, à direita (ex.: ícone de check)
 * - hint: texto de ajuda abaixo do campo (some quando há erro)
 * - inputClassName: classes extras aplicadas no <input> (ex.: "font-mono")
 */
function TextField({
  label,
  required = false,
  error,
  hint,
  labelAddon,
  trailing,
  className,
  inputClassName,
  ...inputProps
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

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
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(fieldClassName(Boolean(error)), trailing && "pr-10", inputClassName)}
          {...inputProps}
        />
        {trailing && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        )}
      </div>

      {hasMessage && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn(
            "mt-1 text-xs",
            error ? "font-medium text-red-600" : "text-slate-500",
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export default TextField;
