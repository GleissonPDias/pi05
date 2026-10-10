import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { normalize } from "../ordemUtils";

/**
 * Lista pesquisável de itens do catálogo (peças ou serviços).
 * - items: itens com `code` e `description`
 * - renderItem(item): conteúdo de cada linha
 */
function CatalogList({ items, selected, onSelect, renderItem, placeholder, label }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const text = normalize(query.trim());
    if (!text) return items;
    return items.filter((item) => normalize(`${item.code} ${item.description} ${item.detail ?? ""}`).includes(text));
  }, [items, query]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          data-autofocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="w-full rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <ul role="listbox" aria-label={label} className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Nada encontrado. Tente outro termo ou cadastre um item avulso.
          </li>
        )}
        {filtered.map((item) => {
          const isSelected = selected?.code === item.code;
          return (
            <li key={item.code} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isSelected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-blue-300",
                )}
              >
                {renderItem(item)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CatalogList;
