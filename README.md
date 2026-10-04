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
| OS (Ordens de Serviço) | `/ordens-de-servico` | Pendente |
| Orçamentos | `/orcamentos` | Pendente |
| Estoque | `/estoque` | Pendente |
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
    ├── components/             # Componentes compartilhados entre telas
    │   ├── Aside/              # Menu lateral (gaveta no celular)
    │   ├── Header/             # Cabeçalho (busca, status, notificações, usuário)
    │   └── ui/                 # Peças reutilizáveis: Button, Card, Modal, TextField...
    │
    ├── context/                # Dados compartilhados entre telas (clientes e veículos) + AppProviders
    │
    ├── hooks/                  # Hooks compartilhados: useToast, useClientes, useVeiculos
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
    │   └── PlaceholderPage.jsx # Página provisória das telas pendentes
    │
    ├── mocks/                  # Dados fictícios (serão trocados pela API)
    │   ├── dashboard.js
    │   ├── clientes.js
    │   ├── veiculos.js         # Veículos ligados aos clientes pelo campo ownerId
    │   └── user.js             # Usuário logado fictício
    │
    ├── services/               # Chamadas a serviços externos (ex.: busca de CEP)
    │   └── cep.js
    │
    └── utils/                  # Funções auxiliares
        ├── cn.js               # Junta classes CSS condicionais
        ├── format.js           # Formatação de moeda (BRL) e números
        ├── masks.js            # Máscaras: CPF/CNPJ, telefone, CEP, placa, km
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
| `TextField` / `SelectField` / `Checkbox` | Campos de formulário com rótulo, mensagem de erro e acessibilidade já ligados |
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
- Pontos já marcados no código com `TODO`: dados do usuário (`mocks/user.js`), filtro de período do Dashboard e as operações do CRUD de clientes e de veículos (`context/useClientesState.js` e `context/useVeiculosState.js`, hoje em memória: os dados voltam ao original ao recarregar a página).
- A busca de endereço pelo CEP já usa a API pública ViaCEP (`src/services/cep.js`).
- Clientes e veículos ficam em `src/context/` (estado compartilhado), porque as telas se conversam: o cadastro de veículo permite criar um cliente na hora, a lista de clientes mostra os veículos de cada um e desativar um cliente desvincula os veículos dele. Ao integrar a API, troque o corpo das funções de `context/useClientesState.js` e `context/useVeiculosState.js` por chamadas HTTP, mantendo as assinaturas.
- A foto do veículo hoje é um endereço temporário do navegador; na API ela deve ser enviada como arquivo (multipart) e a resposta traz a URL definitiva.
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
