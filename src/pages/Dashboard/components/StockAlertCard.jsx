import { ShoppingCartIcon, TriangleAlertIcon } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import CardHeader from "../../../components/ui/CardHeader";
import { cn } from "../../../utils/cn";

const levels = {
  urgent: { label: "URGENTE", badge: "red", bar: "bg-red-600" },
  low: { label: "BAIXO", badge: "slate", bar: "bg-slate-500" },
};

function StockAlertCard({ items }) {
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
            Math.round((item.current / item.minimum) * 100),
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

      <Button fullWidth size="lg" icon={ShoppingCartIcon} className="mt-4">
        Repor Estoque / Pedido
      </Button>
    </Card>
  );
}

export default StockAlertCard;
