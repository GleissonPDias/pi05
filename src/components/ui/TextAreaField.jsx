import { useId } from "react";
import { cn } from "../../utils/cn";
import { fieldClassName } from "./fieldStyles";

/**
 * Rótulo + área de texto + mensagem de erro (mesmo visual do TextField).
 * - counter: mostra "120/500" quando há maxLength
 * Demais props (name, value, onChange, rows, maxLength...) vão para o <textarea>.
 */
function TextAreaField({ label, required = false, error, hint, labelAddon, counter = false, className, ...props }) {
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
        {counter && props.maxLength && (
          <span className="shrink-0 text-[11px] text-slate-500">
            {String(props.value ?? "").length}/{props.maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(fieldClassName(Boolean(error)), "min-h-20 resize-y leading-relaxed")}
        {...props}
      />
      {hasMessage && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn("mt-1 text-xs", error ? "font-medium text-red-600" : "text-slate-500")}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export default TextAreaField;
