import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useClientes } from "../../hooks/useClientes";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { useOrdens } from "../../hooks/useOrdens";
import { useVeiculos } from "../../hooks/useVeiculos";
import { dashboardMock } from "../../mocks/dashboard";
import { useWeeklyFinance } from "./useWeeklyFinance";
import DashboardHeader from "./components/DashboardHeader";
import OrderStatusCard from "./components/OrderStatusCard";
import PendingQuotesCard from "./components/PendingQuotesCard";
import QuickActions from "./components/QuickActions";
import ReturnOpportunitiesCard from "./components/ReturnOpportunitiesCard";
import StockAlertCard from "./components/StockAlertCard";
import WeeklyFinanceCard from "./components/WeeklyFinanceCard";

function useDynamicDashboard() {
  const { isDemo, isAdmin } = useAuth();
  const weeklyFinance = useWeeklyFinance(!isDemo && isAdmin);
  const { orders } = useOrdens();
  const { quotes } = useOrcamentos();
  const { vehicles } = useVeiculos();
  const { clients } = useClientes();

  return useMemo(() => {
    if (isDemo) {
      return dashboardMock;
    }

    const clientMap = new Map(clients.map((c) => [String(c.id), c]));
    const vehicleMap = new Map(vehicles.map((v) => [String(v.id), v]));

    // 1. Status das Ordens de Serviço
    const runningCount = orders.filter(
      (o) => o.status === "em_execucao" || o.status === "em_teste",
    ).length;
    const waitingPartCount = orders.filter(
      (o) => o.status === "aguardando_peca" || o.status === "aguardando_aprovacao",
    ).length;
    const diagnosticoCount = orders.filter(
      (o) => o.status === "aberta" || o.status === "em_diagnostico",
    ).length;
    const doneCount = orders.filter((o) => o.status === "concluida").length;

    const orderStatus = [
      {
        id: "running",
        label: "Em Execução / Teste",
        count: runningCount,
        fill: "var(--color-chart-primary, #2563eb)",
      },
      {
        id: "waiting-part",
        label: "Aguardando Peça / Aprovação",
        count: waitingPartCount,
        fill: "var(--color-chart-slate, #64748b)",
      },
      {
        id: "diagnostico",
        label: "Em Diagnóstico / Aberta",
        count: diagnosticoCount,
        fill: "#f59e0b",
      },
      {
        id: "done",
        label: "Finalizada / Retirada",
        count: doneCount,
        fill: "var(--color-chart-success, #10b981)",
      },
    ];

    const now = new Date();

    // 3. Oportunidades de Retorno
    const returnItems = [];
    vehicles.forEach((vehicle) => {
      const client = clientMap.get(String(vehicle.ownerId));
      if (vehicle.nextReviewDate) {
        const diffDays = Math.ceil(
          (new Date(vehicle.nextReviewDate) - now) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = diffDays < 0;
        returnItems.push({
          id: vehicle.id,
          client: client?.name || "Cliente",
          service: "Revisão Periódica",
          vehicle: `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Veículo",
          plate: vehicle.plate || "S/ Placa",
          tag: isOverdue ? `Venceu há ${Math.abs(diffDays)} dias` : `Previsão: ${diffDays} dias`,
          tone: isOverdue ? "overdue" : "upcoming",
          action: client?.phone ? "whatsapp" : "call",
        });
      }
    });

    const returnOpportunities = {
      total: returnItems.length,
      items: returnItems.slice(0, 5),
    };

    // 4. Orçamentos Pendentes
    const pendingList = quotes
      .filter((q) => q.status === "enviado" || q.status === "rascunho")
      .map((q) => {
        const client = clientMap.get(String(q.clientId));
        const vehicle = vehicleMap.get(String(q.vehicleId));
        const partsVal = (q.parts || []).reduce(
          (sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 1),
          0,
        );
        const servVal = (q.services || []).reduce(
          (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 1),
          0,
        );
        const total = partsVal + servVal;

        return {
          id: q.id,
          client: client?.name || "Cliente",
          value: total,
          description: `${vehicle ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() : "Veículo"} • ${q.title || "Orçamento"}`,
          status: q.status === "enviado" ? `Enviado (${q.sentChannel || "WhatsApp"})` : "Rascunho",
          statusKind: q.status === "enviado" ? "sent" : "signature",
        };
      });

    const pendingQuotes = {
      total: pendingList.length,
      items: pendingList.slice(0, 5),
    };

    const currentTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return {
      updatedAt: currentTime,
      weeklyFinance,
      orderStatus,
      returnOpportunities,
      pendingQuotes,
    };
  }, [isDemo, orders, quotes, vehicles, clients, weeklyFinance]);
}

function Dashboard() {
  const [period, setPeriod] = useState("today");
  const { isAdmin } = useAuth();
  const data = useDynamicDashboard();

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        updatedAt={data.updatedAt}
        period={period}
        onPeriodChange={setPeriod}
      />

      <QuickActions />

      <div className={isAdmin ? "grid gap-6 xl:grid-cols-3" : "grid gap-6"}>
        {isAdmin && (
          <WeeklyFinanceCard
            summary={data.weeklyFinance.summary}
            days={data.weeklyFinance.days}
          />
        )}
        <OrderStatusCard items={data.orderStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ReturnOpportunitiesCard
          total={data.returnOpportunities.total}
          items={data.returnOpportunities.items}
        />
        <PendingQuotesCard
          total={data.pendingQuotes.total}
          items={data.pendingQuotes.items}
        />
        <StockAlertCard />
      </div>
    </div>
  );
}

export default Dashboard;
