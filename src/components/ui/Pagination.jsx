import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Monta a lista de itens da paginação.
 * Ex.: página 1 de 21 -> [1, 2, 3, "...", 21]
 *      página 10 de 21 -> [1, "...", 9, 10, 11, "...", 21]
 */
function getPageItems(page, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items = new Set([1, totalPages]);
  const start = page <= 2 ? 1 : page >= totalPages - 1 ? totalPages - 2 : page - 1;
  for (let p = start; p < start + 3; p++) items.add(p);

  const sorted = [...items].sort((a, b) => a - b);
  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1] > 1 ? ["ellipsis", p] : [p],
  );
}

const baseButton =
  "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={cn(
          baseButton,
          "text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        )}
      >
        <ChevronLeftIcon className="size-4" />
      </button>

      {getPageItems(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              baseButton,
              item === page
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-blue-50",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Próxima página"
        className={cn(
          baseButton,
          "gap-0.5 bg-white text-slate-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white",
        )}
      >
        <span className="inline-flex items-center gap-0.5">
          Próximo
          <ChevronRightIcon className="size-3.5" />
        </span>
      </button>
    </nav>
  );
}

export default Pagination;
