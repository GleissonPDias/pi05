import { useCallback, useEffect, useState } from "react";
import { api, isDemo } from "../services/api";
import { mapMecanico } from "../services/mappers";
import {
  getBoxes,
  getMechanics,
  resetMechanics,
  setMechanics,
} from "../services/mechanics";

/**
 * Carrega a equipe técnica (`GET /mecanicos`) e mantém o registro usado pelas
 * leituras síncronas (`mechanicName`, filtros, impressão...).
 *
 * Os boxes continuam estáticos (ainda não há endpoint de boxes).
 */
export function useOficinaState() {
  const [mechanics, setMechanicsList] = useState(() => getMechanics());
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));

  const load = useCallback(async () => {
    if (isDemo()) {
      resetMechanics();
      setMechanicsList(getMechanics());
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dtos = await api.mecanicos.list();
      const list = (Array.isArray(dtos) ? dtos : []).map((dto, index) =>
        mapMecanico(dto, index),
      );
      if (list.length) {
        setMechanics(list);
        setMechanicsList(list);
      } else {
        resetMechanics();
        setMechanicsList(getMechanics());
      }
      setSource("api");
    } catch (loadError) {
      setError(loadError);
      setMechanicsList(getMechanics());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Adia o primeiro carregamento para não atualizar estado no corpo do efeito.
    queueMicrotask(load);
  }, [load]);

  return {
    mechanics,
    boxes: getBoxes(),
    loading,
    error,
    source,
    reload: load,
  };
}
