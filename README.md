# Salvô — Gestão Automotiva

Sistema de gestão para oficinas mecânicas. Reúne em um só lugar o dia a dia da oficina: agenda, clientes, veículos, ordens de serviço (OS), orçamentos, estoque e financeiro.

Este repositório contém o **front-end** (React). O back-end (API em Spring Boot) está planejado e será integrado em breve — por enquanto as telas usam dados fictícios (mocks).

> **Status:** em desenvolvimento. O sistema deve ser **100% responsivo** (celular e desktop) e **100% em português**.

---

## Sumário

- [Módulos e andamento](#módulos-e-andamento)
- [Tecnologias](#tecnologias)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Padrões do código](#padrões-do-código)
- [Como criar uma nova tela](#como-criar-uma-nova-tela)
- [Integração com a API](#integração-com-a-api)
- [Fluxo de trabalho em equipe](#fluxo-de-trabalho-em-equipe)
- [Problemas comuns](#problemas-comuns)
- [Equipe](#equipe)

---

## Módulos e andamento

| Módulo | Rota | Situação |
| --- | --- | --- |
| Dashboard | `/` | Pronto (com dados fictícios) |
| Agenda | `/agenda` | Pendente |
| Clientes | `/clientes` | Pronto (lista + cadastro, edição e exclusão em pop-ups, com dados fictícios) |
| Veículos | `/veiculos` | Pronto (lista, ficha técnica, cadastro/edição com rascunho e exclusão em pop-ups, com dados fictícios) |
| OS (Ordens de Serviço) | `/ordens-de-servico`, `/ordens-de-servico/:numero` e `/ordens-de-servico/servicos` (catálogo de serviços) | Pronto (quadro Kanban, lista, detalhes em 4 abas, pop-ups e impressão, com dados fictícios) |
| Orçamentos | `/orcamentos` | Pronto (indicadores, funil comercial, lista, propostas em pop-up, WhatsApp, impressão e conversão em OS, com dados fictícios) |
| Estoque | `/estoque` | Pronto (indicadores, inventário, movimentações, cadastro de peças, entradas/saídas/ajustes, cotação rápida e pedido de compra, com dados fictícios) |
| Financeiro | `/financeiro` | Pendente |
| Configurações | `/configuracoes` | Pendente |
| Ajuda / Suporte | `/ajuda` | Pendente |

Telas pendentes exibem uma página provisória ("Esta tela ainda será desenvolvida"). Ao concluir uma tela, atualize esta tabela.

---

## Tecnologias

| Tecnologia | Versão | Para que usamos |
| --- | --- | --- |
| [React](https://react.dev) | 19 | Biblioteca de interface |
| [Vite](https://vite.dev) | 8 | Servidor de desenvolvimento e build |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Estilização (via plugin `@tailwindcss/vite`) |
| [React Router](https://reactrouter.com) | 7 | Rotas e navegação (`react-router-dom`) |
| [Recharts](https://recharts.org) | 3 | Gráficos |
| [Lucide React](https://lucide.dev) | 1 | Ícones |
| [ESLint](https://eslint.org) | 10 | Padronização e qualidade do código |

A linguagem é **JavaScript** (arquivos `.jsx`), sem TypeScript.

> **Atenção ao Tailwind v4:** não existe `tailwind.config.js`. O tema (cores, fontes) é configurado no CSS, dentro do bloco `@theme` do arquivo `src/index.css`.

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) **20.19 ou superior** (ou 22.12+). Recomendamos a versão LTS mais recente.
- npm (já vem com o Node.js).
- Editor recomendado: Visual Studio Code, com as extensões **ESLint** e **Tailwind CSS IntelliSense**.

### Passo a passo

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd pi05

# 2. Instalar as dependências
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

O sistema abre em `http://localhost:5173`.

### Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com recarga automática |
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Serve localmente a versão gerada pelo `build` |
| `npm run lint` | Verifica o código com o ESLint |

> Rode `npm run lint` e `npm run build` antes de abrir um Pull Request.

---

## Estrutura de pastas

```
pi05/
├── public/                     # Arquivos estáticos (favicon, logo)
├── index.html                  # HTML base (idioma pt-BR, fonte Inter)
├── vite.config.js              # Configuração do Vite + plugin do Tailwind
├── eslint.config.js            # Regras do ESLint
└── src/
    ├── main.jsx                # Ponto de entrada (BrowserRouter)
    ├── App.jsx                 # Definição das rotas
    ├── index.css               # Tailwind + tema do projeto (@theme)
    │
    ├── config/
    │   └── navigation.js       # Itens do menu lateral (fonte única)
    │
    ├── layouts/
    │   └── MainLayout.jsx      # Estrutura base: menu lateral + cabeçalho + conteúdo
    │
    ├── assets/brand/           # Logo do sistema (menu lateral e documentos impressos)
    │
    ├── components/             # Componentes compartilhados entre telas
    │   ├── Aside/              # Menu lateral (gaveta no celular)
    │   ├── Header/             # Cabeçalho (busca, status, notificações, usuário)
    │   ├── print/              # PrintHeader: cabeçalho com logo dos documentos impressos
    │   └── ui/                 # Peças reutilizáveis: Button, Card, Modal, TextField...
    │
    ├── context/                # Dados compartilhados (clientes, veículos, OS, serviços, orçamentos e estoque) + AppProviders
    │
    ├── hooks/                  # Hooks compartilhados: useToast, useClientes, useVeiculos, useOrdens, useServicos, useOrcamentos, useEstoque
    │
    ├── pages/                  # Uma pasta por tela
    │   ├── Dashboard/
    │   │   ├── Dashboard.jsx   # Monta a página
    │   │   └── components/     # Componentes usados apenas no Dashboard
    │   ├── Clientes/
    │   │   ├── Clientes.jsx    # Monta a página (busca, filtros, paginação, pop-ups)
    │   │   ├── components/     # Tabela, cards, toolbar e pop-ups de criar/editar/excluir
    │   │   ├── hooks/          # useClientes: operações do CRUD (hoje em memória)
    │   │   ├── clienteForm.js  # Valores iniciais, conversão e validação do formulário
    │   │   └── constants.js    # Filtros, classificações, estados, motivos...
    │   ├── Veiculos/
    │   │   ├── Veiculos.jsx    # Monta a página (indicadores, busca, filtros, paginação, pop-ups)
    │   │   ├── components/     # Tabela, cards, placa Mercosul, upload de foto e pop-ups
    │   │   ├── vehicleForm.js  # Valores iniciais, conversão e validação do formulário
    │   │   ├── vehicleUtils.js # Situação de manutenção, filtros, indicadores e CSV
    │   │   └── constants.js    # Combustíveis, câmbios, categorias, limites da foto...
    │   ├── OrdensServico/
    │   │   ├── OrdensServico.jsx  # Quadro Kanban / lista, indicadores, filtros, atalhos (N e F)
    │   │   ├── OrdemDetalhe.jsx   # Detalhes da OS (rota /ordens-de-servico/:numero)
    │   │   ├── components/        # Cards, quadro, tabela, pop-ups Nova OS / Cancelar / Entregar
    │   │   ├── detalhe/           # Abas (dados, vistoria, diagnóstico, fechamento), resumo, impressão
    │   │   ├── hooks/             # useStatusFlow: regras e pop-ups de mudança de etapa
    │   │   ├── servicos/          # Catálogo de serviços (lista, indicadores e CRUD em pop-up)
    │   │   ├── ordemUtils.js      # Totais, regras de etapa, filtros, indicadores, WhatsApp e CSV
    │   │   ├── ordemForm.js       # Validação do pop-up Nova OS
    │   │   └── constants.js       # Etapas, prioridades, checklist, avarias, pagamentos, garantias...
    │   ├── Estoque/
    │   │   ├── Estoque.jsx        # Indicadores, inventário, movimentações e pop-ups
    │   │   ├── components/        # Tabela, peça, movimentação, histórico, pedido de compra e impressão
    │   │   ├── estoqueUtils.js    # Situação (normal/baixo/crítico), reservas em OS, markup, giro, CSV
    │   │   └── constants.js       # Situações, tipos de movimentação, motivos e unidades
    │   ├── Orcamentos/
    │   │   ├── Orcamentos.jsx     # Indicadores, funil, filtros, lista e ações (enviar, aprovar, converter)
    │   │   ├── components/        # Tabela, pop-ups (proposta, formulário, rejeição, conversão) e impressão
    │   │   ├── quoteUtils.js      # Situação comercial, validade, filtros, indicadores, WhatsApp e CSV
    │   │   └── constants.js       # Situações, períodos, validades e motivos de rejeição
    │   └── PlaceholderPage.jsx # Página provisória das telas pendentes
    │
    ├── mocks/                  # Dados fictícios (serão trocados pela API)
    │   ├── dashboard.js
    │   ├── clientes.js
    │   ├── veiculos.js         # Veículos ligados aos clientes pelo campo ownerId
    │   ├── ordens.js           # Ordens de serviço (em andamento e histórico)
    │   ├── oficina.js          # Boxes, mecânicos, consultores e dados da oficina (impressão)
    │   ├── catalogo.js         # Peças (estoque), fornecedores e tabela de serviços
    │   ├── orcamentos.js       # Orçamentos (propostas comerciais)
    │   ├── estoque.js          # Movimentações de estoque (histórico)
    │   └── user.js             # Usuário logado fictício
    │
    ├── services/               # Chamadas a serviços externos (ex.: busca de CEP)
    │   └── cep.js
    │
    └── utils/                  # Funções auxiliares
        ├── cn.js               # Junta classes CSS condicionais
        ├── format.js           # Formatação de moeda (BRL) e números
        ├── masks.js            # Máscaras: CPF/CNPJ, telefone, CEP, placa, km, dinheiro
        ├── validators.js       # Validação de CPF, CNPJ, e-mail, telefone, placa e chassi
        ├── dates.js            # Datas: "14/08/2026", "Há 2 dias"
        └── csv.js              # Download de arquivos CSV
```

### Onde colocar cada coisa

- **Componente usado em várias telas** → `src/components/`.
- **Componente usado em uma tela só** → `src/pages/<Tela>/components/`.
- **Peça visual genérica** (botão, card, badge) → `src/components/ui/`.
- **Dado fictício** → `src/mocks/`.
- **Função auxiliar sem JSX** → `src/utils/`.

---

## Padrões do código

### Nomenclatura

- Componentes e pastas de componentes: `PascalCase` (`WeeklyFinanceCard.jsx`).
- Funções, variáveis e arquivos utilitários: `camelCase` (`format.js`, `formatBRL`).
- Um componente por arquivo, exportado como `export default`.
- Nomes de componentes em inglês ou português de forma consistente dentro do mesmo módulo; **textos exibidos ao usuário sempre em português**.

### Estilização com Tailwind

- Estilize **apenas com classes do Tailwind**. Evite criar arquivos `.css` por componente.
- Cores e fontes do projeto ficam no `@theme` do `src/index.css`. Se precisar de uma cor nova que será usada em mais de um lugar, cadastre lá em vez de usar valores soltos como `bg-[#123456]`.
- Tokens atuais: `bg-sidebar` (menu lateral), `bg-page` (fundo das telas) e as cores dos gráficos (`--color-chart-*`).
- Para classes condicionais, use o helper `cn()`:

  ```jsx
  import { cn } from "../../utils/cn";

  <div className={cn("p-4", isActive && "bg-blue-600")} />
  ```

### Responsividade

O projeto é **mobile-first**: escreva primeiro o estilo do celular e adicione breakpoints para telas maiores.

| Breakpoint | Largura | Uso no projeto |
| --- | --- | --- |
| (padrão) | < 640px | Celular: uma coluna, menu lateral em gaveta |
| `sm:` | ≥ 640px | Ajustes leves (2 colunas em atalhos, cabeçalho completo) |
| `md:` | ≥ 768px | Exibe nome do usuário e status da oficina no cabeçalho |
| `lg:` | ≥ 1024px | Menu lateral fixo na tela |
| `xl:` | ≥ 1280px | Grades com 3 ou 4 colunas |

Teste toda tela nos tamanhos de celular e desktop (as ferramentas do navegador, `F12`, permitem simular).

### Componentes reutilizáveis

Antes de criar algo novo, veja se já existe em `src/components/ui/`:

| Componente | Uso |
| --- | --- |
| `Button` | Botões (variantes `primary`, `soft`, `outline`, `success`, `neutral`, `danger`; tamanhos `sm`, `md`, `lg`; prop `icon`) |
| `Card` | Container branco padrão das seções |
| `CardHeader` | Cabeçalho de card: ícone + título + subtítulo + ação à direita |
| `Badge` | Etiquetas pequenas (contadores, prioridades) |
| `Modal` | Pop-up acessível (fecha com Esc, prende o foco). Use com `ModalHeader`, `ModalBody` e `ModalFooter`; renderize só enquanto estiver aberto |
| `TextField` / `SelectField` / `TextAreaField` / `Checkbox` | Campos de formulário com rótulo, mensagem de erro e acessibilidade já ligados |
| `MoneyInput` / `QuantityStepper` | Valor em reais (digitação estilo caixa registradora) e quantidade com − / + |
| `StatCard` | Cartão de indicador (ícone + rótulo + valor) |
| `ChipSelect` | Lista suspensa com visual de chip para barras de filtro ("Vendedor: Todos") |
| `buttonClassName()` (`buttonStyles.js`) | Aparência de botão para `<Link>` e `<a>` |
| `Pagination` | Paginação com reticências ("1 2 3 ... 21") |
| `Toast` + `useToast` | Aviso temporário de sucesso/alerta no canto da tela |

### Ícones e gráficos

- Ícones: `lucide-react` (ex.: `import { UsersIcon } from "lucide-react"`).
- Gráficos: `recharts`, dentro de `ResponsiveContainer`, para se adaptarem ao tamanho da tela. Cores dos gráficos vêm dos tokens `--color-chart-*` do tema.

### Acessibilidade

- Botões só com ícone precisam de `aria-label`.
- Use elementos semânticos (`button`, `nav`, `main`, `section`) em vez de `div` clicáveis.
- Mantenha o foco visível (`focus-visible:ring-*`) nos elementos interativos.

---

## Como criar uma nova tela

1. **Menu e rota:** o item já existe em `src/config/navigation.js`. Se for um item novo, adicione-o lá.
2. **Página:** crie `src/pages/<Tela>/<Tela>.jsx` e, se necessário, `src/pages/<Tela>/components/`.
3. **Dados fictícios:** crie `src/mocks/<tela>.js` com o formato que a API deverá devolver.
4. **Registrar a rota:** em `src/App.jsx`, adicione a `<Route>` da nova tela junto das "Telas prontas" e inclua o caminho na lista `implementedPaths`, para que a página provisória deixe de ser usada nessa rota. Exemplo para a tela de clientes:

   ```jsx
   const implementedPaths = ["/", "/clientes"];

   // ...
   <Route index element={<Dashboard />} />
   <Route path="/clientes" element={<Clientes />} />
   ```

5. **Reutilize** os componentes de `src/components/ui/` e siga os padrões desta página.
6. **Revise:** teste no celular e no desktop, rode `npm run lint` e `npm run build`.
7. **Atualize** a tabela [Módulos e andamento](#módulos-e-andamento).

---

## Integração com a API

O back-end será uma API em **Spring Boot**. Enquanto ela não está disponível:

- As telas leem os dados de `src/mocks/`. O formato dos mocks foi pensado para ser o mesmo da resposta esperada da API.
- Ao integrar, o plano é criar uma pasta `src/services/` com as chamadas HTTP e substituir a importação do mock por essas chamadas, sem precisar reescrever os componentes visuais.
- Pontos já marcados no código com `TODO`: dados do usuário (`mocks/user.js`), filtro de período do Dashboard e as operações de clientes, veículos e ordens de serviço (`context/useClientesState.js`, `context/useVeiculosState.js` e `context/useOrdensState.js`, hoje em memória: os dados voltam ao original ao recarregar a página).
- A busca de endereço pelo CEP já usa a API pública ViaCEP (`src/services/cep.js`).
- Clientes e veículos ficam em `src/context/` (estado compartilhado), porque as telas se conversam: o cadastro de veículo permite criar um cliente na hora, a lista de clientes mostra os veículos de cada um e desativar um cliente desvincula os veículos dele. Ao integrar a API, troque o corpo das funções de `context/useClientesState.js` e `context/useVeiculosState.js` por chamadas HTTP, mantendo as assinaturas.
- **Ordens de serviço:** a situação de cada veículo (OS em andamento, box em uso, histórico e última passagem) é calculada a partir das OS (`context/vehicleOrders.js`). A API pode devolver esses campos prontos no veículo.
- **Rascunho da OS:** as edições da página de detalhes ficam em rascunho (`drafts`) até clicar em "Salvar". Mudanças de etapa, aprovação e entrega são gravadas na hora. Sugestão de rotas: `POST /ordens`, `PATCH /ordens/{numero}`, `POST /ordens/{numero}/status`.
- **Catálogo de serviços:** fica em `context/useServicosState.js` e alimenta o "Adicionar Serviço" das OS e dos orçamentos (só os ativos). Serviço já usado não pode ser excluído, apenas desativado.
- **Orçamentos:** `context/useOrcamentosState.js`. A situação "Vencido" é calculada (enviado e fora da validade). Ao converter, é criada uma OS com os itens e a aprovação do cliente, e a OS guarda o `quoteId` de origem. Sugestão de rotas: `POST /orcamentos`, `POST /orcamentos/{id}/enviar`, `/aprovar`, `/rejeitar` e `/converter`.
- **Estoque:** `context/useEstoqueState.js`. Toda mudança de quantidade passa por `registerMovement` (gera histórico e recalcula o custo médio nas entradas). Peças de OS em andamento contam como **reservadas** (estoque disponível = físico − reservado) e a entrega da OS dá **baixa automática** (`consumeForOrder`). Sugestão de rotas: `/pecas`, `POST /estoque/movimentacoes`, `POST /compras/pedidos`.
- **Impressão:** `utils/print.js` (`printDocument`) renderiza o documento, espera a logo carregar e abre a impressão. Os documentos usam `components/print/PrintHeader.jsx`.
- **Regras de etapa** (ex.: só executa com orçamento aprovado; só finaliza com todos os serviços concluídos) ficam em `canMoveTo` (`pages/OrdensServico/ordemUtils.js`). O back-end deve validar as mesmas regras.
- A foto do veículo e as fotos da vistoria hoje são endereços temporários do navegador; na API elas devem ser enviadas como arquivo (multipart) e a resposta traz as URLs definitivas.
- "Excluir" um cliente **desativa** o cadastro (não apaga), para preservar o histórico de serviços e os registros fiscais. A API deve seguir o mesmo comportamento.

Combine em equipe o formato dos contratos (JSON) com quem desenvolve o back-end antes de ligar cada tela.

---

## Fluxo de trabalho em equipe

Sugestões para manter o repositório organizado:

- **Branches:** não trabalhe direto na `main`. Crie uma branch por tarefa a partir da `main` atualizada:
  - `feature/tela-clientes`
  - `fix/erro-menu-mobile`
  - `docs/atualiza-readme`
- **Commits:** mensagens curtas e no imperativo, com prefixo do tipo de mudança:
  - `feat: cria tela de clientes`
  - `fix: corrige fechamento do menu no celular`
  - `docs: atualiza README`
  - `refactor: extrai componente de tabela`
- **Pull Requests:** descreva o que foi feito, anexe um print da tela (celular e desktop) e peça revisão de pelo menos uma pessoa da equipe.
- **Antes de subir:** `npm run lint` e `npm run build` sem erros.
- **Dependências:** ao instalar um pacote novo (`npm install <pacote>`), faça commit do `package.json` **e** do `package-lock.json`, e avise a equipe para rodar `npm install`.
- **Não versionar:** `node_modules/` e `dist/` (já estão no `.gitignore`). Se o projeto passar a usar arquivos `.env` (por exemplo, com a URL da API), adicione `.env` ao `.gitignore` antes de criá-lo.

---

## Problemas comuns

**Erro `Failed to resolve import "..."` ao abrir o projeto**
Falta instalar as dependências ou o servidor foi iniciado antes da instalação. Rode `npm install`, pare o servidor (`Ctrl + C`) e inicie novamente com `npm run dev`. Se persistir, use `npm run dev -- --force` para refazer o cache do Vite.

**Estilos do Tailwind não aparecem**
Confirme que `src/index.css` começa com `@import "tailwindcss";` e que `src/main.jsx` importa esse arquivo. Reinicie o servidor.

**Erro de versão do Node**
O Vite 8 exige Node.js 20.19+ ou 22.12+. Verifique com `node -v`.

---

## Equipe

<!-- Preencha com os integrantes do grupo. -->

| Nome | Função |
| --- | --- |
| _Nome do integrante_ | _Ex.: Front-end / Back-end / UX_ |
| _Nome do integrante_ | _..._ |
