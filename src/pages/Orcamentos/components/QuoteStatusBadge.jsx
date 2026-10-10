import { cn } from "../../../utils/cn";
import { QUOTE_STATUS } from "../constants";
import { displayStatus } from "../quoteUtils";

/** Pílula com a situação comercial do orçamento. */
function QuoteStatusBadge({ quote, className }) {
  const item = QUOTE_STATUS[displayStatus(quote)];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        item.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", item.dot)} />
      {item.label}
    </span>
  );
}

export default QuoteStatusBadge;
