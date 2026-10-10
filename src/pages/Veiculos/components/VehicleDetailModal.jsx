import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClockIcon,
  CarFrontIcon,
  CheckIcon,
  ClipboardListIcon,
  CopyIcon,
  GaugeIcon,
  HistoryIcon,
  MessageCircleIcon,
  PencilIcon,
  PhoneIcon,
  PrinterIcon,
  Share2Icon,
  WrenchIcon,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { buttonClassName } from "../../../components/ui/buttonStyles";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../../../components/ui/Modal";
import TextField from "../../../components/ui/TextField";
import { cn } from "../../../utils/cn";
import { formatDate, formatRelativeDays, formatTimeAgo } from "../../../utils/dates";
import { formatKm } from "../../../utils/format";
import { maskKm, maskPhone, onlyDigits, parseKm } from "../../../utils/masks";
import { getMaintenanceStatus, vehicleName, vehicleYears } from "../vehicleUtils";
import { MaintenanceBadge } from "./VehicleCells";
import MercosulPlate from "./MercosulPlate";

const headerAction =
  "rounded-lg p-1.5 text-slate-500 hover:bg-slate-900/5 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

function InfoCard({ icon: Icon, title, children, className }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <Icon className="size-3.5" />
        {title}
      </p>
      {children}
    </div>
  );
}

function SpecItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{children || "—"}</dd>
    </div>
  );
}

/** Copia um texto e avisa se o navegador não permitir. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Texto da próxima revisão: "50.000 km ou 15/11/2026". */
function nextReviewText(vehicle) {
  return (
    [
      vehicle.nextReviewKm ? formatKm(vehicle.nextReviewKm) : "",
      vehicle.nextReviewDate ? formatDate(vehicle.nextReviewDate) : "",
    ]
      .filter(Boolean)
      .join(" ou ") || "Não definida"
  );
}

/**
 * Pop-up com a ficha técnica e o histórico operacional do veículo.
 *
 * Props:
 * - vehicle: veículo exibido (sempre a versão mais recente da lista)
 * - owner: cliente proprietário (ou undefined)
 * - onUpdateMileage(id, km): grava a nova quilometragem
 * - onEdit(): abre o pop-up de edição
 * - onToast(message, tone): exibe um aviso na tela
 * - onClose(): fecha o pop-up
 */
function VehicleDetailModal({ vehicle, owner, onUpdateMileage, onEdit, onToast, onClose }) {
  const titleId = useId();
  const [editingKm, setEditingKm] = useState(false);
  const [km, setKm] = useState("");
  const [kmError, setKmError] = useState("");

  const status = getMaintenanceStatus(vehicle);
  const reviewOverdue = status === "overdue";
  const reviewKmLeft = vehicle.nextReviewKm ? vehicle.nextReviewKm - vehicle.mileage : null;

  const handlePrint = () => {
    // A classe faz o CSS de impressão esconder o resto da tela (ver index.css)
    document.body.classList.add("printing-dialog");
    try {
      window.print();
    } finally {
      document.body.classList.remove("printing-dialog");
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/veiculos?busca=${encodeURIComponent(vehicle.plate)}`;
    if (await copyText(link)) onToast("Link da ficha copiado para a área de transferência.");
    else onToast("Não foi possível copiar o link neste navegador.", "warning");
  };

  const handleCopyChassis = async () => {
    if (await copyText(vehicle.chassis)) onToast("Chassi copiado.");
    else onToast("Não foi possível copiar o chassi.", "warning");
  };

  const startEditingKm = () => {
    setKm(maskKm(String(vehicle.mileage)));
    setKmError("");
    setEditingKm(true);
  };

  const handleKmSubmit = (event) => {
    event.preventDefault();
    const value = parseKm(km);
    if (!onlyDigits(km)) {
      setKmError("Informe a quilometragem.");
    } else if (value < vehicle.mileage) {
      setKmError(`Não pode ser menor que a atual (${formatKm(vehicle.mileage)}).`);
    } else {
      onUpdateMileage(vehicle.id, value);
      onToast(`Quilometragem atualizada para ${formatKm(value)}.`);
      setEditingKm(false);
      return;
    }
    event.currentTarget.elements.namedItem("km")?.focus();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg">
      <ModalHeader
        icon={ClipboardListIcon}
        titleId={titleId}
        title={
          <>
            Ficha Técnica & Histórico Operacional{" "}
            <span className="whitespace-nowrap font-mono text-base text-blue-700">
              ID #{vehicle.id}
            </span>
          </>
        }
        subtitle={`Última atualização ${formatTimeAgo(vehicle.updatedAt)} por ${vehicle.updatedBy}`}
        actions={
          <>
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Imprimir ficha"
              title="Imprimir ficha"
              className={headerAction}
            >
              <PrinterIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Copiar link da ficha"
              title="Copiar link da ficha"
              className={headerAction}
            >
              <Share2Icon className="size-5" />
            </button>
          </>
        }
        onClose={onClose}
      />

      <ModalBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Coluna da esquerda: foto, odômetro e box */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-linear-to-br from-slate-200 to-slate-300">
              {vehicle.photoUrl ? (
                <img
                  src={vehicle.photoUrl}
                  alt={`Foto de ${vehicleName(vehicle)}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-slate-400">
                  <CarFrontIcon className="size-16" aria-hidden="true" />
                </div>
              )}
              <MaintenanceBadge vehicle={vehicle} className="absolute left-3 top-3 shadow-sm" />
              <MercosulPlate
                plate={vehicle.plate}
                size="lg"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md"
              />
            </div>

            <InfoCard icon={GaugeIcon} title="Odômetro atual">
              {editingKm ? (
                <form onSubmit={handleKmSubmit} noValidate className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <TextField
                      label="Nova quilometragem (km)"
                      inputMode="numeric"
                      autoComplete="off"
                      autoFocus
                      value={km}
                      onChange={(event) => {
                        setKm(maskKm(event.target.value));
                        setKmError("");
                      }}
                      error={kmError}
                      inputClassName="font-mono"
                      name="km"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-6.5">
                    <Button type="submit" size="sm" icon={CheckIcon}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingKm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-2xl font-extrabold text-slate-900">
                      {formatKm(vehicle.mileage)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Atualizado em {formatDate(vehicle.mileageUpdatedAt)}
                    </p>
                  </div>
                  <Button size="sm" variant="soft" icon={PencilIcon} onClick={startEditingKm} data-print-hide>
                    Atualizar Km
                  </Button>
                </div>
              )}
            </InfoCard>

            <InfoCard icon={WrenchIcon} title="Box & mecânico responsável">
              {vehicle.openOrder && vehicle.box ? (
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{vehicle.box.name}</p>
                  <p className="text-xs text-slate-600">
                    Mecânico: <strong>{vehicle.box.mechanic}</strong>
                  </p>
                  <Link
                    to={`/ordens-de-servico/${vehicle.openOrder}`}
                    className="text-xs font-semibold text-amber-700 hover:underline"
                  >
                    Em atendimento • OS #{vehicle.openOrder}
                  </Link>
                </div>
              ) : vehicle.openOrder ? (
                <p className="text-sm text-slate-600">
                  <Link
                    to={`/ordens-de-servico/${vehicle.openOrder}`}
                    className="font-semibold text-amber-700 hover:underline"
                  >
                    OS #{vehicle.openOrder} em andamento
                  </Link>
                  . O veículo está no pátio, fora dos boxes.
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  Nenhuma OS em andamento. O veículo não está em nenhum box da oficina.
                </p>
              )}
            </InfoCard>
          </div>

          {/* Coluna da direita: identificação, proprietário e ficha técnica */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  {vehicle.category || "Categoria não informada"}
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-tight text-slate-900">
                  {vehicleName(vehicle)}
                </p>
              </div>
              <Button size="sm" variant="outline" icon={PencilIcon} onClick={onEdit} className="shrink-0" data-print-hide>
                Editar
              </Button>
            </div>

            <InfoCard icon={CarFrontIcon} title="Proprietário">
              {owner ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/clientes?busca=${encodeURIComponent(owner.name)}`}
                      className="text-sm font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {owner.name}
                    </Link>
                    <p className="text-xs text-slate-600">{maskPhone(owner.phone)}</p>
                  </div>
                  <div className="flex gap-2">
                    {owner.hasWhatsapp && (
                      <a
                        href={`https://wa.me/55${owner.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClassName({ variant: "success", size: "sm" })}
                      >
                        <MessageCircleIcon className="size-3.5" />
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`tel:+55${owner.phone}`}
                      className={buttonClassName({ variant: "outline", size: "sm" })}
                    >
                      <PhoneIcon className="size-3.5" />
                      Ligar
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Sem proprietário vinculado. Use “Editar” para escolher um cliente.
                </p>
              )}
            </InfoCard>

            <section aria-label="Ficha técnica homologada">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-700">
                Ficha técnica homologada
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <SpecItem label="Ano (fab./modelo)">{vehicleYears(vehicle)}</SpecItem>
                <SpecItem label="Cor">{vehicle.color}</SpecItem>
                <SpecItem label="Combustível">{vehicle.fuel}</SpecItem>
                <SpecItem label="Motorização">{vehicle.engine}</SpecItem>
                <SpecItem label="Transmissão">{vehicle.transmission}</SpecItem>
                <SpecItem label="Chassi">
                  {vehicle.chassis ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="break-all font-mono text-xs">{vehicle.chassis}</span>
                      <button
                        type="button"
                        onClick={handleCopyChassis}
                        aria-label="Copiar chassi"
                        title="Copiar chassi"
                        className="shrink-0 rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <CopyIcon className="size-3.5" />
                      </button>
                    </span>
                  ) : null}
                </SpecItem>
              </dl>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard icon={HistoryIcon} title="Última passagem">
                {vehicle.lastService ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">
                      {vehicle.lastService.description}
                    </p>
                    <p className="text-xs text-slate-600">
                      {formatDate(vehicle.lastService.date)} •{" "}
                      {formatRelativeDays(vehicle.lastService.date).toLowerCase()}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Ainda não passou pela oficina.</p>
                )}
              </InfoCard>

              <InfoCard
                icon={CalendarClockIcon}
                title="Próxima revisão"
                className={reviewOverdue ? "border-red-200 bg-red-50" : undefined}
              >
                <p
                  className={cn(
                    "text-sm font-bold",
                    reviewOverdue ? "text-red-700" : "text-slate-900",
                  )}
                >
                  {nextReviewText(vehicle)}
                </p>
                <p className={cn("text-xs", reviewOverdue ? "font-semibold text-red-700" : "text-slate-600")}>
                  {reviewOverdue
                    ? "Revisão atrasada: agende o quanto antes."
                    : reviewKmLeft !== null
                      ? `Faltam ${formatKm(Math.max(reviewKmLeft, 0))}`
                      : "Acompanhe pelo plano de fábrica."}
                </p>
              </InfoCard>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="sm:justify-between">
        <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
          Fechar Janela
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            to={`/ordens-de-servico?visao=lista&status=todas&busca=${encodeURIComponent(vehicle.plate)}`}
            className={buttonClassName({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
          >
            <HistoryIcon className="size-4" />
            Histórico Completo ({vehicle.servicesCount})
          </Link>
          {vehicle.openOrder ? (
            <Link
              to={`/ordens-de-servico/${vehicle.openOrder}`}
              className={buttonClassName({ size: "lg", className: "w-full sm:w-auto" })}
            >
              <ClipboardListIcon className="size-4" />
              Ver OS #{vehicle.openOrder} em andamento
            </Link>
          ) : (
            <Link
              to="/ordens-de-servico"
              state={{ novaOs: { vehicleId: vehicle.id } }}
              className={buttonClassName({ size: "lg", className: "w-full sm:w-auto" })}
            >
              <ClipboardListIcon className="size-4" />
              Abrir Nova OS para este Veículo
            </Link>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}

export default VehicleDetailModal;
