import { PencilIcon, PlusIcon, PowerIcon, WarehouseIcon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import CardHeader from "../../components/ui/CardHeader";
import { cn } from "../../utils/cn";

/** Lista de boxes com ações de criar, editar e ativar/desativar. */
function BoxesCard({ boxes, loading, readOnly, onCreate, onEdit, onToggle }) {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        icon={WarehouseIcon}
        iconClassName="bg-amber-100 text-amber-700"
        title="Boxes de atendimento"
        subtitle="Espaços onde os veículos são atendidos."
        action={
          !readOnly && (
            <Button size="sm" variant="soft" icon={PlusIcon} onClick={onCreate}>
              Novo box
            </Button>
          )
        }
      />

      {loading && <p className="text-sm text-slate-500">Carregando boxes...</p>}

      {!loading && boxes.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
          Nenhum box cadastrado.
        </p>
      )}

      <ul className="divide-y divide-slate-100">
        {boxes.map((box) => (
          <li key={box.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className={cn("truncate font-bold", box.ativo ? "text-slate-900" : "text-slate-400 line-through")}>
                {box.nome}
              </p>
              {box.descricao && <p className="truncate text-xs text-slate-500">{box.descricao}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={box.ativo ? "green" : "slate"}>{box.ativo ? "Ativo" : "Inativo"}</Badge>
              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(box)}
                    aria-label={`Editar ${box.nome}`}
                    title="Editar"
                    className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(box)}
                    aria-label={box.ativo ? `Desativar ${box.nome}` : `Reativar ${box.nome}`}
                    title={box.ativo ? "Desativar" : "Reativar"}
                    className={cn(
                      "grid size-9 place-items-center rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      box.ativo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                    )}
                  >
                    <PowerIcon className="size-4" />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">
        Boxes desativados deixam de aparecer nas novas OS e agendamentos, mas preservam o histórico.
      </p>
    </Card>
  );
}

export default BoxesCard;
