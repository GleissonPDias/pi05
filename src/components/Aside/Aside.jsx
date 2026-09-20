import { useEffect } from "react";
import { XIcon } from "lucide-react";
import { footerNav, mainNav } from "../../config/navigation";
import { cn } from "../../utils/cn";
import AsideButtons from "./ButtonAside";

/**
 * Menu lateral.
 * - lg+: fixo e sempre visível.
 * - Abaixo de lg: gaveta deslizante (controlada por isOpen/onClose) com overlay.
 */
function Aside({ isOpen, onClose }) {
  // Fecha a gaveta com a tecla Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay (somente mobile/tablet) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/60 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="menu-lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-70 flex-col gap-8 overflow-y-auto bg-sidebar p-4 text-white",
          "transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:shrink-0 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="rounded bg-amber-50 p-1">
            <img src="/favicon.svg" alt="" className="size-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">Salvô</p>
            <p className="text-[11px] tracking-wider text-slate-300">
              GESTÃO AUTOMOTIVA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <nav aria-label="Menu principal" className="flex flex-col gap-2">
          {mainNav.map((item) => (
            <AsideButtons key={item.to} {...item} onClick={onClose} />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-700 pt-4">
          {footerNav.map((item) => (
            <AsideButtons key={item.to} {...item} onClick={onClose} />
          ))}
        </div>
      </aside>
    </>
  );
}

export default Aside;
