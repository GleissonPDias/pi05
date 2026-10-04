import { CircleCheckIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { cn } from "../../utils/cn";

const tones = {
  success: {
    icon: CircleCheckIcon,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  warning: {
    icon: TriangleAlertIcon,
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
};

/**
 * Aviso temporário no canto da tela. Use junto com o hook useToast.
 * `toast` é { message, tone } ou null.
 */
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { icon: Icon, className } = tones[toast.tone] ?? tones.success;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 left-4 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:left-auto sm:max-w-sm",
        "animate-modal-in motion-reduce:animate-none",
        className,
      )}
    >
      <Icon className="size-5 shrink-0" />
      <p className="min-w-0 flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="shrink-0 rounded p-1 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

export default Toast;
