import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useClientes } from "../../hooks/useClientes";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { useOrdens } from "../../hooks/useOrdens";
import { useVeiculos } from "../../hooks/useVeiculos";
import { dashboardMock } from "../../mocks/dashboard";
import { downloadCsv } from "../../utils/csv";
import DashboardHeader from "./components/DashboardHeader";
import { useWeeklyFinance } from "./useWeeklyFinance";
import OrderStatusCard from "./components/OrderStatusCard";
import PendingQuotesCard from "./components/PendingQuotesCard";
import QuickActions from "./components/QuickActions";
import ReturnOpportunitiesCard from "./components/ReturnOpportunitiesCard";
import StockAlertCard from "./components/StockAlertCard";
import WeeklyFinanceCard from "./components/WeeklyFinanceCard";

function useDynamicDashboard(period = "today") {
  const { isDemo: demoMode, isAdmin } = useAuth();
  const weeklyFinance = useWeeklyFinance(!demoMode && isAdmin, period === "today" ? 1 : period === "month" ? 30 : 7);
  const { orders } = useOrdens();
  const { quotes } = useOrcamentos();
  const { vehicles } = useVeiculos();
  const { clients } = useClientes();

  return useMemo(() => {
    if (demoMode) {
      return dashboardMock;
    }

    const clientMap = new Map(clients.map((c) => [String(c.id), c]));
    const vehicleMap = new Map(vehicles.map((v) => [String(v.id), v]));

    // 1. Status das Ordens de Serviço
    const runningCount = orders.filter(
      (o) => o.status === "execucao" || o.status === "pronta",
    ).length;
    const waitingPartCount = orders.filter(
      (o) => o.status === "aguardando_pecas" || o.status === "aprovacao",
    ).length;
    const diagnosticoCount = orders.filter(
      (o) => o.status === "aberta" || o.status === "orcamento",
    ).length;
    const doneCount = orders.filter((o) => o.status === "entregue").length;

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
    const periodStart = (() => {
      const d = new Date(now);
      if (period === "today") {
        d.setHours(0, 0, 0, 0);
        return d;
      }
      if (period === "7days") {
        d.setDate(d.getDate() - 6);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      if (period === "month") {
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      return new Date(0);
    })();
    const inPeriod = (dateValue) => {
      if (!dateValue) return true;
      const d = new Date(dateValue);
      return !Number.isNaN(d.getTime()) && d >= periodStart && d <= now;
    };


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
    const periodQuotes = quotes.filter((q) => inPeriod(q.issuedAt ?? q.criadoEm));
    const pendingList = periodQuotes
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
  }, [demoMode, orders, quotes, vehicles, clients, weeklyFinance, period]);
}

function Dashboard() {
  const [period, setPeriod] = useState("today");
  const { isAdmin } = useAuth();
  const data = useDynamicDashboard(period);

  const handleExport = () => {
    const rows = [];
    // Fluxo financeiro
    data.weeklyFinance.days.forEach((day) => {
      rows.push(["Fluxo Financeiro", day.day, "Receita", day.revenue]);
      rows.push(["Fluxo Financeiro", day.day, "Despesa", day.expenses]);
    });
    rows.push(["Fluxo Financeiro", "Total", "Receita", data.weeklyFinance.summary.revenue]);
    rows.push(["Fluxo Financeiro", "Total", "Despesa", data.weeklyFinance.summary.expenses]);
    rows.push(["Fluxo Financeiro", "Total", "Saldo", data.weeklyFinance.summary.balance]);
    // Status das OS
    data.orderStatus.forEach((item) => {
      rows.push(["Status das OS", item.label, "Quantidade", item.count]);
    });
    downloadCsv("dashboard.csv", ["Seção", "Item", "Métrica", "Valor"], rows);
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        updatedAt={data.updatedAt}
        period={period}
        onPeriodChange={setPeriod}
        onExport={handleExport}
      />

      <QuickActions />

      <div className={isAdmin ? "grid gap-6 xl:grid-cols-3" : "grid gap-6"}>
        {isAdmin && (
          <WeeklyFinanceCard
            period={period}
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
