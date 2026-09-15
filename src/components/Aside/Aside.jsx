import {
  ArchiveIcon,
  Calendar,
  CarFrontIcon,
  CircleQuestionMarkIcon,
  ClipboardList,
  LayoutDashboard,
  ScrollTextIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import "./styles.css";
import AsideButtons from "./ButtonAside";

function Aside() {
  return (
    <aside className="bg-[#213145] flex flex-col box-border p-4 max-w-70 h-screen gap-8">
      <div className="flex gap-3 text-left">
        <div className="bg-amber-50 p-1">
          <img src="./public/favicon.svg"></img>
        </div>
        <div>
          <p className="font-bold">Salvô</p>
          <p>GESTÃO AUTOMOTIVA</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <AsideButtons label="Dashboard" icon={<LayoutDashboard />} />
        <AsideButtons label="Agenda" icon={<Calendar />} />
        <AsideButtons label="Clientes" icon={<UsersIcon />} />
        <AsideButtons label="Veículos" icon={<CarFrontIcon />} />
        <AsideButtons label="OS (Ordens de Serviço)" icon={<ClipboardList />} />
        <AsideButtons label="Orçamentos" icon={<ScrollTextIcon />} />
        <AsideButtons label="Estoque" icon={<ArchiveIcon />} />
        <AsideButtons label="Financeiro" icon={<TrendingUpIcon />} />
      </div>
      <div className="mt-auto flex flex-col gap-4 pt-4 border-t border-slate-700">
        <AsideButtons label="Configurações" icon={<SettingsIcon />} />
        <AsideButtons
          label="Ajuda / Suporte"
          icon={<CircleQuestionMarkIcon />}
        />
      </div>
    </aside>
  );
}

export default Aside;
