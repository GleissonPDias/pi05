import { cn } from "../../utils/cn";

/** Caixa de seleção com texto clicável. Props extras vão para o <input>. */
function Checkbox({ className, children, ...inputProps }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-xs leading-snug text-slate-700",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        {...inputProps}
      />
      <span>{children}</span>
    </label>
  );
}

export default Checkbox;
