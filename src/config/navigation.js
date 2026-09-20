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

/**
 * Fonte única da navegação: alimenta o menu lateral (Aside) e as rotas (App).
 * Para criar uma nova tela: adicione o item aqui e a rota correspondente no App.jsx.
 */
export const mainNav = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Agenda", to: "/agenda", icon: Calendar },
  { label: "Clientes", to: "/clientes", icon: UsersIcon },
  { label: "Veículos", to: "/veiculos", icon: CarFrontIcon },
  {
    label: "OS (Ordens de Serviço)",
    to: "/ordens-de-servico",
    icon: ClipboardList,
  },
  { label: "Orçamentos", to: "/orcamentos", icon: ScrollTextIcon },
  { label: "Estoque", to: "/estoque", icon: ArchiveIcon },
  { label: "Financeiro", to: "/financeiro", icon: TrendingUpIcon },
];

export const footerNav = [
  { label: "Configurações", to: "/configuracoes", icon: SettingsIcon },
  { label: "Ajuda / Suporte", to: "/ajuda", icon: CircleQuestionMarkIcon },
];
