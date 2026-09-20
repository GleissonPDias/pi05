import {
  CircleDollarSignIcon,
  FilePlus2Icon,
  PackagePlusIcon,
  UserPlusIcon,
} from "lucide-react";

const actions = [
  {
    label: "+ Novo Cliente",
    description: "Cadastrar proprietário",
    icon: UserPlusIcon,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  {
    label: "+ Nova OS",
    description: "Abrir ordem de serviço",
    icon: FilePlus2Icon,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  {
    label: "+ Criar Orçamento",
    description: "Precificar peças e mão de obra",
    icon: CircleDollarSignIcon,
    iconClassName: "bg-emerald-500 text-white",
  },
  {
    label: "+ Cadastrar Peça",
    description: "Entrada rápida no estoque",
    icon: PackagePlusIcon,
    iconClassName: "bg-slate-100 text-slate-600",
  },
];

function QuickActions() {
  return (
    <section
      aria-label="Ações rápidas"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {actions.map(({ label, description, icon: Icon, iconClassName }) => (
        <button
          key={label}
          type="button"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-full ${iconClassName}`}
          >
            <Icon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">
              {label}
            </span>
            <span className="block text-xs leading-snug text-slate-500">
              {description}
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}

export default QuickActions;
