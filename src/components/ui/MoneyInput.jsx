import { cn } from "../../utils/cn";
import { maskMoney, moneyToInput, parseMoney } from "../../utils/masks";

/**
 * Campo de valor em reais (sem rótulo, para tabelas). Digita-se como em uma
 * caixa registradora: "4500" vira "45,00".
 * - value: número · onChange(número)
 */
function MoneyInput({ value, onChange, className, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={moneyToInput(value)}
        onChange={(event) => onChange(parseMoney(maskMoney(event.target.value)))}
        className="w-full rounded-lg border border-transparent bg-blue-50 py-1.5 pl-8 pr-2 text-right text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:text-slate-900"
        {...props}
      />
    </div>
  );
}

export default MoneyInput;
