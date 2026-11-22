import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SelectField from "../../components/ui/SelectField";
import TextAreaField from "../../components/ui/TextAreaField";

const FAQ = [
  {
    pergunta: "Como cadastro um novo cliente?",
    resposta: "Acesse Clientes → Novo Cliente e preencha os dados. O CPF/CNPJ deve ser único por oficina.",
  },
  {
    pergunta: "Como transformo um orçamento em OS?",
    resposta: "Abra o orçamento aprovado e use a ação “Converter em OS”. A OS é criada com os itens já aprovados.",
  },
  {
    pergunta: "Por que não consigo acessar Financeiro?",
    resposta: "Financeiro é exclusivo de administradores. Se você é funcionário, peça ao dono da oficina para liberar a permissão.",
  },
  {
    pergunta: "Como troco de usuário?",
    resposta: "No cabeçalho, clique no ícone de usuários, escolha o funcionário e informe a senha dele. Para voltar ao admin, use “Voltar para admin” e informe a senha do administrador.",
  },
];

const TIPOS = [
  { value: "bug", label: "Bug / Erro" },
  { value: "melhoria", label: "Sugestão de melhoria" },
  { value: "duvida", label: "Dúvida de uso" },
  { value: "outro", label: "Outro" },
];

const MODULOS = [
  "Dashboard",
  "Agenda",
  "Clientes",
  "Veículos",
  "OS (Ordens de Serviço)",
  "Orçamentos",
  "Estoque",
  "Financeiro",
  "Equipe",
  "Configurações",
  "Login / Acesso",
  "Outro",
];

export default function Ajuda() {
  const { user } = useAuth();
  const [tipo, setTipo] = useState("bug");
  const [modulo, setModulo] = useState("Dashboard");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  const montarMensagem = () => {
    const linhas = [
      "Relato de problema - Salvô",
      "",
      `Tipo: ${TIPOS.find((t) => t.value === tipo)?.label ?? tipo}`,
      `Módulo: ${modulo}`,
      `Usuário: ${user?.name ?? "Não identificado"} (${user?.email ?? ""})`,
      `Perfil: ${user?.profile ?? "-"}`,
      `Oficina: ${user?.workshopName ?? "-"}`,
      "",
      "Descrição:",
      descricao.trim() || "(sem descrição)",
    ];
    return linhas.join("\n");
  };

  const enviarWhatsapp = () => {
    if (!descricao.trim()) {
      setErro("Descreva o problema antes de enviar.");
      return;
    }
    setErro("");
    const texto = encodeURIComponent(montarMensagem());
    window.open(`https://wa.me/5511978264990?text=${texto}`, "_blank", "noopener,noreferrer");
  };

  const enviarEmail = () => {
    if (!descricao.trim()) {
      setErro("Descreva o problema antes de enviar.");
      return;
    }
    setErro("");
    const assunto = encodeURIComponent(`[Salvô] ${TIPOS.find((t) => t.value === tipo)?.label ?? tipo} - ${modulo}`);
    const corpo = encodeURIComponent(montarMensagem());
    window.open(`mailto:gleisson.gpd10@gmail.com?subject=${assunto}&body=${corpo}`, "_self");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajuda / Suporte</h1>
        <p className="mt-1 text-sm text-slate-600">
          Dúvidas frequentes e canal para relatar problemas ao time de desenvolvimento.
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.pergunta} className="rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">{item.pergunta}</summary>
              <p className="mt-2 text-sm text-slate-600">{item.resposta}</p>
            </details>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">Relatar problema</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Tipo de problema" options={TIPOS} value={tipo} onChange={(event) => setTipo(event.target.value)} />
          <SelectField label="Módulo afetado" options={MODULOS.map((m) => ({ value: m, label: m }))} value={modulo} onChange={(event) => setModulo(event.target.value)} />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Descreva o problema"
            required
            rows={5}
            placeholder="O que aconteceu, em qual tela, passos para reproduzir..."
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
          />
        </div>
        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={null} onClick={enviarWhatsapp}>
            Enviar por WhatsApp
          </Button>
          <Button variant="outline" onClick={enviarEmail}>
            Enviar por E-mail
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          WhatsApp: (11) 97826-4990 • E-mail: gleisson.gpd10@gmail.com
        </p>
      </Card>
    </div>
  );
}
