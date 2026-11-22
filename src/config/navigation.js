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
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

/**
 * Fonte única da navegação: alimenta o menu lateral (Aside) e as rotas (App).
 * Para criar uma nova tela: adicione o item aqui e a rota correspondente no App.jsx.
 */
export const mainNav = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Agenda", to: "/agenda", icon: Calendar, permission: "AGENDA" },
  { label: "Clientes", to: "/clientes", icon: UsersIcon, permission: "CLIENTES" },
  { label: "Veículos", to: "/veiculos", icon: CarFrontIcon, permission: "VEICULOS" },
  {
    label: "OS (Ordens de Serviço)",
    to: "/ordens-de-servico",
    icon: ClipboardList,
    permission: "OS",
    // Submenu (aparece quando a tela está aberta). `view` = valor de ?visao=;
    // sem `view`, o subitem é uma página própria (ex.: Serviços)
    children: [
      { label: "Quadro Kanban", to: "/ordens-de-servico", view: "quadro" },
      { label: "Lista de OS", to: "/ordens-de-servico?visao=lista", view: "lista" },
      { label: "Serviços", to: "/ordens-de-servico/servicos" },
    ],
    // Itens dinâmicos: "Detalhes OS #1042" quando uma OS está aberta
    detailLabel: "Detalhes OS",
  },
  { label: "Orçamentos", to: "/orcamentos", icon: ScrollTextIcon, permission: "ORCAMENTOS" },
  {
    label: "Estoque",
    to: "/estoque",
    icon: ArchiveIcon,
    permission: "ESTOQUE",
    children: [
      { label: "Inventário", to: "/estoque", view: "inventario" },
      { label: "Movimentações", to: "/estoque?visao=movimentacoes", view: "movimentacoes" },
    ],
  },
  { label: "Financeiro", to: "/financeiro", icon: TrendingUpIcon, adminOnly: true, permission: "FINANCEIRO" },
  { label: "Equipe", to: "/equipe", icon: UserCogIcon, adminOnly: true },
];

export const footerNav = [
  { label: "Configurações", to: "/configuracoes", icon: SettingsIcon, adminOnly: true },
  { label: "Ajuda / Suporte", to: "/ajuda", icon: CircleQuestionMarkIcon },
];
