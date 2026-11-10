# Salvô — Gestão Automotiva

Sistema de gestão para oficinas mecânicas. Reúne em um só lugar o dia a dia da oficina: agenda, clientes, veículos, ordens de serviço (OS), orçamentos, estoque e financeiro.

Este repositório contém o **front-end** (React), integrado à API **salvo-api** (Spring Boot). Clientes, veículos, ordens de serviço, catálogo de serviços/peças e equipe técnica vêm da API; o restante continua com dados fictícios ou overlays locais (veja [Integração com a API](#integração-com-a-api)). Sem back-end disponível, use o **modo demonstração** na tela de login.

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
| Clientes | `/clientes` | Pronto (lista + cadastro, edição e exclusão em pop-ups; dados da API) |
| Veículos | `/veiculos` | Pronto (lista, ficha técnica, cadastro/edição com rascunho e exclusão em pop-ups; dados da API + overlay local) |
| OS (Ordens de Serviço) | `/ordens-de-servico`, `/ordens-de-servico/:numero` e `/ordens-de-servico/servicos` (catálogo de serviços) | Pronto (quadro Kanban, lista, detalhes em 4 abas, pop-ups e impressão; dados da API + overlay local) |
| Orçamentos | `/orcamentos` | Pronto (indicadores, funil comercial, lista, propostas em pop-up, WhatsApp, impressão e conversão em OS; dados fictícios) |
| Estoque | `/estoque` | Pronto (indicadores, inventário, movimentações, cadastro de peças, entradas/saídas/ajustes, cotação rápida e pedido de compra; catálogo da API + movimentações locais) |
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

O front-end está integrado ao back-end **salvo-api** (Spring Boot), por meio da camada `src/services/`. A interface continua funcionando sem o servidor graças ao **modo demonstração**.

### Configuração

```bash
# .env (na raiz do projeto)
VITE_API_URL=https://salvo-api.onrender.com
```

- `VITE_API_URL` é opcional; sem ela, o padrão é `https://salvo-api.onrender.com`.
- Copie `.env.example` para `.env` e ajuste a URL ao ambiente (local, homologação ou produção).
- O Vite só lê variáveis `VITE_*` no momento do build/dev — reinicie o servidor após alterar o `.env`.

### Login e sessão

- A tela `/login` autentica com `POST /auth/login` (e-mail + senha) e guarda o JWT no `localStorage` (`salvo.session.v1`).
- Em seguida `GET /auth/me` carrega nome, cargo, oficina e e-mail do usuário.
- Todas as rotas internas são protegidas por `RequireAuth`; sem sessão válida o usuário volta ao login.
- Em `401` a sessão é limpa e o usuário é redirecionado ao login. Os dados de sessão e modo ficam em `src/services/api.js`.
- **Modo demonstração:** o botão "Entrar no modo demonstração" usa os dados de `src/mocks/`, não faz chamadas à API e não altera o servidor. Use-o para navegar pelas telas sem credenciais ou com o back-end fora do ar.

### O que já vem da API

| Recurso | Endpoints usados | Observações |
| --- | --- | --- |
| Clientes | `GET/POST/PUT/DELETE /clientes` | Lista paginada; "excluir" desativa o cadastro na API. |
| Veículos | `GET/POST/PUT/DELETE /clientes/{id}/veiculos`, `/veiculos/{id}` | Lista paginada; campos sem suporte na API ficam em overlay local. |
| Ordens de Serviço | `GET/POST /ordens-servico`, `GET /ordens-servico/{numero}`, `PATCH /{numero}/status`, `POST/DELETE /{numero}/servicos` e `/pecas` | Resumo paginado + detalhe por número; itens são sincronizados por exclusão/recriação. |
| Serviços | `GET /servicos` | Catálogo somente leitura na API. |
| Peças | `GET /pecas` | Catálogo somente leitura na API. |
| Equipe técnica | `GET /mecanicos` | Alimenta filtros, seleção de responsável e boxes. |
| Usuário | `POST /auth/login`, `GET /auth/me` | JWT Bearer em todas as chamadas. |

### O que permanece local (overlay)

A API ainda não expõe endpoints para tudo, então estes dados são persistidos no `localStorage` e mesclados com as respostas do servidor:

- Endereço, preferências de comunicação e classificação estendida de clientes.
- Foto, proprietário, categoria e datas de revisão de veículos.
- Título, tipo, canal, box, prioridade, vistoria, pagamento, garantia, aprovação e linha do tempo das OS.
- Cadastro/edição/exclusão de serviços e peças do catálogo.
- Movimentações de estoque, pedidos de compra e baixa automática de peças.
- **Orçamentos, Dashboard, Agenda e Financeiro** continuam apenas com dados fictícios (não há endpoints no back-end).
- Rascunhos de cadastro (cliente/veículo incompletos) ficam somente no navegador.

Chaves usadas: `salvo.*` (veja `src/services/storage.js`). Limpar os dados do navegador remove esses overlays.

### Fluxo de dados e erros

- Os hooks de estado (`src/context/use*State.js`) carregam a API e normalizam os DTOs em `src/services/mappers.js`, mantendo os formatos já usados pelas telas.
- Enquanto há requisições, uma barra de progresso aparece no topo; falhas mostram um aviso global (dispensável) em `ApiFeedback`.
- Mutações são assíncronas e retornam `true`/registro criado ou `false`/`null`; as telas só exibem a mensagem de sucesso depois da confirmação da API.
- As listas paginadas são percorridas por completo (`getAll`) para manter os contadores e filtros atuais.

### Back-end: CORS

O navegador precisa que a API responda ao *preflight* `OPTIONS` com os cabeçalhos `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` e `Access-Control-Allow-Headers`. O back-end já possui `configs/CorsConfig.java`; confirme que a versão publicada no Render está atualizada e que a origem do front-end (ex.: `http://localhost:5173`) está liberada. Sem isso, o login falha com erro de CORS mesmo com a API no ar.

### Contratos e pontos de atenção

- A API devolve `Page` nas listas (`content`, `last`) e arrays simples em `/servicos`, `/pecas` e `/mecanicos`.
- Uma OS só pode ser criada para um veículo que pertença ao `clienteId` informado.
- `CriarOsDTO` aceita `mecanicoLiderId`, mas ignora `boxId`; não há endpoint para editar metadados da OS.
- Itens de OS não têm endpoint de atualização: alterar quantidade/valor/horas/Responsável exige excluir e recriar o item.
- A foto do veículo e as fotos da vistoria hoje são URLs temporárias do navegador; para persistir seria necessário upload multipart (não existe na API).
- "Excluir" cliente/veículo **desativa** o cadastro, preservando histórico e registros fiscais.
- Regras de etapa (ex.: executar só com orçamento aprovado) continuam validadas no front-end em `canMoveTo` (`pages/OrdensServico/ordemUtils.js`); o back-end deve validar as mesmas regras.

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
