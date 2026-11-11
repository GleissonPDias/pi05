import { useCallback, useEffect, useState } from "react";
import { api, isDemo } from "../services/api";
import { mapBox, mapMecanico, mapWorkshop } from "../services/mappers";
import {
  getBoxes,
  getMechanics,
  resetBoxes,
  resetMechanics,
  setBoxes,
  setMechanics,
} from "../services/mechanics";
import { getWorkshop, resetWorkshop, setWorkshop } from "../services/workshop";

/**
 * Carrega a configuração compartilhada da oficina: equipe técnica
 * (`GET /mecanicos`), boxes (`GET /boxes`) e dados cadastrais (`GET /oficina`).
 *
 * Cada recurso é independente: se um falhar, os demais continuam válidos e o
 * registro correspondente volta ao último valor conhecido (mock em demo).
 */
export function useOficinaState() {
  const [mechanics, setMechanicsList] = useState(() => getMechanics());
  const [boxes, setBoxesList] = useState(() => getBoxes());
  const [workshop, setWorkshopState] = useState(() => getWorkshop());
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));

  const load = useCallback(async () => {
    if (isDemo()) {
      resetMechanics();
      resetBoxes();
      resetWorkshop();
      setMechanicsList(getMechanics());
      setBoxesList(getBoxes());
      setWorkshopState(getWorkshop());
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [mechanicsResult, boxesResult, workshopResult] = await Promise.allSettled([
      api.mecanicos.list(),
      api.boxes.list(),
      api.oficina.get(),
    ]);

    // A API é a fonte da verdade: listas vazias são estados válidos.
    if (mechanicsResult.status === "fulfilled") {
      const list = (Array.isArray(mechanicsResult.value) ? mechanicsResult.value : []).map(mapMecanico);
      setMechanics(list);
      setMechanicsList(list);
    }
    if (boxesResult.status === "fulfilled") {
      const list = (Array.isArray(boxesResult.value) ? boxesResult.value : []).map(mapBox);
      setBoxes(list);
      setBoxesList(list);
    }
    if (workshopResult.status === "fulfilled") {
      setWorkshop(mapWorkshop(workshopResult.value));
      setWorkshopState(getWorkshop());
    }

    const failed = [mechanicsResult, boxesResult, workshopResult].find(
      (result) => result.status === "rejected",
    );
    setError(failed ? failed.reason : null);
    setSource("api");
    setLoading(false);
  }, []);

  useEffect(() => {
    // Adia o primeiro carregamento para não atualizar estado no corpo do efeito.
    queueMicrotask(load);
  }, [load]);

  return {
    mechanics,
    boxes,
    workshop,
    loading,
    error,
    source,
    reload: load,
  };
}
