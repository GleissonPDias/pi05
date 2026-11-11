import { useState } from "react";
import { BuildingIcon, SaveIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import CardHeader from "../../components/ui/CardHeader";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
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
        <TextField label="Cor primária" maxLength={7} placeholder="#2563eb" hint="Formato #RRGGBB." {...field("corPrimaria")} />
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
