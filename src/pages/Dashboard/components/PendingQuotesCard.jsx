import { HandshakeIcon, PenLineIcon, ReceiptTextIcon, SendIcon } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import CardHeader from "../../../components/ui/CardHeader";
import { formatBRL } from "../../../utils/format";

const statusIcons = {
  sent: SendIcon,
  signature: PenLineIcon,
  negotiation: HandshakeIcon,
};

function PendingQuotesCard({ total, items }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={ReceiptTextIcon}
        title="Orçamentos Pendentes"
        subtitle="Propostas enviadas aguardando validação"
        action={<Badge>{total} pendentes</Badge>}
      />

      <ul className="mt-4 flex flex-1 flex-col gap-3">
        {items.map((item) => {
          const StatusIcon = statusIcons[item.statusKind];

          return (
            <li key={item.id} className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">
                  {item.client}
                </p>
                <span className="shrink-0 text-sm font-bold text-blue-700">
                  {formatBRL(item.value)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                {item.description}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                {StatusIcon && (
                  <StatusIcon className="size-3.5 shrink-0 text-slate-500" />
                )}
                {item.status}
              </p>
            </li>
          );
        })}
      </ul>

      <Button variant="soft" fullWidth className="mt-4">
        Gerenciar Orçamentos &gt;
      </Button>
    </Card>
  );
}

export default PendingQuotesCard;
