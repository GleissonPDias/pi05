import { cn } from "../../../utils/cn";

function Indicator({ dot, label, value }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
      <span className={cn("size-2.5 rounded-full", dot)} />
      {label}: {value}
    </span>
  );
}

function Shortcut({ keys, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
        {keys}
      </kbd>
      {label}
    </span>
  );
}

/** Rodapé do quadro: ocupação dos boxes, OS aguardando peças e atalhos. */
function PatioFooter({ stats }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-live="polite">
        <Indicator dot="bg-emerald-600" label="Boxes Livres" value={`${stats.boxesTotal - stats.boxesBusy}/${stats.boxesTotal}`} />
        <Indicator dot="bg-blue-600" label="Boxes Ocupados" value={`${stats.boxesBusy}/${stats.boxesTotal}`} />
        <Indicator dot="bg-orange-500" label="Aguardando Peças" value={`${stats.waitingParts} OS`} />
        {stats.overdue > 0 && <Indicator dot="bg-red-600" label="Atrasadas" value={`${stats.overdue} OS`} />}
      </div>
      <div className="hidden flex-wrap items-center gap-4 lg:flex" aria-label="Atalhos de teclado">
        <Shortcut keys="N" label="Nova OS" />
        <Shortcut keys="F" label="Buscar" />
        <Shortcut keys="Arrastar" label="Mover etapa" />
      </div>
    </div>
  );
}

export default PatioFooter;
