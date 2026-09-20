import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import Card from "../../../components/ui/Card";
import CardHeader from "../../../components/ui/CardHeader";

function OrderStatusCard({ items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Status das OS Atuais"
        subtitle={`${total} ordens de serviço ativas no pátio`}
        action={
          <span
            title="Atualização em tempo real"
            className="size-2.5 shrink-0 rounded-full bg-emerald-500"
          />
        }
      />

      <div
        className="relative mx-auto mt-4 h-52 w-52 max-w-full"
        role="img"
        aria-label={`Gráfico de rosca com ${total} ordens de serviço em aberto, separadas por status`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="count"
              nameKey="label"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            />
            <Tooltip
              formatter={(value) => `${value} OS`}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold leading-none text-slate-900">
            {total}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Total em aberto
          </span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-bold text-slate-900">
              {item.count} OS ({Math.round((item.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>

      <Link
        to="/ordens-de-servico"
        className="mt-auto inline-flex items-center justify-center gap-0.5 pt-4 text-xs font-semibold text-blue-600 hover:underline"
      >
        Ver painel Kanban de OS
        <ChevronRightIcon className="size-3.5" />
      </Link>
    </Card>
  );
}

export default OrderStatusCard;
