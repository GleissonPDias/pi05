import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { cn } from "../../utils/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizes = {
  md: "max-w-xl",
  lg: "max-w-5xl",
};

/**
 * Pop-up (modal) padrão do sistema.
 *
 * Como usar: renderize o componente SOMENTE enquanto o modal estiver aberto
 * (`{isOpen && <Modal ...>}`). Ao montar ele trava a rolagem da página e move o
 * foco para dentro; ao desmontar, devolve o foco ao elemento anterior.
 *
 * Acessibilidade: role="dialog", aria-modal, fecha com Esc, mantém o Tab
 * dentro do modal. Para escolher o campo que recebe o foco inicial, use o
 * atributo `data-autofocus` (padrão: o próprio modal).
 *
 * Props:
 * - onClose: chamado ao pressionar Esc, clicar no X ou (se permitido) no fundo
 * - labelledBy: id do título (aria-labelledby)
 * - size: "md" | "lg" (largura máxima)
 * - closeOnOverlay: fecha ao clicar no fundo escuro (use false em formulários)
 */
function Modal({
  onClose,
  labelledBy,
  size = "lg",
  closeOnOverlay = true,
  children,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Se o foco se perder (ex.: o botão clicado saiu da tela), o teclado continua
  // funcionando: Esc fecha o pop-up do topo e Tab devolve o foco para dentro dele.
  useEffect(() => {
    const handleDocumentKeyDown = (event) => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(event.target)) return; // o próprio modal já trata

      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== dialog) return; // só o modal do topo

      if (event.key === "Escape") {
        onCloseRef.current();
      } else if (event.key === "Tab") {
        event.preventDefault();
        (dialog.querySelector(FOCUSABLE) ?? dialog).focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    (dialog.querySelector("[data-autofocus]") ?? dialog).focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    // Mantém o foco circulando dentro do modal
    const focusable = [
      ...dialogRef.current.querySelectorAll(FOCUSABLE),
    ].filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      data-modal-overlay
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-6"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none",
          "animate-modal-in motion-reduce:animate-none",
          sizes[size],
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Cabeçalho do modal: [ícone] título / subtítulo ........ [X] */
export function ModalHeader({
  icon: Icon,
  iconClassName = "bg-blue-100 text-blue-600",
  titleId,
  title,
  subtitle,
  badge,
  actions,
  onClose,
  className,
  subtitleClassName,
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            iconClassName,
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id={titleId}
            className="text-lg font-bold leading-tight text-slate-900"
          >
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className={cn("mt-0.5 text-sm text-slate-600", subtitleClassName)}>
            {subtitle}
          </p>
        )}
      </div>
      {/* actions: botões extras antes do X (ex.: imprimir, compartilhar) */}
      <div data-print-hide className="-mr-1 flex shrink-0 items-center gap-0.5">
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900/5 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <XIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}

/** Área central do modal (rola quando o conteúdo é maior que a tela). */
export function ModalBody({ className, children }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

/** Rodapé com os botões de ação (empilhados no celular, à direita no desktop). */
export function ModalFooter({ className, children }) {
  return (
    <div
      data-print-hide
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Modal;
