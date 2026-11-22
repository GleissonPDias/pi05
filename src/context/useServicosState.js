import { useCallback, useEffect, useState } from "react";
import { api, isDemo } from "../services/api";
import { loadParts, registerServices } from "../services/catalogs";
import {
  mapServico,
  servicoCreatePayload,
  servicoUpdatePayload,
  sugestoesFromDtos,
  sugestoesPayload,
} from "../services/mappers";
import {
  KEYS,
  readList,
  readMap,
  writeList,
  writeMap,
} from "../services/storage";
import { SERVICES_CATALOG } from "../mocks/catalogo";
import { currentOperator } from "../mocks/user";

/** Próximo código: SV-018 -> SV-019 */
function nextCode(services) {
  const highest = services.reduce((max, item) => {
    const numeric = Number(String(item.code).replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
  return `SV-${String(highest + 1).padStart(3, "0")}`;
}

const stamp = () => ({ updatedAt: new Date().toISOString(), updatedBy: currentOperator });

/** Campos que ainda não têm coluna na API (peças sugeridas). */
function persistServiceOverlay(service) {
  if (isDemo() || !service?.code) return;
  writeMap(KEYS.services, {
    ...readMap(KEYS.services),
    [service.code]: {
      suggestedParts: service.suggestedParts ?? [],
      updatedAt: service.updatedAt ?? new Date().toISOString(),
      updatedBy: service.updatedBy ?? currentOperator,
    },
  });
}

/**
 * Salva os vínculos de peças sugeridas do serviço e devolve os códigos
 * normalizados pelo catálogo (a API trabalha com ids, a interface com códigos).
 */
async function salvarSugestoes(apiId, codes) {
  if (!apiId) return codes ?? [];
  await loadParts().catch(() => null);
  const dtos = await api.servicos.salvarPecasSugeridas(apiId, sugestoesPayload(codes));
  return sugestoesFromDtos(dtos);
}

/**
 * Catálogo de serviços da oficina (usado pelo AppProviders).
 * Alimenta o "Adicionar Serviço" das OS e dos orçamentos.
 *
 * Os campos do catálogo e as peças sugeridas são persistidos na API. O overlay
 * local continua servindo de cache para o modo offline/demonstração.
 */
export function useServicosState() {
  const [services, setServices] = useState(() => (isDemo() ? SERVICES_CATALOG : []));
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));

  const load = useCallback(async () => {
    if (isDemo()) {
      registerServices(SERVICES_CATALOG);
      setServices(SERVICES_CATALOG);
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [dtos, overlays, locals, deleted] = await Promise.all([
        api.servicos.list(),
        Promise.resolve(readMap(KEYS.services)),
        Promise.resolve(readList(KEYS.localServices)),
        Promise.resolve(readList(KEYS.deletedServices)),
      ]);

      // As peças sugeridas vêm por serviço; falhas pontuais caem no overlay.
      await loadParts().catch(() => null);
      const sugestoes = await Promise.all(
        dtos.map((dto) =>
          dto?.id
            ? api.servicos
                .pecasSugeridas(dto.id, { notifyError: false })
                .then((list) => ({ ok: true, list }))
                .catch(() => ({ ok: false, list: [] }))
            : Promise.resolve({ ok: false, list: [] }),
        ),
      );

      const deletedSet = new Set(deleted.map(String));
      const merged = new Map();

      dtos.forEach((dto, index) => {
        const code = dto.codigo ?? String(dto.id);
        const overlay = overlays[code] ?? overlays[String(dto.id)] ?? {};
        const apiSugestoes = sugestoes[index];
        const service = mapServico(dto, {
          ...overlay,
          suggestedParts: apiSugestoes.ok
            ? sugestoesFromDtos(apiSugestoes.list)
            : (overlay.suggestedParts ?? []),
        });
        if (!deletedSet.has(service.code)) merged.set(service.code, service);
      });

      locals.forEach((service) => {
        if (service?.code && !deletedSet.has(service.code)) merged.set(service.code, service);
      });

      const list = [...merged.values()];
      registerServices(list);
      setServices(list);
      setSource("api");
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Adia o primeiro carregamento para não atualizar estado no corpo do efeito.
    queueMicrotask(load);
  }, [load]);

  /** Cadastra e devolve o serviço criado. */
  const createService = useCallback(
    async (data) => {
      if (isDemo()) {
        const service = { ...data, code: nextCode(services), status: "ativo", ...stamp() };
        const next = [...services, service];
        registerServices(next);
        setServices(next);
        return service;
      }

      const dto = await api.servicos.create(servicoCreatePayload(data));
      const service = {
        ...mapServico(dto),
        suggestedParts: await salvarSugestoes(dto.id, data.suggestedParts ?? []),
        ...stamp(),
      };
      const next = [...services, service];
      registerServices(next);
      setServices(next);
      persistServiceOverlay(service);
      return service;
    },
    [services],
  );

  const updateService = useCallback(
    async (code, data) => {
      const current = services.find((item) => item.code === code);
      if (!current) return null;

      const merged = { ...current, ...data, ...stamp() };

      if (isDemo() || !current.apiId) {
        const next = services.map((item) => (item.code === code ? merged : item));
        registerServices(next);
        setServices(next);
        persistServiceOverlay(merged);
        return merged;
      }

      const dto = await api.servicos.update(current.apiId, servicoUpdatePayload(merged));
      const service = {
        ...mapServico(dto),
        suggestedParts: await salvarSugestoes(
          current.apiId,
          data.suggestedParts ?? current.suggestedParts ?? [],
        ),
        ...stamp(),
      };
      const next = services.map((item) => (item.code === code ? service : item));
      registerServices(next);
      setServices(next);
      persistServiceOverlay(service);
      return service;
    },
    [services],
  );

  /** Ativa ("ativo") ou desativa ("inativo") um serviço. */
  const setServiceStatus = useCallback(
    (code, status) => updateService(code, { status }),
    [updateService],
  );

  /** Remove do catálogo (exclusão lógica na API). */
  const deleteService = useCallback(
    async (code) => {
      const current = services.find((item) => item.code === code);

      if (!isDemo() && current?.apiId) {
        await api.servicos.remove(current.apiId);
      }

      const next = services.filter((item) => item.code !== code);
      registerServices(next);
      setServices(next);

      if (!isDemo()) {
        writeList(
          KEYS.localServices,
          readList(KEYS.localServices).filter((item) => item.code !== code),
        );
        writeList(KEYS.deletedServices, [
          ...new Set([...readList(KEYS.deletedServices).map(String), code]),
        ]);
      }
    },
    [services],
  );

  return {
    services,
    createService,
    updateService,
    setServiceStatus,
    deleteService,
    loading,
    error,
    source,
    reload: load,
  };
}
