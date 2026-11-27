import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BoxesIcon,
  CalendarPlusIcon,
  ChevronDownIcon,
  ClipboardPlusIcon,
  ClockIcon,
  FileTextIcon,
  LifeBuoyIcon,
  MailIcon,
  MessageCircleIcon,
  SearchIcon,
  SearchXIcon,
  SendIcon,
} from "lucide-react";
import Button from "../../components/ui/Button";
import { buttonClassName } from "../../components/ui/buttonStyles";
import Card from "../../components/ui/Card";
import SelectField from "../../components/ui/SelectField";
import TextAreaField from "../../components/ui/TextAreaField";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";

const SUPPORT = {
  whatsapp: "5511978264990",
  whatsappLabel: "(11) 97826-4990",
  email: "gleisson.gpd10@gmail.com",
  hours: "Segunda a sexta, das 8h às 18h",
};

/** Passo a passo das tarefas mais comuns (mostra só os módulos liberados ao usuário). */
const GUIDES = [
  {
    module: "OS",
    icon: ClipboardPlusIcon,
    color: "bg-blue-100 text-blue-700",
    title: "Abrir uma ordem de serviço",
    steps: ["Clique em “Nova OS” e escolha o veículo", "Faça a vistoria de entrada com o cliente", "Adicione serviços e peças e imprima a OS"],
    to: "/ordens-de-servico",
    action: "Ir para OS",
  },
  {
    module: "ORCAMENTOS",
    icon: FileTextIcon,
    color: "bg-indigo-100 text-indigo-700",
    title: "Enviar um orçamento",
    steps: ["Crie a proposta com peças e mão de obra", "Envie por WhatsApp com o PDF anexo", "Aprovado? Converta em OS com um clique"],
    to: "/orcamentos",
    action: "Ir para Orçamentos",
  },
  {
    module: "AGENDA",
    icon: CalendarPlusIcon,
    color: "bg-emerald-100 text-emerald-700",
    title: "Agendar um horário",
    steps: ["Clique em “Novo agendamento”", "Escolha data, horário, mecânico e box", "Confirme com o cliente no dia anterior"],
    to: "/agenda",
    action: "Ir para Agenda",
  },
  {
    module: "ESTOQUE",
    icon: BoxesIcon,
    color: "bg-amber-100 text-amber-700",
    title: "Dar entrada de peças",
    steps: ["Abra o Estoque e localize a peça", "Registre a entrada com quantidade e custo", "Acompanhe os alertas de estoque mínimo"],
    to: "/estoque",
    action: "Ir para Estoque",
  },
];

const FAQ = [
  {
    category: "Cadastros",
    question: "Como cadastro um novo cliente?",
    answer: "Acesse Clientes e clique em “Novo Cliente”. O CPF ou CNPJ não pode se repetir na mesma oficina. Os veículos podem ser vinculados no mesmo cadastro.",
  },
  {
    category: "Ordens de serviço",
    question: "Como imprimo a OS ou o comprovante de entrada?",
    answer: "Abra a OS e use o botão de impressão. O documento sai com o mapa de avarias da vistoria, as tabelas de serviços e peças e os totais. Para gerar PDF, escolha “Salvar como PDF” na janela de impressão.",
  },
  {
    category: "Ordens de serviço",
    question: "Para que serve a vistoria de entrada?",
    answer: "Ela registra o estado do veículo na chegada (checklist, avarias na carroceria e pertences). Com a concordância do cliente, protege a oficina de reclamações sobre danos que já existiam.",
  },
  {
    category: "Orçamentos",
    question: "Como transformo um orçamento em OS?",
    answer: "Quando o cliente aprovar, abra o orçamento e use “Converter em OS”. A OS é criada com os serviços e peças já aprovados.",
  },
  {
    category: "Orçamentos",
    question: "O que acontece quando um orçamento vence?",
    answer: "Ele passa para a situação “Vencido” e aparece um aviso no sino de notificações. Você pode reenviar a proposta com uma nova validade. O prazo padrão é definido em Configurações.",
  },
  {
    category: "Agenda",
    question: "O sistema avisa quando um mecânico ou box já está ocupado?",
    answer: "Sim. Ao agendar, se o mecânico ou o box escolhido já tiver outro horário no mesmo período, aparece um aviso. Você pode trocar o horário ou salvar mesmo assim.",
  },
  {
    category: "Notificações",
    question: "O que aparece no sino de notificações?",
    answer: "Os próximos horários da agenda (hoje e amanhã), orçamentos novos, orçamentos perto de vencer e os já vencidos, além dos avisos do sistema. Clique em um aviso para abrir a tela correspondente.",
  },
  {
    category: "Acesso",
    question: "Por que não consigo acessar o Financeiro ou a Equipe?",
    answer: "Essas telas são liberadas pelo administrador da oficina. Se você é funcionário, peça ao dono da oficina para liberar a permissão.",
  },
  {
    category: "Acesso",
    question: "Como troco de usuário sem sair do sistema?",
    answer: "No cabeçalho, clique no ícone de usuário, escolha o funcionário e informe a senha dele. Para voltar, use “Voltar para admin” e informe a senha do administrador.",
  },
  {
    category: "Acesso",
    question: "O que é o modo demonstração?",
    answer: "É um acesso com dados de exemplo para conhecer o sistema. Nada do que é feito nele é gravado: ao recarregar a página, os dados voltam ao exemplo inicial.",
  },
];

const CATEGORIES = ["Todas", ...new Set(FAQ.map((item) => item.category))];

const TIPOS = [
  { value: "bug", label: "Erro no sistema" },
  { value: "duvida", label: "Dúvida de uso" },
  { value: "melhoria", label: "Sugestão de melhoria" },
  { value: "outro", label: "Outro assunto" },
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
].map((value) => ({ value, label: value }));

const normalizeText = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function FaqItem({ item }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white open:border-blue-200 open:bg-blue-50/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
        <span>{item.question}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">{item.answer}</p>
    </details>
  );
}

/** Central de ajuda (rota /ajuda): guias rápidos, perguntas frequentes e canal de suporte. */
export default function Ajuda() {
  const { user, isDemo, hasPermission } = useAuth();
  const formId = useId();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [tipo, setTipo] = useState("bug");
  const [modulo, setModulo] = useState("Dashboard");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  const guides = GUIDES.filter((guide) => !hasPermission || hasPermission(guide.module));
  const faq = useMemo(() => {
    const term = normalizeText(search.trim());
    return FAQ.filter((item) => category === "Todas" || item.category === category).filter(
      (item) => !term || normalizeText(`${item.question} ${item.answer}`).includes(term),
    );
  }, [search, category]);

  const tipoLabel = TIPOS.find((item) => item.value === tipo)?.label ?? tipo;

  const mensagem = () =>
    [
      "Relato de suporte — Salvô",
      "",
      `Tipo: ${tipoLabel}`,
      `Módulo: ${modulo}`,
      `Usuário: ${user?.name ?? "Não identificado"}${user?.email ? ` (${user.email})` : ""}`,
      `Perfil: ${user?.isAdmin ? "Administrador" : "Funcionário"}`,
      `Oficina: ${user?.workshopName ?? "—"}`,
      `Tela atual: ${window.location.pathname}`,
      "",
      "Descrição:",
      descricao.trim(),
    ].join("\n");

  const validar = () => {
    if (descricao.trim().length < 10) {
      setErro("Conte com um pouco mais de detalhe o que aconteceu (mínimo de 10 caracteres).");
      return false;
    }
    setErro("");
    return true;
  };

  const enviarWhatsapp = () => {
    if (!validar()) return;
    window.open(`https://wa.me/${SUPPORT.whatsapp}?text=${encodeURIComponent(mensagem())}`, "_blank", "noopener,noreferrer");
  };

  const enviarEmail = () => {
    if (!validar()) return;
    const assunto = encodeURIComponent(`[Salvô] ${tipoLabel} — ${modulo}`);
    window.open(`mailto:${SUPPORT.email}?subject=${assunto}&body=${encodeURIComponent(mensagem())}`, "_self");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Central de Ajuda</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Passo a passo das tarefas do dia a dia, respostas para as dúvidas mais comuns e contato com o suporte
          </p>
        </div>
        <a
          href={`#${formId}`}
          className={buttonClassName({ variant: "primary", size: "lg", className: "w-full gap-2 sm:w-auto" })}
        >
          <LifeBuoyIcon className="size-4" aria-hidden="true" />
          Falar com o suporte
        </a>
      </div>

      {guides.length > 0 && (
        <section aria-labelledby="ajuda-guias">
          <h2 id="ajuda-guias" className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Guias rápidos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card key={guide.title} as="article" className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", guide.color)}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{guide.title}</h3>
                  </div>
                  <ol className="flex-1 space-y-2 text-sm text-slate-600">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="flex gap-2">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <Link to={guide.to} className={buttonClassName({ variant: "soft", size: "sm", className: "self-start" })}>
                    {guide.action}
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden p-0! lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
            <h2 className="text-base font-bold text-slate-900">Perguntas frequentes</h2>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar uma dúvida (ex.: imprimir, orçamento vencido, senha)..."
                aria-label="Pesquisar perguntas frequentes"
                className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div role="group" aria-label="Filtrar por assunto" className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    category === item ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 p-4" aria-live="polite">
            {faq.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
                  <SearchXIcon className="size-6" />
                </span>
                <p className="text-sm font-bold text-slate-900">Nenhuma pergunta encontrada</p>
                <p className="max-w-xs text-xs text-slate-500">Tente outra palavra ou envie sua dúvida ao suporte abaixo.</p>
              </div>
            ) : (
              faq.map((item) => <FaqItem key={item.question} item={item} />)
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900">Fale com o suporte</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageCircleIcon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-500">WhatsApp</span>
                  <a
                    href={`https://wa.me/${SUPPORT.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-slate-900 hover:text-blue-700 hover:underline"
                  >
                    {SUPPORT.whatsappLabel}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
                  <MailIcon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-500">E-mail</span>
                  <a href={`mailto:${SUPPORT.email}`} className="block break-all font-bold text-slate-900 hover:text-blue-700 hover:underline">
                    {SUPPORT.email}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <ClockIcon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-500">Atendimento</span>
                  <span className="font-bold text-slate-900">{SUPPORT.hours}</span>
                </span>
              </li>
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-slate-900">Sua conta</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Usuário</dt>
                <dd className="font-semibold text-slate-900">{user?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Perfil</dt>
                <dd className="font-semibold text-slate-900">{user?.isAdmin ? "Administrador" : "Funcionário"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Oficina</dt>
                <dd className="font-semibold text-slate-900">{user?.workshopName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Acesso</dt>
                <dd className="font-semibold text-slate-900">{isDemo ? "Demonstração" : "Conta da oficina"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Card as="section" aria-labelledby={`${formId}-titulo`} className="scroll-mt-24" id={formId}>
        <div className="mb-4">
          <h2 id={`${formId}-titulo`} className="text-base font-bold text-slate-900">
            Relatar um problema ou enviar uma sugestão
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Sua mensagem segue com seu nome, perfil, oficina e a tela atual, para o suporte entender o contexto mais rápido.
          </p>
        </div>

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-xs font-semibold text-slate-700">Assunto</legend>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((item) => (
              <label
                key={item.value}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors focus-within:ring-2 focus-within:ring-blue-500",
                  tipo === item.value ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
                )}
              >
                <input
                  type="radio"
                  name="tipo-suporte"
                  value={item.value}
                  checked={tipo === item.value}
                  onChange={() => setTipo(item.value)}
                  className="sr-only"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Módulo" options={MODULOS} value={modulo} onChange={(event) => setModulo(event.target.value)} />
          <TextAreaField
            label="O que aconteceu?"
            required
            rows={4}
            maxLength={1000}
            counter
            className="md:col-span-2"
            placeholder="Descreva o que você estava fazendo, o que esperava e o que apareceu na tela..."
            value={descricao}
            error={erro}
            onChange={(event) => {
              setDescricao(event.target.value);
              if (erro) setErro("");
            }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" icon={MailIcon} onClick={enviarEmail} className="w-full sm:w-auto">
            Enviar por e-mail
          </Button>
          <Button variant="success" size="lg" icon={SendIcon} onClick={enviarWhatsapp} className="w-full sm:w-auto">
            Enviar pelo WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
}
