import { useState } from "react";
import { BuildingIcon, SaveIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import CardHeader from "../../components/ui/CardHeader";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
import { fetchAddressByCep } from "../../services/cep";
import { maskCep, maskCnpj, maskPhone } from "../../utils/masks";
import { UF_OPTIONS, oficinaToPayload, validateOficina } from "./configuracoesUtils";

const MASKS = { cnpj: maskCnpj, telefone: maskPhone, whatsapp: maskPhone, cep: maskCep };

/** Formulário com os dados cadastrais usados em impressos e no cabeçalho do sistema. */
function OficinaDadosCard({ values, setValues, readOnly, saving, onSave }) {
  const [errors, setErrors] = useState({});

  const field = (name) => ({
    name,
    value: values[name],
    disabled: readOnly || saving,
    error: errors[name],
    onChange: (event) => {
      const raw = event.target.value;
      const next = MASKS[name] ? MASKS[name](raw) : raw;
      setValues((current) => ({ ...current, [name]: next }));
      setErrors((current) => ({ ...current, [name]: undefined }));
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (readOnly || saving) return;
    const found = validateOficina(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave(oficinaToPayload(values));
  };

  return (
    <Card as="form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <CardHeader
        icon={BuildingIcon}
        iconClassName="bg-blue-100 text-blue-600"
        title="Dados da oficina"
        subtitle="Aparecem no cabeçalho dos documentos impressos (OS, orçamentos e pedidos)."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-700 sm:col-span-2">Identificação</h3>
        <TextField label="Razão social / nome" required maxLength={120} {...field("nome")} />
        <TextField label="Nome fantasia" maxLength={120} {...field("nomeFantasia")} />
        <TextField label="CNPJ" inputMode="numeric" placeholder="00.000.000/0000-00" {...field("cnpj")} />
        <TextField label="Horário de funcionamento" placeholder="Seg a sex, 8h às 18h" maxLength={160} {...field("horarioFuncionamento")} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-700 sm:col-span-2">Contato</h3>
        <TextField label="Telefone" type="tel" inputMode="tel" placeholder="(11) 3045-7700" {...field("telefone")} />
        <TextField label="WhatsApp" type="tel" inputMode="tel" placeholder="(11) 97777-4500" {...field("whatsapp")} />
        <TextField label="E-mail" type="email" autoComplete="off" {...field("email")} />
        <TextField label="Site" maxLength={160} placeholder="www.suaoficina.com.br" {...field("site")} />
      </section>

      <section className="grid gap-4 sm:grid-cols-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-700 sm:col-span-6">Endereço</h3>
        <div className="sm:col-span-2">
          <TextField label="CEP" inputMode="numeric" placeholder="00000-000" {...field("cep")} />
          <button
            type="button"
            disabled={readOnly || saving}
            onClick={async () => {
              try {
                const address = await fetchAddressByCep(values.cep);
                setValues((current) => ({ ...current, logradouro: address.street, bairro: address.district, cidade: address.city, uf: address.state }));
              } catch (error) {
                setErrors((current) => ({ ...current, cep: error.message }));
              }
            }}
            className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Buscar CEP
          </button>
        </div>
        <div className="sm:col-span-4">
          <TextField label="Logradouro" maxLength={160} {...field("logradouro")} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Número" maxLength={20} {...field("numero")} />
        </div>
        <div className="sm:col-span-4">
          <TextField label="Complemento" maxLength={80} {...field("complemento")} />
        </div>
        <div className="sm:col-span-3">
          <TextField label="Bairro" maxLength={80} {...field("bairro")} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Cidade" maxLength={80} {...field("cidade")} />
        </div>
        <div className="sm:col-span-1">
          <SelectField label="UF" options={UF_OPTIONS} {...field("uf")} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-1">
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-700 sm:col-span-1">Identidade visual</h3>
        <div className="flex items-center gap-4 sm:col-span-1">
          {values.logoUrl ? (
            <img src={values.logoUrl} alt="Logo da oficina" className="h-16 w-auto rounded-md object-contain border border-slate-200" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-md border border-dashed border-slate-300 text-xs text-slate-400">
              Sem logo
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setValues((current) => ({ ...current, logoUrl: String(reader.result) }));
                  reader.readAsDataURL(file);
                }}
              />
              Enviar logo
            </label>
            {values.logoUrl && (
              <button
                type="button"
                onClick={() => setValues((current) => ({ ...current, logoUrl: "" }))}
                className="text-xs text-red-600 hover:underline"
              >
                Remover logo
              </button>
            )}
            <p className="text-xs text-slate-500">PNG ou JPG, preferencialmente quadrado.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-700 sm:col-span-3">Orçamentos e identidade</h3>
        <TextField
          label="Validade do orçamento (dias)"
          type="number"
          min="1"
          max="365"
          inputMode="numeric"
          {...field("validadeOrcamentoDias")}
        />
        <TextField
          label="Desconto máximo (%)"
          type="number"
          min="0"
          max="100"
          step="0.5"
          inputMode="decimal"
          {...field("descontoMaximoPercentual")}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        {readOnly ? (
          <p className="text-xs text-slate-500">Modo demonstração: os dados não são alterados.</p>
        ) : (
          <Button type="submit" icon={SaveIcon} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar dados da oficina"}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default OficinaDadosCard;
