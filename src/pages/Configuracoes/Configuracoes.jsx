import { useCallback, useEffect, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useOficina } from "../../hooks/useOficina";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { getBoxes } from "../../services/mechanics";
import { getWorkshop } from "../../services/workshop";
import BoxFormModal from "./BoxFormModal";
import BoxesCard from "./BoxesCard";
import OficinaDadosCard from "./OficinaDadosCard";
import { emptyOficina, oficinaToForm } from "./configuracoesUtils";

/** Boxes no formato da API, usados no modo demonstração (somente leitura). */
function demoBoxes() {
  return getBoxes().map((box) => ({ id: box.id, nome: box.name, descricao: box.type, ativo: true }));
}

/**
 * Configurações da oficina (rota /configuracoes, somente ADMIN).
 * Dados cadastrais via `GET/PUT /oficina` e boxes via `/boxes`.
 */
function Configuracoes() {
  const { isDemo } = useAuth();
  const { reload: reloadOficina } = useOficina();
  const { toast, showToast, dismissToast } = useToast();

  const [values, setValues] = useState(() => emptyOficina());
  const [loadingOficina, setLoadingOficina] = useState(() => !isDemo);
  const [saving, setSaving] = useState(false);

  const [boxes, setBoxes] = useState(() => (isDemo ? demoBoxes() : []));
  const [loadingBoxes, setLoadingBoxes] = useState(() => !isDemo);
  const [boxModal, setBoxModal] = useState({ open: false, box: null });

  const loadBoxes = useCallback(async () => {
    if (isDemo) {
      setBoxes(demoBoxes());
      setLoadingBoxes(false);
      return;
    }
    setLoadingBoxes(true);
    try {
      const data = await api.boxes.list({ incluirInativos: true });
      setBoxes(Array.isArray(data) ? data : []);
    } catch {
      // O banner global já mostra o erro da API.
    } finally {
      setLoadingBoxes(false);
    }
  }, [isDemo]);

  useEffect(() => {
    queueMicrotask(async () => {
      if (isDemo) {
        setValues(oficinaToForm(legacyWorkshopToDto(getWorkshop())));
        setLoadingOficina(false);
        return;
      }
      setLoadingOficina(true);
      try {
        const dto = await api.oficina.get();
        setValues(oficinaToForm(dto));
      } catch {
        // O banner global já mostra o erro da API.
      } finally {
        setLoadingOficina(false);
      }
    });
    queueMicrotask(loadBoxes);
  }, [isDemo, loadBoxes]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      const dto = await api.oficina.update(payload);
      setValues(oficinaToForm(dto));
      await reloadOficina();
      showToast("Dados da oficina atualizados.");
    } catch {
      // Erro exibido pelo banner global da API.
    } finally {
      setSaving(false);
    }
  };

  const saveBox = async (payload) => {
    if (boxModal.box) {
      await api.boxes.update(boxModal.box.id, payload);
      showToast("Box atualizado.");
    } else {
      await api.boxes.create(payload);
      showToast("Box criado.");
    }
    await Promise.all([loadBoxes(), reloadOficina()]);
  };

  const toggleBox = async (box) => {
    try {
      await api.boxes.update(box.id, { ativo: !box.ativo });
      showToast(box.ativo ? `${box.nome} desativado.` : `${box.nome} reativado.`, box.ativo ? "warning" : "success");
      await Promise.all([loadBoxes(), reloadOficina()]);
    } catch {
      // Erro exibido pelo banner global da API.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav
          aria-label="Trilha"
          className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
        >
          Administração <ChevronRightIcon className="size-3" />{" "}
          <span className="text-blue-700">Configurações</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Configurações da Oficina</h1>
          {isDemo && <Badge variant="slate">Demonstração</Badge>}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Dados usados nos documentos impressos e nos boxes de atendimento. Disponível apenas para o administrador.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {loadingOficina ? (
            <p className="text-sm text-slate-500">Carregando dados da oficina...</p>
          ) : (
            <OficinaDadosCard
              values={values}
              setValues={setValues}
              readOnly={isDemo}
              saving={saving}
              onSave={handleSave}
            />
          )}
        </div>
        <BoxesCard
          boxes={boxes}
          loading={loadingBoxes}
          readOnly={isDemo}
          onCreate={() => setBoxModal({ open: true, box: null })}
          onEdit={(box) => setBoxModal({ open: true, box })}
          onToggle={toggleBox}
        />
      </div>

      {boxModal.open && (
        <BoxFormModal
          box={boxModal.box}
          onClose={() => setBoxModal({ open: false, box: null })}
          onSubmit={saveBox}
        />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

/** Converte o registro de impressão do modo demonstração no formato de `OficinaDTO`. */
function legacyWorkshopToDto(workshop) {
  return {
    nome: workshop.name,
    cnpj: workshop.document,
    telefone: workshop.phone,
    whatsapp: workshop.whatsapp,
  };
}

export default Configuracoes;
