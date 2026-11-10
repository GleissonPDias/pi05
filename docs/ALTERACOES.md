# Changelog — Front-end (integração com a API)

Registro das alterações feitas nesta entrega para integrar o front-end React à API **salvo-api** e compatibilizar com a V4 multi-oficina.

**Commit:** `8f7ba7e feat(api): integra frontend ao backend Spring`

---

## Resumo

O front deixou de depender apenas de `src/mocks/` nas telas operacionais. Clientes, veículos, ordens de serviço, catálogo (serviços/peças), estoque e equipe técnica agora são carregados e gravados na API, com **modo demonstração** como fallback e **overlays locais** para o que a API ainda não cobre.

Principais frentes:

1. Cliente HTTP, sessão JWT, tratamento de erros e feedback global.
2. Login real + cadastro de oficina.
3. Proteção de rotas e sincronização de sessão.
4. Mapeamento DTO ↔ formato das telas.
5. Migração dos módulos Clientes, Veículos, OS, Catálogo e Estoque.
6. Overlays persistentes para campos/telas ainda sem suporte.
7. Ajustes de compatibilidade com a V4.

---

## 1. Camada de API

### Adicionado

- `src/services/api.js`:
  - base URL por `VITE_API_URL` (padrão `https://salvo-api.onrender.com`);
  - sessão JWT em `localStorage` (`salvo.session.v1`);
  - modo demo em `localStorage` (`salvo.mode.v1`);
  - `getAll()` para percorrer todas as páginas de endpoints `Page`;
  - `ApiError` com `status`, `code` e `details`;
  - assinatura de eventos (`subscribe`) para barra de progresso, erros e `401`;
  - limpeza automática da sessão em `401`.
- `src/services/mappers.js`: conversão de DTOs da API para o formato das telas e vice-versa:
  - status da OS (`ABERTA`, `EM_EXECUCAO`, `PRONTA`, `ENTREGUE`...);
  - prioridade, classificação, garantia, desconto, aprovação;
  - cliente, veículo, serviço, peça, movimentação e OS;
  - payloads de criação/edição;
  - overlay de OS e itens.
- `src/services/storage.js`: overlays versionados em `salvo.overlay.v1:*`, com leitura/escrita de mapas, listas e patch por id.
- `src/services/catalogs.js`: cache compartilhado de serviços/peças, resolução `id` ↔ código (`SV-001`, `PC-001`) e carregamento único.
- `src/services/mechanics.js`: registro mutável da equipe técnica para leituras síncronas de nome.

### Ajustado

- `src/App.jsx`: login/cadastro fora do `AppProviders` (nenhuma chamada autenticada antes da sessão); rotas internas sob `RequireAuth`.
- `src/components/ApiFeedback.jsx`: barra de progresso e aviso global dispensável.
- `src/components/RequireAuth.jsx`: redireciona para `/login` sem sessão.

---

## 2. Autenticação e cadastro

### Adicionado

- `src/context/AuthProvider.jsx`:
  - `login(email, senha)` via `POST /auth/login`;
  - `register(payload)` via `POST /auth/registrar`;
  - `loginDemo()` sem chamadas à API;
  - `logout()` limpando sessão, modo, catálogos e equipe;
  - `reload()` para revalidar a sessão;
  - tratamento de `401` e de API fora do ar.
- `src/pages/Register/Register.jsx`: formulário de oficina (nome, responsável, telefone, CNPJ, e-mail, senha), com mensagem de confirmação de e-mail quando o Supabase não devolve sessão.

### Comportamento

- Login bem-sucedido salva `access_token` e carrega `GET /auth/me`.
- Se `GET /auth/me` falhar por rede logo após o login, a sessão é mantida e o usuário entra com dados básicos.
- Em `401`, sessão e modo são limpos e o usuário volta ao login.
- No modo demo, os dados vêm de `src/mocks/` e nada é enviado ao servidor.

---

## 3. Módulos migrados

### Clientes

- Lista paginada da API (`GET /clientes`) com busca.
- Criação, edição e desativação via API.
- Exclusão = `DELETE` (soft-delete), preservando histórico.
- Endereço e preferências de comunicação continuam em overlay.

### Veículos

- Lista da API e vínculo com cliente.
- Criação em `/clientes/{id}/veiculos`.
- Edição e desativação via API.
- Foto (URL blob), proprietário, categoria e revisões em overlay.
- `kmAtual` atualizado também na API.

### Ordens de serviço

- Lista paginada + detalhe por número.
- Criação com cabeçalho completo.
- Edição do cabeçalho via `PUT /ordens-servico/{numero}`.
- Mudança de status via `PATCH /{numero}/status`.
- Serviços e peças: criação, **edição por `PUT`** e remoção.
- Histórico carregado da API quando disponível; linha do tempo complementar em overlay.
- Status novos mapeados: `PRONTA` e `ENTREGUE`; `CONCLUIDA` legado continua lido como `entregue`.

### Catálogo de serviços

- CRUD na API (`POST/PUT/DELETE /servicos`).
- Exclusão lógica (`ativo=false`) + overlay local para esconder itens antigos.
- Peças sugeridas persistidas em `/servicos/{id}/pecas-sugeridas`, com fallback local.
- Código automático da API (`SV-001`).

### Estoque

- Catálogo de peças na API (`GET/POST/PUT/DELETE /pecas`).
- Movimentações persistidas (`POST /pecas/{id}/movimentacoes`):
  - entrada, saída, ajuste e devolução;
  - ajuste envia a nova contagem física;
  - histórico carregado de `/estoque/movimentacoes`.
- Exclusão lógica + overlay.
- Pedidos de compra e cotação rápida continuam locais.

### Equipe técnica

- `GET /mecanicos` alimenta filtros, impressão e seleção de responsável. Os boxes continuam estáticos em `src/mocks/oficina.js`, pois não há endpoint de boxes.

---

## 4. Overlays locais

Permanecem no `localStorage`:

| Chave | Conteúdo |
| --- | --- |
| `clients` | Endereço e preferências de comunicação |
| `deactivatedClients` | Clientes desativados localmente |
| `vehicles` / `localVehicles` | Foto, proprietário, categoria, revisões e rascunhos |
| `orders` | Campos de apresentação, vistoria, pagamento, garantia, aprovação, timeline |
| `services` / `localServices` / `deletedServices` | Complementos e itens excluídos |
| `parts` / `localParts` / `deletedParts` | Complementos e itens excluídos |
| `movements` | Histórico/ordens de compra locais |
| `quotes` | Orçamentos (ainda fictícios) |

Limpar os dados do navegador remove os overlays. Eles **não são separados por oficina**; em computador compartilhado, limpe os dados ao trocar de usuário.

---

## 5. Limitações resolvidas

### Edição de itens da OS

Antes, alterar quantidade, valor, horas ou responsável exigia excluir e recriar o item. Agora o front usa `PUT /ordens-servico/{numero}/servicos/{id}` e `PUT .../pecas/{id}`.

### Edição do cabeçalho da OS

Antes não existia endpoint; título, tipo, canal, box, prioridade, pagamento, garantia e aprovação ficavam apenas no overlay. Agora o front envia o cabeçalho via `PUT /ordens-servico/{numero}`.

### Catálogo persistido

Antes serviços/peças criados no front viviam apenas no navegador. Agora o CRUD é feito na API, com soft-delete e código automático.

### Peças sugeridas persistidas

Antes ficavam só no overlay. Agora são gravadas em `servico_pecas_sugeridas`; o overlay permanece como fallback.

### Movimentações de estoque persistidas

Antes o saldo e as movimentações eram locais. Agora o front envia movimentações para a API, que aplica o trigger de saldo e devolve o saldo atualizado.

---

## 6. Bugs e problemas encontrados na validação

### Sessão expirada exibindo erro de CORS

**Sintoma:** o navegador mostrava erro de CORS ao acessar a API.
**Causa:** a API responde `401` sem cabeçalhos CORS quando o token está inválido/expirado.
**Contorno no front:** em `401`, a sessão é limpa e o usuário volta ao login; a mensagem global orienta a entrar novamente.

### `POST /auth/registrar` com e-mail para confirmação

**Sintoma:** o cadastro era concluído, mas o usuário não entrava.
**Causa:** com confirmação de e-mail ativa no Supabase, a resposta não traz `access_token`.
**Correção:** o front detecta a ausência de token e exibe a mensagem para confirmar o e-mail; quando há token, faz login automático.

### Status `PRONTA`/`ENTREGUE` duplicados

**Sintoma:** OS em `PRONTA` apareciam como `entregue` na interface antiga.
**Causa:** o mapeamento tratava `EM_TESTE`/`CONCLUIDA` como equivalentes.
**Correção:** `mappers.js` separa `PRONTA` → `pronta` e `ENTREGUE` → `entregue`, mantendo `CONCLUIDA` como legado.

### Custo/estoque divergentes após movimentação

**Sintoma:** o saldo retornado podia não refletir o trigger do banco.
**Causa:** o back-end precisou ajustar a ordem de `flush`/`refresh` e não salvar a entidade inteira após a movimentação.
**Correção:** o contrato da API passou a devolver `saldoAtual`/`saldoPosterior`, e o front usa esses valores para atualizar a peça.

### Exclusão de catálogo “ressuscitando” itens

**Sintoma:** itens excluídos voltavam ao recarregar.
**Causa:** a API faz soft-delete, mas a lista ainda podia trazer o item inativo em cache local.
**Correção:** o front combina `ativo=false` com um overlay de exclusão (`deletedServices`/`deletedParts`).

---

## 7. Validação executada

- `npm run lint`: **0 erros**, 6 avisos `react-hooks/exhaustive-deps` (dependências de efeitos; não bloqueiam).
- `npm run build`: **passou**.
- Testes manuais de navegação:
  - login real e modo demonstração;
  - cadastro de oficina;
  - CRUD de clientes/veículos;
  - criação/edição/status de OS;
  - itens de OS (criar, editar, remover);
  - catálogo de serviços/peças com exclusão;
  - movimentações de estoque;
  - mensagens de erro globais e expiração de sessão.

Não foram criados registros de teste permanentes no banco do usuário.

---

## 8. O que ainda não foi migrado

- **Dashboard** — dados fictícios.
- **Orçamentos** — dados fictícios + overlay local.
- **Agenda** — página provisória (API `/agendamentos` pronta).
- **Financeiro** — página provisória (API `/pagamentos` e `/despesas` pronta).
- **Fornecedores** — sem tela (API pronta).
- **Pedidos de compra** — fluxo local (API `/pedidos-compra` pronta).
- **Notificações** — sem tela (API pronta).
- **Vistoria** — tela existe, mas ainda usa overlay local; endpoints `GET/PUT /ordens-servico/{numero}/vistoria` prontos.
- **Upload de fotos** — a API só aceita URL; não há upload multipart.

---

## 9. Ordem de deploy

1. Publicar o back-end `salvo-api` com a V4 aplicada pelo Flyway.
2. Confirmar `GET /actuator/health` e o Swagger.
3. Publicar o front com `VITE_API_URL` apontando para a API.
4. Validar login, listas e uma criação/edição de OS.

Publicar o front antes do back-end pode causar erros de contrato (campos/endpoints novos ainda inexistentes).
