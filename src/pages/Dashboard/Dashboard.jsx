import { useState } from "react";
import { dashboardMock } from "../../mocks/dashboard";
import DashboardHeader from "./components/DashboardHeader";
import OrderStatusCard from "./components/OrderStatusCard";
import PendingQuotesCard from "./components/PendingQuotesCard";
import QuickActions from "./components/QuickActions";
import ReturnOpportunitiesCard from "./components/ReturnOpportunitiesCard";
import StockAlertCard from "./components/StockAlertCard";
import WeeklyFinanceCard from "./components/WeeklyFinanceCard";

function Dashboard() {
  // TODO: quando a API estiver pronta, o período selecionado deve
  // ser enviado na requisição e os dados abaixo virão da resposta.
  const [period, setPeriod] = useState("today");
  const data = dashboardMock;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        updatedAt={data.updatedAt}
        period={period}
        onPeriodChange={setPeriod}
      />

      <QuickActions />

      <div className="grid gap-6 xl:grid-cols-3">
        <WeeklyFinanceCard
          summary={data.weeklyFinance.summary}
          days={data.weeklyFinance.days}
        />
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
