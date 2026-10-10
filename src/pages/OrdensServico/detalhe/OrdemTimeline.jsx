import { useState } from "react";
import { HistoryIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatDateTimeShort } from "../ordemUtils";

const tones = {
  slate: "bg-slate-400",
  blue: "bg-blue-600",
  indigo: "bg-indigo-500",
  green: "bg-emerald-600",
  orange: "bg-orange-500",
  red: "bg-red-600",
};

const VISIBLE = 5;

/** Linha do tempo da OS (mais recente primeiro). */
function OrdemTimeline({ events }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...events].sort((a, b) => b.at.localeCompare(a.at));
  const shown = expanded ? sorted : sorted.slice(0, VISIBLE);

  return (
    <section aria-label="Linha do tempo da OS" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <HistoryIcon className="size-3.5" />
        Linha do tempo
      </h2>
      <ol className="mt-4 space-y-4">
        {shown.map((event, index) => (
          <li key={event.id} className="relative flex gap-3">
            {index < shown.length - 1 && (
              <span aria-hidden="true" className="absolute left-[5px] top-4 h-[calc(100%+0.5rem)] w-px bg-slate-200" />
            )}
            <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-white", tones[event.tone] ?? tones.blue)} />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-slate-800">{event.text}</p>
              <p className="text-[11px] text-slate-500">
                {formatDateTimeShort(event.at)} • {event.by}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {sorted.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 text-xs font-bold text-blue-700 hover:underline"
        >
          {expanded ? "Mostrar menos" : `Ver todos (${sorted.length})`}
        </button>
      )}
    </section>
  );
}

export default OrdemTimeline;
