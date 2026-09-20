import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../../components/ui/Card";
import CardHeader from "../../../components/ui/CardHeader";
import { formatBRL, formatK } from "../../../utils/format";

const axisTick = { fontSize: 12, fill: "#64748b" };

// Séries do gráfico: a ordem daqui define barras e legenda.
const series = [
  {
    key: "revenue",
    name: "Receitas Realizadas",
    color: "var(--color-chart-primary)",
  },
  {
    key: "expenses",
    name: "Despesas Operacionais",
    color: "var(--color-chart-muted)",
  },
];

function SummaryItem({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-2 sm:block sm:min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="flex flex-wrap items-baseline justify-end gap-x-1.5 text-base font-bold sm:justify-start sm:text-lg">
        {children}
      </p>
    </div>
  );
}

function WeeklyFinanceCard({ summary, days }) {
  return (
    <Card className="flex flex-col xl:col-span-2">
      <CardHeader
        title="Fluxo Financeiro Semanal"
        subtitle="Receitas vs Despesas (Últimos 7 dias)"
        action={
          <Link
            to="/financeiro"
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline"
          >
            Ir para o Financeiro
            <ChevronRightIcon className="size-3.5" />
          </Link>
        }
      />

      <div className="mt-4 grid gap-2 rounded-lg bg-blue-50 p-3 sm:grid-cols-3 sm:gap-4 sm:p-4">
        <SummaryItem label="Receita total">
          <span className="text-slate-900">
            {formatBRL(summary.revenue, 0)}
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            +{summary.revenueGrowth.toLocaleString("pt-BR")}%
          </span>
        </SummaryItem>
        <SummaryItem label="Despesas">
          <span className="text-emerald-800">
            {formatBRL(summary.expenses, 0)}
          </span>
        </SummaryItem>
        <SummaryItem label="Saldo líquido">
          <span className="text-blue-700">{formatBRL(summary.balance, 0)}</span>
        </SummaryItem>
      </div>

      <div
        className="relative mt-4 min-h-64 flex-1"
        role="img"
        aria-label="Gráfico de barras com receitas realizadas e despesas operacionais por dia da semana"
      >
        <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
          <BarChart
            data={days}
            barGap={2}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-chart-grid)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <YAxis
              domain={[0, "auto"]}
              tickCount={5}
              width={40}
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              tickFormatter={formatK}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              formatter={(value) => formatBRL(value)}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name}
                fill={item.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {series.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default WeeklyFinanceCard;
