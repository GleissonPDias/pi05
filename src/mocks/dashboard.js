/**
 * Dados fictícios do Dashboard.
 * TODO: substituir por chamadas à API (Spring Boot). O formato abaixo
 * já foi pensado para ser o mesmo da resposta esperada do backend.
 */
export const dashboardMock = {
  updatedAt: "14:32",

  weeklyFinance: {
    summary: {
      revenue: 38450,
      revenueGrowth: 14.2,
      expenses: 14820,
      balance: 23630,
    },
    days: [
      { day: "Seg", revenue: 4900, expenses: 1100 },
      { day: "Ter", revenue: 6200, expenses: 600 },
      { day: "Qua", revenue: 3900, expenses: 1400 },
      { day: "Qui", revenue: 6900, expenses: 900 },
      { day: "Sex", revenue: 8200, expenses: 1700 },
      { day: "Sáb", revenue: 1100, expenses: 800 },
      { day: "Dom", revenue: 300, expenses: 250 },
    ],
  },

  orderStatus: [
    {
      id: "running",
      label: "Em Execução",
      count: 14,
      fill: "var(--color-chart-primary)",
    },
    {
      id: "waiting-part",
      label: "Aguardando Peça",
      count: 8,
      fill: "var(--color-chart-slate)",
    },
    {
      id: "done",
      label: "Finalizada / Retirada",
      count: 6,
      fill: "var(--color-chart-success)",
    },
  ],

  // tone: "overdue" (vencida) | "upcoming" (prevista) — action: "whatsapp" | "call"
  returnOpportunities: {
    total: 3,
    items: [
      {
        id: 1,
        client: "João Silva",
        service: "Troca de Óleo e Filtros",
        vehicle: "Honda Civic",
        plate: "ABC-1234",
        tag: "Venceu há 2 dias",
        tone: "overdue",
        action: "whatsapp",
      },
      {
        id: 2,
        client: "Mariana Costa",
        service: "Revisão 40.000 km",
        vehicle: "Jeep Renegade",
        plate: "KXZ-9810",
        tag: "Previsão: Amanhã",
        tone: "upcoming",
        action: "call",
      },
      {
        id: 3,
        client: "Carlos Mendes",
        service: "Alinhamento e Balanceamento",
        vehicle: "Corolla",
        plate: "BRA-2E19",
        tag: "Venceu há 5 dias",
        tone: "overdue",
        action: "whatsapp",
      },
    ],
  },

  // statusKind: "sent" | "signature" | "negotiation"
  pendingQuotes: {
    total: 4,
    items: [
      {
        id: 1,
        client: "Roberto Alencar",
        value: 4850,
        description: "Ford Ranger 2022 • Troca de embreagem",
        status: "Enviado há 3h (Aguardando aprovação)",
        statusKind: "sent",
      },
      {
        id: 2,
        client: "Beatriz Souza",
        value: 1290,
        description: "VW T-Cross • Discos e Pastilhas",
        status: "Aguardando assinatura digital",
        statusKind: "signature",
      },
      {
        id: 3,
        client: "Marcos Vinicius",
        value: 870,
        description: "Chevrolet Onix • Coxim de motor",
        status: "Em negociação de peças",
        statusKind: "negotiation",
      },
    ],
  },

  // level: "urgent" | "low"
  stockAlerts: [
    {
      id: 1,
      name: "Pastilha Freio Diant. Cerâmica",
      code: "PF-2041",
      current: 2,
      minimum: 6,
      unit: "unid.",
      level: "urgent",
    },
    {
      id: 2,
      name: "Óleo Sintético SW30 1L",
      code: "OL-530S",
      current: 4,
      minimum: 15,
      unit: "frascos",
      level: "low",
    },
    {
      id: 3,
      name: "Filtro de Ar Onix/Tracker",
      code: "FA-882",
      current: 1,
      minimum: 5,
      unit: "unid.",
      level: "urgent",
    },
  ],
};
