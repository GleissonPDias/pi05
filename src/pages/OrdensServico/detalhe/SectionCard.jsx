import { cn } from "../../../utils/cn";

/**
 * Bloco branco com título (padrão das abas da OS).
 * flush: sem espaçamento interno no conteúdo (para tabelas de ponta a ponta).
 */
function SectionCard({ icon: Icon, title, badge, actions, flush = false, className, children }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        flush ? "overflow-hidden" : "p-5",
        className,
      )}
    >
      <div className={cn("mb-4 flex flex-wrap items-center gap-x-3 gap-y-2", flush && "px-5 pt-5")}>
        <h2 className="flex items-center gap-2 border-l-4 border-blue-600 pl-3 text-base font-bold text-slate-900">
          {Icon && <Icon className="size-4 text-blue-700" />}
          {title}
        </h2>
        {badge}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export default SectionCard;
