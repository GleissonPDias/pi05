import { formatBRL } from "../../utils/format";

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const formatHours = (hours) => `${Number(hours || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
const sumQty = (parts) => parts.reduce((sum, line) => sum + Number(line.qty || 0), 0);

/** Título da seção com o contador de itens à direita. */
function SectionTitle({ title, count }) {
  return (
    <div className="mb-1.5 flex items-end justify-between border-b-2 border-black pb-0.5">
      <h2 className="text-[11px] font-bold uppercase tracking-wide">{title}</h2>
      <span className="text-[10px] font-semibold">{count}</span>
    </div>
  );
}

/** Rodapé da tabela: resumo da quantidade à esquerda e subtotal à direita. */
function TableFooter({ colSpan, summary, label, value }) {
  return (
    <tfoot>
      <tr className="border-t-2 border-black bg-gray-100 font-bold">
        <td colSpan={colSpan} className="px-1.5 py-1">{summary}</td>
        <td colSpan={2} className="whitespace-nowrap px-1.5 py-1 text-right">
          {label}: {formatBRL(value)}
        </td>
      </tr>
    </tfoot>
  );
}

const th = "px-1.5 py-1 font-bold";
const td = "px-1.5 py-1 align-top";

/**
 * Faixa-resumo com a contagem de itens do documento (OS ou orçamento).
 * Ex.: "3 serviços (4,5 h de mão de obra) · 6 peças/produtos (9 unidades)"
 */
export function PrintItemsSummary({ services, parts }) {
  const hours = services.reduce((sum, line) => sum + Number(line.hours || 0), 0);
  return (
    <div className="mt-4 flex break-inside-avoid divide-x divide-gray-400 border border-gray-400 text-[10px]">
      <p className="flex-1 px-2 py-1.5">
        <span className="block text-[9px] font-bold uppercase text-gray-600">Mão de obra</span>
        <strong className="text-xs">{plural(services.length, "serviço", "serviços")}</strong>
        {services.length > 0 && <> · {formatHours(hours)} estimadas</>}
      </p>
      <p className="flex-1 px-2 py-1.5">
        <span className="block text-[9px] font-bold uppercase text-gray-600">Peças e produtos</span>
        <strong className="text-xs">{plural(parts.length, "item", "itens")}</strong>
        {parts.length > 0 && <> · {plural(sumQty(parts), "unidade", "unidades")}</>}
      </p>
      <p className="flex-1 px-2 py-1.5">
        <span className="block text-[9px] font-bold uppercase text-gray-600">Total de linhas</span>
        <strong className="text-xs">{services.length + parts.length}</strong> no documento
      </p>
    </div>
  );
}

/**
 * Tabela de serviços (mão de obra) para documentos impressos.
 * - mechanicName: função (id) => nome; quando informada, mostra a coluna "Mecânico"
 */
export function ServicesPrintTable({ services, mechanicName, title = "Serviços / mão de obra" }) {
  const total = services.reduce((sum, line) => sum + Number(line.price || 0), 0);
  const hours = services.reduce((sum, line) => sum + Number(line.hours || 0), 0);
  const showMechanic = Boolean(mechanicName);
  const cols = showMechanic ? 6 : 5;

  return (
    <section className="mt-4">
      <SectionTitle title={title} count={plural(services.length, "serviço", "serviços")} />
      <table className="w-full border-collapse text-[10.5px]">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className={`${th} w-6 text-center`}>#</th>
            <th className={`${th} w-16`}>Código</th>
            <th className={th}>Serviço</th>
            {showMechanic && <th className={`${th} w-28`}>Mecânico</th>}
            <th className={`${th} w-14 text-center`}>Tempo</th>
            <th className={`${th} w-24 text-right`}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {services.map((line, index) => (
            <tr key={line.id} className="break-inside-avoid border-b border-gray-300 even:bg-gray-50">
              <td className={`${td} text-center font-bold`}>{index + 1}</td>
              <td className={`${td} font-mono`}>{line.code || "—"}</td>
              <td className={td}>
                {line.description}
                {line.detail && <span className="block text-[9.5px] text-gray-600">{line.detail}</span>}
              </td>
              {showMechanic && <td className={td}>{mechanicName(line.mechanicId) || "A definir"}</td>}
              <td className={`${td} text-center`}>{formatHours(line.hours)}</td>
              <td className={`${td} text-right`}>{formatBRL(Number(line.price || 0))}</td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr>
              <td colSpan={cols} className={`${td} text-center text-gray-600`}>Nenhum serviço adicionado.</td>
            </tr>
          )}
        </tbody>
        {services.length > 0 && (
          <TableFooter
            colSpan={cols - 2}
            summary={`${plural(services.length, "serviço", "serviços")} · ${formatHours(hours)} de mão de obra`}
            label="Subtotal mão de obra"
            value={total}
          />
        )}
      </table>
    </section>
  );
}

/** Tabela de peças e produtos para documentos impressos. */
export function PartsPrintTable({ parts, title = "Peças e produtos" }) {
  const total = parts.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);

  return (
    <section className="mt-4">
      <SectionTitle title={title} count={plural(parts.length, "item", "itens")} />
      <table className="w-full border-collapse text-[10.5px]">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className={`${th} w-6 text-center`}>#</th>
            <th className={`${th} w-16`}>Código</th>
            <th className={th}>Descrição</th>
            <th className={`${th} w-16 text-center`}>Qtd</th>
            <th className={`${th} w-24 text-right`}>Valor unit.</th>
            <th className={`${th} w-24 text-right`}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((line, index) => (
            <tr key={line.id} className="break-inside-avoid border-b border-gray-300 even:bg-gray-50">
              <td className={`${td} text-center font-bold`}>{index + 1}</td>
              <td className={`${td} font-mono`}>{line.code || "—"}</td>
              <td className={td}>{line.description}</td>
              <td className={`${td} text-center`}>
                {Number(line.qty).toLocaleString("pt-BR")} {line.unit}
              </td>
              <td className={`${td} text-right`}>{formatBRL(line.unitPrice)}</td>
              <td className={`${td} text-right`}>{formatBRL(line.qty * line.unitPrice)}</td>
            </tr>
          ))}
          {parts.length === 0 && (
            <tr>
              <td colSpan={6} className={`${td} text-center text-gray-600`}>Nenhuma peça adicionada.</td>
            </tr>
          )}
        </tbody>
        {parts.length > 0 && (
          <TableFooter
            colSpan={4}
            summary={`${plural(parts.length, "item", "itens")} · ${plural(sumQty(parts), "unidade", "unidades")}`}
            label="Subtotal peças"
            value={total}
          />
        )}
      </table>
    </section>
  );
}

/** Quadro de totais (mão de obra, peças, desconto e total). `note` aparece embaixo. */
export function PrintTotals({ totals, note }) {
  return (
    <div className="mt-4 flex justify-end break-inside-avoid">
      <dl className="w-72 border border-black text-[11px]">
        <div className="flex justify-between px-2 py-0.5"><dt>Mão de obra</dt><dd>{formatBRL(totals.labor)}</dd></div>
        <div className="flex justify-between px-2 py-0.5"><dt>Peças e produtos</dt><dd>{formatBRL(totals.parts)}</dd></div>
        <div className="flex justify-between px-2 py-0.5"><dt>Desconto</dt><dd>- {formatBRL(totals.discount)}</dd></div>
        <div className="flex justify-between bg-black px-2 py-1 text-sm font-extrabold text-white">
          <dt>Total</dt><dd>{formatBRL(totals.total)}</dd>
        </div>
        {note && <p className="px-2 py-1 text-[10px]">{note}</p>}
      </dl>
    </div>
  );
}
