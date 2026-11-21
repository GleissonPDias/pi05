import logo from "../../assets/brand/logo-salvo-print.png";
import { useAuth } from "../../hooks/useAuth";
import { useOficina } from "../../hooks/useOficina";

// Carrega a logo de impressão já na abertura do sistema (evita página sem logo)
if (typeof Image !== "undefined") new Image().src = logo;

/**
 * Cabeçalho padrão dos documentos impressos (OS, comprovante, proposta,
 * pedido de compra): logo + dados da oficina + tipo e número do documento.
 */
function PrintHeader({ kind, number, children }) {
  const { user } = useAuth();
  const { workshop } = useOficina();
  const workshopName = workshop.name || user?.workshopName;
  const logoSrc = workshop.logoUrl || logo;
  const accent = workshop.corPrimaria || "#000000";

  return (
    <header className="flex items-center justify-between gap-6 border-b-2 pb-3" style={{ borderColor: accent }}>
      <div className="flex items-center gap-4">
        <img src={logoSrc} alt={workshopName} className="h-16 w-auto rounded-md object-contain" />
        <div>
          <p className="text-sm font-extrabold">{workshopName}</p>
          <p className="text-[10px]">CNPJ {workshop.document}</p>
          <p className="text-[10px]">{workshop.address}</p>
          <p className="text-[10px]">Tel. {workshop.phone} • WhatsApp {workshop.whatsapp}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-bold uppercase">{kind}</p>
        <p className="text-2xl font-extrabold">{number}</p>
        {children}
      </div>
    </header>
  );
}

export default PrintHeader;
