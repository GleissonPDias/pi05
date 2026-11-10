import { useEffect, useState } from "react";
import { AlertTriangleIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { subscribe } from "../services/api";

/**
 * Indicador global das chamadas à API:
 * - barra de progresso enquanto há requisições em andamento;
 * - aviso vermelho quando alguma chamada falha (pode ser fechado).
 */
function ApiFeedback() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "busy") setBusy(event.busy);
        if (event.type === "error") setError(event.error);
      }),
    [],
  );

  return (
    <>
      {busy && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-blue-100"
        >
          <span className="block h-full w-1/3 animate-[api-progress_1.1s_ease-in-out_infinite] bg-blue-600" />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-red-200 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">
                Não foi possível concluir a operação
              </p>
              <p className="mt-1 text-xs text-slate-600">{error.message}</p>
              {error.details?.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs text-red-700">
                  {error.details.slice(0, 4).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Fechar aviso"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      )}

      {busy && (
        <span className="sr-only">
          <LoaderCircleIcon /> Sincronizando com o servidor
        </span>
      )}
    </>
  );
}

export default ApiFeedback;
