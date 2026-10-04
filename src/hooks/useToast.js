import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Controla um aviso temporário (toast) que some sozinho.
 *
 * const { toast, showToast, dismissToast } = useToast();
 * showToast("Cliente salvo com sucesso!");
 * <Toast toast={toast} onClose={dismissToast} />
 */
export function useToast(duration = 4000) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message, tone = "success") => {
      clearTimeout(timer.current);
      setToast({ message, tone });
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  // Evita disparar o timer depois que a tela foi fechada
  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast, dismissToast };
}
