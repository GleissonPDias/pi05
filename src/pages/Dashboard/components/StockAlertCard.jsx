import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCartIcon, TriangleAlertIcon } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import { buttonClassName } from "../../../components/ui/buttonStyles";
import Card from "../../../components/ui/Card";
import CardHeader from "../../../components/ui/CardHeader";
import { useEstoque } from "../../../hooks/useEstoque";
import { useOrdens } from "../../../hooks/useOrdens";
import { cn } from "../../../utils/cn";
import { reservedByCode, stockStatus } from "../../Estoque/estoqueUtils";

const levels = {
  urgent: { label: "URGENTE", badge: "red", bar: "bg-red-600" },
  low: { label: "BAIXO", badge: "slate", bar: "bg-slate-500" },
};

/** Os 3 itens mais críticos do estoque (dados ao vivo do almoxarifado). */
function useStockAlerts() {
  const { parts } = useEstoque();
  const { orders } = useOrdens();
  return useMemo(() => {
    const reserved = reservedByCode(orders);
    return parts
      .filter((part) => part.status === "ativo")
      .map((part) => ({ part, status: stockStatus(part, reserved.get(part.code)) }))
      .filter(({ status }) => status.key === "critico" || status.key === "baixo")
      // Críticos primeiro; depois, os mais distantes do mínimo
      .sort(
        (a, b) =>
          (a.status.key === "critico" ? 0 : 1) - (b.status.key === "critico" ? 0 : 1) ||
          a.status.available - a.part.minStock - (b.status.available - b.part.minStock),
      )
      .slice(0, 3)
      .map(({ part, status }) => ({
        id: part.code,
        name: part.description,
        code: part.code,
        current: Math.max(0, status.available),
        minimum: part.minStock,
        unit: part.unit,
        level: status.key === "critico" ? "urgent" : "low",
      }));
  }, [parts, orders]);
}

function StockAlertCard() {
  const items = useStockAlerts();
  return (
    <Card className="flex flex-col lg:col-span-2 xl:col-span-1">
      <CardHeader
        icon={TriangleAlertIcon}
        iconClassName="bg-red-100 text-red-600"
        title="Alerta de Estoque"
        subtitle="Itens com nível abaixo do estoque de segurança"
        action={<Badge variant="red">Crítico</Badge>}
      />

      <ul className="mt-4 flex flex-1 flex-col gap-3">
        {items.map((item) => {
          const level = levels[item.level];
          const percent = Math.min(
            100,
            Math.round((item.current / Math.max(1, item.minimum)) * 100),
          );

          return (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                <Badge variant={level.badge}>{level.label}</Badge>
              </div>
              <p className="text-xs text-slate-500">Cód: {item.code}</p>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Restam:{" "}
                  <strong className="text-slate-900">
                    {item.current} {item.unit}
                  </strong>
                </span>
                <span>
                  Mínimo:{" "}
                  <strong className="text-slate-900">{item.minimum}</strong>
                </span>
              </div>

              <div
                role="progressbar"
                aria-label={`Nível de estoque de ${item.name}`}
                aria-valuemin={0}
                aria-valuemax={item.minimum}
                aria-valuenow={item.current}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"
              >
                <div
                  className={cn("h-full rounded-full", level.bar)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        to="/estoque"
        state={{ cotacao: true }}
        className={buttonClassName({ size: "lg", fullWidth: true, className: "mt-4" })}
      >
        <ShoppingCartIcon className="size-4" />
        Repor Estoque / Pedido
      </Link>
    </Card>
  );
}

export default StockAlertCard;
