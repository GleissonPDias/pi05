import { cn } from "../../utils/cn";

/**
 * Cabeçalho padrão de card: [ícone] título ........ [badge/ação]
 *                            subtítulo
 * - `icon` (opcional): componente de ícone do lucide-react
 * - `iconClassName`: cores do quadrado do ícone (fundo + cor)
 * - `action`: elemento à direita (badge, link, indicador...)
 */
function CardHeader({
  icon: Icon,
  iconClassName = "bg-blue-100 text-blue-600",
  title,
  subtitle,
  action,
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg",
                iconClassName,
              )}
            >
              <Icon className="size-5" />
            </span>
          )}
          <h2 className="text-base font-bold leading-tight text-slate-900">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default CardHeader;
