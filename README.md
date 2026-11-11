# Salvô — Gestão Automotiva

Sistema de gestão para oficinas mecânicas. Reúne em um só lugar o dia a dia da oficina: agenda, clientes, veículos, ordens de serviço (OS), orçamentos, estoque e financeiro.

Este repositório contém o **front-end** (React), integrado à API **salvo-api** (Spring Boot). Clientes, veículos, ordens de serviço, catálogo de serviços/peças, estoque, agenda, financeiro, notificações, equipe, boxes e dados da oficina vêm da API; orçamentos e parte dos campos complementares continuam em dados fictícios ou overlays locais (veja [Integração com a API](#integração-com-a-api)). Sem back-end disponível, use o **modo demonstração** na tela de login.

> A API já expõe endpoints de **fornecedores, pedidos de compra e vistoria**, mas as telas correspondentes (ou parte delas) ainda não foram migradas neste front.

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
- [Alterações recentes](#alterações-recentes)
- [Fluxo de trabalho em equipe](#fluxo-de-trabalho-em-equipe)
- [Problemas comuns](#problemas-comuns)
- [Equipe](#equipe)

---

## Módulos e andamento

| Módulo | Rota | Situação |
| --- | --- | --- |
| Dashboard | `/` | Pronto (indicadores e fluxo financeiro semanal via API; orçamentos locais) |
| Agenda | `/agenda` | Pronto (lista por dia com filtro de período, criação, edição, status e exclusão; dados da API; exige conexão com a API) |
| Clientes | `/clientes` | Pronto (lista + cadastro, edição e exclusão em pop-ups; dados da API) |
| Veículos | `/veiculos` | Pronto (lista, ficha técnica, cadastro/edição com rascunho e exclusão em pop-ups; dados da API + overlay local) |
| OS (Ordens de Serviço) | `/ordens-de-servico`, `/ordens-de-servico/:numero` e `/ordens-de-servico/servicos` (catálogo de serviços) | Pronto (quadro Kanban, lista, detalhes em 4 abas, pop-ups e impressão; cabeçalho/itens/status persistidos na API + overlay local) |
| Orçamentos | `/orcamentos` | Pronto (indicadores, funil comercial, lista, propostas em pop-up, WhatsApp, impressão e conversão em OS; dados fictícios + overlay local) |
| Estoque | `/estoque` | Pronto (indicadores, inventário, movimentações, cadastro de peças, entradas/saídas/ajustes, cotação rápida e pedido de compra; catálogo e movimentações na API, pedido de compra local) |
| Financeiro | `/financeiro` | Pronto (contas a receber e a pagar, indicadores, criação, status e exclusão; dados da API; exige conexão com a API); exclusivo do administrador |
| Equipe | `/equipe` | Pronto (lista, filtros, cadastro/edição, ativação/desativação e senha temporária; dados da API); exclusivo do administrador |
| Configurações | `/configuracoes` | Pronto (dados cadastrais da oficina e gestão de boxes; dados da API); exclusivo do administrador |
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

# 3. Configurar a URL da API (opcional; o padrão é a API publicada)
cp .env.example .env

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

O sistema abre em `http://localhost:5173`.

Para usar a API local, rode o back-end `salvo-api` em `http://localhost:8080` e ajuste `.env`:

```bash
VITE_API_URL=http://localhost:8080
```

Sem back-end, entre pela opção **"Entrar no modo demonstração"** na tela de login.

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
├── docs/
│   └── ALTERACOES.md           # Changelog da integração com a API
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
    │   ├── ApiFeedback.jsx     # Barra de progresso e aviso global de erros da API
    │   ├── RequireAuth.jsx     # Protege as rotas internas (redireciona para /login)
    │   ├── RequireAdmin.jsx    # Restringe /equipe, /financeiro e /configuracoes ao ADMIN
    │   ├── Aside/              # Menu lateral (gaveta no celular)
    │   ├── Header/             # Cabeçalho (busca, status, usuário); NotificationsMenu com o sino de notificações
    │   ├── print/              # PrintHeader: cabeçalho com logo dos documentos impressos
    │   └── ui/                 # Peças reutilizáveis: Button, Card, Modal, TextField...
    │
    ├── context/                # Dados compartilhados + sessão e providers
    │   ├── AuthProvider.jsx    # Login, cadastro, modo demonstração e sessão
    │   ├── AppProviders.jsx    # Monta os contextos de dados após o login
    │   └── use*State.js        # Carregam a API e normalizam os DTOs
    │
    ├── hooks/                  # Hooks de acesso: useAuth, useToast, useClientes, useVeiculos, useOrdens, useServicos, useOrcamentos, useEstoque
    │
    ├── pages/                  # Uma pasta por tela
    │   ├── Login/
    │   │   └── Login.jsx       # Login na API + entrada no modo demonstração
    │   ├── Register/
    │   │   └── Register.jsx    # Cadastro de oficina (POST /auth/registrar)
    │   ├── Dashboard/
    │   │   ├── Dashboard.jsx   # Monta a página
    │   │   └── components/     # Componentes usados apenas no Dashboard
    │   ├── Clientes/
    │   │   ├── Clientes.jsx    # Monta a página (busca, filtros, paginação, pop-ups)
    │   │   ├── components/     # Tabela, cards, toolbar e pop-ups de criar/editar/excluir
    │   │   ├── hooks/          # useClientes: operações do CRUD (API + overlay local)
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
    │   ├── Equipe/
    │   │   ├── Equipe.jsx         # Lista, filtros, indicadores e mutações da equipe (somente ADMIN)
    │   │   ├── EquipeFormModal.jsx # Cadastro/edição de funcionário
    │   │   ├── EquipeTable.jsx    # Tabela de integrantes e ações
    │   │   ├── EquipeStatusModal.jsx # Ativação/desativação
    │   │   ├── EquipeSenhaModal.jsx  # Senha temporária exibida uma única vez
    │   │   ├── EquipeToolbar.jsx  # Busca e filtros
    │   │   └── equipeUtils.js     # Mapeamento, payloads, validação e dados do modo demo
    │   ├── Agenda/
    │   │   ├── Agenda.jsx         # Lista por dia, período e ações de status (somente com API)
    │   │   ├── AgendaFormModal.jsx # Criação/edição de agendamento
    │   │   └── agendaUtils.js     # Períodos, agrupamento por dia, status e payloads
    │   ├── Financeiro/
    │   │   ├── Financeiro.jsx     # Abas a receber/a pagar, indicadores e ações (somente ADMIN)
    │   │   ├── FinanceiroFormModal.jsx # Cadastro de recebimento ou despesa
    │   │   └── financeiroUtils.js # Status, formas de pagamento, totais e validação
    │   ├── Configuracoes/
    │   │   ├── Configuracoes.jsx  # Dados da oficina e boxes (somente ADMIN)
    │   │   ├── OficinaDadosCard.jsx, BoxesCard.jsx, BoxFormModal.jsx
    │   │   └── configuracoesUtils.js # Formulário, máscaras, payload e validação
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
    ├── services/               # Integração com a API e serviços externos
    │   ├── api.js              # Cliente HTTP, sessão JWT, modo demo e erros globais
    │   ├── mappers.js          # Conversão DTO da API <-> formato das telas
    │   ├── storage.js          # Overlays no localStorage (salvo.overlay.v1:*)
    │   ├── catalogs.js         # Cache de serviços/peças e resolução id <-> código
    │   ├── mechanics.js        # Registro mutável da equipe técnica (/mecanicos) e dos boxes (/boxes)
    │   ├── workshop.js         # Dados da oficina usados em impressos (/oficina)
    │   └── cep.js              # Busca de CEP
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
- **Chamada à API** → `src/services/api.js` (cliente) e `src/services/mappers.js` (DTO ↔ tela).
- **Estado compartilhado carregado da API** → `src/context/use<Tela>State.js`.
- **Dado fictício** (telas ainda sem API) → `src/mocks/`.
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
3. **Dados:** se a API já tiver endpoint, use `src/services/api.js` + `src/services/mappers.js` e um `use<Tela>State.js`. Caso contrário, crie `src/mocks/<tela>.js` com o formato que a API deverá devolver.
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

O front-end está integrado ao back-end **salvo-api** (Spring Boot) pela camada `src/services/`. A interface continua funcionando sem o servidor graças ao **modo demonstração**.

### Configuração

```bash
# .env (na raiz do projeto)
VITE_API_URL=https://salvo-api.onrender.com
```

- `VITE_API_URL` é opcional; sem ela, o padrão é `https://salvo-api.onrender.com`.
- Copie `.env.example` para `.env` e ajuste a URL ao ambiente (local, homologação ou produção).
- O Vite só lê variáveis `VITE_*` no momento do build/dev — reinicie o servidor após alterar o `.env`.
- A API publicada e o Swagger estão em `https://salvo-api.onrender.com` e `/swagger-ui/index.html`.

### Login, cadastro e sessão

- A tela `/login` autentica com `POST /auth/login` (e-mail + senha) e guarda o JWT no `localStorage` (`salvo.session.v1`).
- A tela `/cadastro` cria a oficina com `POST /auth/registrar` (nome da oficina, responsável, e-mail, senha, telefone e CNPJ).
  - Se o Supabase devolver sessão, o usuário entra automaticamente.
  - Se a confirmação de e-mail estiver ativa, o front exibe a mensagem para confirmar o e-mail antes de entrar.
- Em seguida `GET /auth/me` carrega nome, cargo, perfil (`ADMIN`/`FUNCIONARIO`), situação, oficina e e-mail do usuário.
- Todas as rotas internas são protegidas por `RequireAuth`; sem sessão válida o usuário volta ao login.
- As rotas `/equipe`, `/financeiro` e `/configuracoes` ficam sob `RequireAdmin`; funcionários não as acessam. O menu lateral esconde esses itens para quem não é administrador.
- Em `401` a sessão é limpa e o usuário é redirecionado ao login. Os dados de sessão e modo ficam em `src/services/api.js`.
- **Modo demonstração:** o botão "Entrar no modo demonstração" usa os dados de `src/mocks/`, não faz chamadas à API e não altera o servidor. Use-o para navegar pelas telas sem credenciais ou com o back-end fora do ar.

### O que já vem da API

| Recurso | Endpoints usados | Observações |
| --- | --- | --- |
| Clientes | `GET/POST/PUT/DELETE /clientes` | Lista paginada e busca; "excluir" desativa o cadastro. |
| Veículos | `GET/POST/PUT/DELETE /veiculos`, `/clientes/{id}/veiculos` | Lista paginada; placa/chassi únicos por oficina. |
| Ordens de Serviço | `GET/POST /ordens-servico`, `GET/PUT /ordens-servico/{numero}`, `PATCH /{numero}/status`, `GET /{numero}/historico`, `POST/PUT/DELETE /{numero}/servicos` e `/pecas` | Cabeçalho, itens e status persistidos; número sequencial por oficina. |
| Serviços | `GET/POST/PUT/DELETE /servicos`, `GET/PUT /servicos/{id}/pecas-sugeridas` | CRUD com código automático; exclusão lógica; peças sugeridas persistidas. |
| Peças | `GET/POST/PUT/DELETE /pecas` | CRUD com código automático e exclusão lógica. |
| Estoque | `POST/GET /pecas/{id}/movimentacoes`, `GET /estoque/movimentacoes` | Entradas, saídas, ajustes, devoluções e histórico. |
| Equipe técnica | `GET /mecanicos` | Alimenta filtros, seleção de responsável e impressão. Só devolve ativos com `executaOs = true`. |
| Boxes | `GET /boxes`, `POST /boxes`, `PUT /boxes/{id}`, `DELETE /boxes/{id}` | Lista usada nas OS, agenda e Configurações. Escrita só para ADMIN; desativação em vez de exclusão. |
| Dados da oficina | `GET /oficina`, `PUT /oficina` | Cabeçalho dos documentos impressos e configurações (validade de orçamento, desconto máximo). Escrita só para ADMIN. |
| Agenda | `GET/POST /agendamentos`, `PUT /agendamentos/{id}`, `PATCH /agendamentos/{id}/status`, `DELETE /agendamentos/{id}` | Tela `/agenda`. Horários exibidos no fuso local. |
| Financeiro | `GET/POST /pagamentos`, `GET/POST /despesas`, `PATCH .../status`, `DELETE .../{id}` | Tela `/financeiro` (ADMIN). Dashboard usa os lançamentos pagos dos últimos 7 dias. |
| Notificações | `GET /notificacoes`, `GET /notificacoes/nao-lidas/contador`, `PATCH /notificacoes/{id}/lida`, `PATCH /notificacoes/lidas` | Sino do cabeçalho: contador real e lista das mais recentes. |
| Equipe | `GET/POST /usuarios`, `GET/PUT /usuarios/{id}`, `PATCH /usuarios/{id}/status` e `POST /usuarios/{id}/reset-senha` | Cadastro e gestão de funcionários, exclusivo do `ADMIN`. Cria a identidade no Supabase Auth e devolve uma senha temporária uma única vez. |
| Usuário | `POST /auth/login`, `POST /auth/registrar`, `GET /auth/me` | JWT Bearer em todas as chamadas autenticadas. |

> **Perfis:** o dono da oficina é `ADMIN`; funcionários cadastrados nascem `FUNCIONARIO`. A permissão real é aplicada no back-end (`@PreAuthorize`); esconder o menu é apenas usabilidade. O dashboard financeiro só aparece para o `ADMIN`.

**Ainda sem uso no front, mas disponíveis na API:** `/fornecedores`, `/pedidos-compra` e `/ordens-servico/{numero}/vistoria` (a vistoria segue como overlay local, veja abaixo).

### O que permanece local (overlay)

A API cobre o núcleo operacional, mas parte dos campos complementares e telas ainda não migradas ficam no `localStorage`, mesclados com as respostas do servidor:

- Endereço e preferências de comunicação de clientes.
- Foto, proprietário, categoria e datas de revisão de veículos.
- Campos de apresentação da OS (título, tipo, canal, box, prioridade, linha do tempo) e a **vistoria** continuam com overlay de compatibilidade; o cabeçalho também é enviado à API via `PUT`.
- Peças sugeridas: persistidas na API, com overlay local como fallback.
- Serviços/peças excluídos: a API faz soft-delete (`ativo=false`) e o front mantém um overlay de exclusão para esconder itens antigos.
- Pedidos de compra e cotações rápidas do estoque continuam locais.
- No **modo demonstração**, a tela `/equipe` simula criação, edição, status e senha sem persistir nada; no modo API, todas as operações usam `/usuarios`.
- **Orçamentos** ainda usam dados fictícios com overlay local.
- **Vistoria da OS** (checklist, danos e fotos) continua local. A API guarda danos, pertences e observações, mas não tem checklist nem upload de fotos; as fotos são URLs temporárias do navegador.
- **Modo demonstração:** Agenda e Financeiro exibem aviso e não listam dados (dependem da API); Configurações mostra os dados fictícios em somente leitura; as notificações ficam vazias.
- Rascunhos de cadastro (cliente/veículo incompletos) ficam somente no navegador.

Chaves usadas: `salvo.session.v1`, `salvo.mode.v1` e `salvo.overlay.v1:*` (veja `src/services/storage.js`). Limpar os dados do navegador remove esses overlays.

### Fluxo de dados e erros

- Os hooks de estado (`src/context/use*State.js`) carregam a API e normalizam os DTOs em `src/services/mappers.js`, mantendo os formatos já usados pelas telas.
- `src/services/catalogs.js` mantém um cache de serviços/peças e resolve `id` da API ↔ código exibido (`SV-001`, `PC-001`).
- `src/services/mechanics.js` mantém a equipe técnica e os boxes atualizados para leituras síncronas de nome.
- `src/services/workshop.js` mantém os dados da oficina usados na impressão e nas mensagens.
- `useOficinaState` (OficinaContext) carrega `/mecanicos`, `/boxes` e `/oficina` em paralelo; uma falha em um recurso não derruba os outros.
- Enquanto há requisições, uma barra de progresso aparece no topo; falhas mostram um aviso global (dispensável) em `ApiFeedback`.
- Mutações são assíncronas e retornam `true`/registro criado ou `false`/`null`; as telas só exibem a mensagem de sucesso depois da confirmação da API.
- As listas paginadas são percorridas por completo (`getAll`) para manter os contadores e filtros atuais.

### Back-end: CORS

O navegador precisa que a API responda ao *preflight* `OPTIONS` com os cabeçalhos `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` e `Access-Control-Allow-Headers`. O back-end já possui `configs/CorsConfig.java`; confirme que a versão publicada no Render está atualizada e que a origem do front-end (ex.: `http://localhost:5173`) está liberada. Sem isso, o login falha com erro de CORS mesmo com a API no ar.

### Contratos e pontos de atenção

- A API devolve `Page` nas listas paginadas (`content`, `last`) e arrays simples em `/servicos`, `/pecas`, `/mecanicos`, `/usuarios`, `/fornecedores`, `/pedidos-compra`, `/pagamentos`, `/despesas`, `/agendamentos` e `/notificacoes`.
- Uma OS só pode ser criada para um veículo que pertença ao `clienteId` informado.
- A edição do cabeçalho da OS é um `PUT`: campos de texto/data enviados substituem os atuais e `null` limpa; campos com default (prioridade, parcelas, desconto, aprovação) só mudam quando enviados.
- Itens de OS agora têm `PUT` próprio; não é mais necessário excluir/recriar para mudar quantidade, valor, horas ou responsável.
- A foto do veículo e as fotos da vistoria hoje são URLs temporárias do navegador; para persistir seria necessário upload multipart (não existe na API). O `fotoUrl` do veículo só é enviado quando não é `blob:`.
- "Excluir" cliente/veículo/serviço/peça **desativa** o cadastro, preservando histórico e registros fiscais.
- Regras de etapa (ex.: executar só com orçamento aprovado) continuam validadas no front-end em `canMoveTo` (`pages/OrdensServico/ordemUtils.js`); a API valida o status, mas não repete todo o fluxo de negócio.
- Token inválido/expirado pode fazer a API responder `401` sem cabeçalhos CORS; o navegador mostra erro de CORS. Faça login novamente antes de investigar o `CorsConfig`.
- **Ordem de deploy:** publique o back-end com a V5 e com `/boxes` e `/oficina` antes do front, que depende deles para a equipe, os boxes e as configurações. A criação de funcionário exige `SUPABASE_SERVICE_ROLE_KEY` no back-end; sem ela, somente equipe/senha retornam `503` e o restante do sistema continua funcionando.

### Alterações recentes

Esta integração está detalhada em [docs/ALTERACOES.md](docs/ALTERACOES.md). Resumo:

- Camada `api.js`, `mappers.js`, `storage.js`, `catalogs.js` e `mechanics.js`.
- Login real, cadastro de oficina, sessão JWT, `RequireAuth` e `ApiFeedback`.
- Clientes, veículos, OS, catálogo e estoque migrados para a API.
- Tela `/equipe` com cadastro, edição, ativação/desativação e senha temporária via `/usuarios`.
- Telas de **Agenda**, **Financeiro** e **Configurações** (dados da oficina e boxes) integradas à API.
- Sino de **notificações** com contador real e lista das mais recentes.
- Dashboard com fluxo financeiro semanal calculado a partir de pagamentos e despesas reais (ADMIN).
- Boxes e dados da oficina carregados da API; impressos usam os dados reais da oficina.
- Perfis `ADMIN`/`FUNCIONARIO`: `RequireAdmin`, menu filtrado e dashboard financeiro oculto para funcionários.
- `/mecanicos` passou a refletir apenas funcionários ativos que executam OS.
- Overlays locais para campos sem suporte e telas ainda não migradas.
- Correções de compatibilidade com a V4 (status `PRONTA`/`ENTREGUE`, itens de OS, custo médio e soft-delete).

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
- **Não versionar:** `node_modules/`, `dist/` e `.env` (já estão no `.gitignore`). Versione apenas `.env.example`.

---

## Problemas comuns

**Erro `Failed to resolve import "..."` ao abrir o projeto**
Falta instalar as dependências ou o servidor foi iniciado antes da instalação. Rode `npm install`, pare o servidor (`Ctrl + C`) e inicie novamente com `npm run dev`. Se persistir, use `npm run dev -- --force` para refazer o cache do Vite.

**Estilos do Tailwind não aparecem**
Confirme que `src/index.css` começa com `@import "tailwindcss";` e que `src/main.jsx` importa esse arquivo. Reinicie o servidor.

**Erro de versão do Node**
O Vite 8 exige Node.js 20.19+ ou 22.12+. Verifique com `node -v`.

**Login falha com erro de CORS**
Confirme que a API está no ar (`/actuator/health`), que `VITE_API_URL` aponta para a URL correta e que a versão publicada do back-end está atualizada. Token inválido/expirado também pode gerar `401` sem cabeçalhos CORS; tente entrar novamente.

**"Não foi possível conectar à API"**
O back-end pode estar dormindo (Render free) ou fora do ar. Aguarde alguns segundos e tente novamente, ou use o **modo demonstração** na tela de login.

**Sessão expira e volta ao login**
É o comportamento esperado: ao receber `401`, o front limpa a sessão. Faça login novamente.

**Dados antigos aparecem após trocar de conta**
Os overlays ficam no `localStorage` do navegador (`salvo.overlay.v1:*`) e não são separados por oficina. Em um computador compartilhado, limpe os dados do site ao trocar de usuário.

---

## Equipe

<!-- Preencha com os integrantes do grupo. -->

| Nome | Função |
| --- | --- |
| _Nome do integrante_ | _Ex.: Front-end / Back-end / UX_ |
| _Nome do integrante_ | _..._ |
