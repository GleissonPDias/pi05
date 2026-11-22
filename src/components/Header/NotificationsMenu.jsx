import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import { formatTimeAgo } from "../../utils/dates";
import { cn } from "../../utils/cn";

/**
 * Sino de notificações: contador de não lidas (`/notificacoes/nao-lidas/contador`)
 * e lista das mais recentes. Atualiza o contador ao trocar de tela.
 */
function NotificationsMenu() {
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (isDemo) {
      setCount(0);
      return;
    }
    try {
      const result = await api.notificacoes.contador();
      setCount(Number(result?.naoLidas) || 0);
    } catch {
      // Sem API, o contador simplesmente não é atualizado.
    }
  }, [isDemo]);

  const loadList = useCallback(async () => {
    if (isDemo) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.notificacoes.list({ limite: 15 });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    queueMicrotask(refreshCount);
  }, [refreshCount, pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) queueMicrotask(loadList);
  };

  const openItem = async (item) => {
    if (!item.lida) {
      try {
        await api.notificacoes.markRead(item.id);
      } catch {
        // Erro exibido pelo banner global da API.
      }
    }
    setOpen(false);
    if (item.link?.startsWith("/")) navigate(item.link);
    refreshCount();
  };

  const markAll = async () => {
    try {
      await api.notificacoes.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, lida: true })));
      setCount(0);
    } catch {
      // Erro exibido pelo banner global da API.
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notificações (${count} não lidas)`}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <BellIcon className="size-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notificações"
          className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notificações</p>
            {count > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <CheckCheckIcon className="size-3.5" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {loading && <li className="px-4 py-6 text-center text-sm text-slate-500">Carregando...</li>}
            {!loading && items.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                {isDemo ? "Notificações indisponíveis no modo demonstração." : "Nenhuma notificação."}
              </li>
            )}
            {!loading &&
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                      !item.lida && "bg-blue-50/60",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.lida ? "bg-transparent" : "bg-blue-600")}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">{item.titulo}</span>
                      {item.mensagem && <span className="line-clamp-2 text-xs text-slate-600">{item.mensagem}</span>}
                      <span className="mt-0.5 block text-[11px] text-slate-500">{formatTimeAgo(item.criadoEm)}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
