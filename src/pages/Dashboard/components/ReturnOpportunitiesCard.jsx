import { CalendarClockIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import CardHeader from "../../../components/ui/CardHeader";
import { cn } from "../../../utils/cn";

function ReturnOpportunitiesCard({ total, items }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={CalendarClockIcon}
        title="Oportunidades de Retorno"
        subtitle="Clientes com revisões periódicas previstas"
        action={<Badge>{total} contatos</Badge>}
      />

      <ul className="mt-4 flex flex-1 flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg bg-blue-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{item.client}</p>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-bold",
                  item.tone === "overdue" ? "text-red-600" : "text-emerald-700",
                )}
              >
                {item.tag}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {item.service} • {item.vehicle} ({item.plate})
            </p>
            <div className="mt-2 flex justify-end">
              {item.action === "whatsapp" ? (
                <Button size="sm" variant="success" icon={MessageCircleIcon}>
                  Contatar WhatsApp
                </Button>
              ) : (
                <Button size="sm" variant="neutral" icon={PhoneIcon}>
                  Ligar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Button variant="soft" fullWidth className="mt-4">
        Ver todos os retornos &gt;
      </Button>
    </Card>
  );
}

export default ReturnOpportunitiesCard;
