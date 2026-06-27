# 🚀 Nexora Pulse

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-API-000000?logo=fastify&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111111)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

Command center operacional para roteamento, fila e monitoramento em tempo real de atendimentos. O projeto implementa um desafio técnico de distribuição de atendimentos com uma experiência visual de produto SaaS fintech: distribuição automática por assunto, controle de capacidade por atendente, fila FIFO por time, auditoria, métricas e dashboard reativo via WebSocket.

## 📦 Entrega

- ✅ Login real para usuários operacionais.
- ✅ Sessão via cookie HttpOnly assinado, sem token sensível em `localStorage`.
- ✅ Senhas com hash bcrypt e seed de usuários demo.
- ✅ RBAC básico com papéis `ADMIN` e `SUPERVISOR`.
- ✅ Rotas internas do dashboard e APIs REST protegidas.
- ✅ Socket.io protegido por cookie de sessão.
- ✅ Tela `/login` premium com identidade Nexora Pulse.
- ✅ Roteamento por assunto para `Time Cartões`, `Time Empréstimos` e `Time Outros Assuntos`.
- ✅ Distribuição automática por menor carga, com desempate round-robin determinístico por time.
- ✅ Limite de capacidade por atendente e fila `QUEUED` quando o time está cheio.
- ✅ Pull automático do próximo item FIFO ao finalizar ou cancelar atendimento em andamento.
- ✅ Reatribuição automática quando um atendente fica offline; sem capacidade disponível, o atendimento volta para a fila.
- ✅ Auditoria operacional persistida para criação, atribuição, fila, finalização, cancelamento, reatribuição e status de atendente.
- ✅ Métricas em JSON e formato Prometheus.
- ✅ Dashboard React com KPIs, gráficos, feed de atendimentos, painel de auditoria, status dos atendentes e atualização Socket.io.
- ✅ Sidebar colapsável com persistência em `localStorage`, rotas reais e favicon oficial.
- ✅ Docker Compose com API, web, PostgreSQL e Redis.
- ✅ Testes automatizados de domínio, workflow, API e frontend.

## 🧰 Stack

- Monorepo com pnpm workspaces.
- API: Node.js 22, TypeScript, Fastify, Prisma, PostgreSQL, Redis, Socket.io, Zod, bcrypt, Pino e Swagger/OpenAPI.
- Web: React 18, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Recharts e Sonner.
- Testes: Vitest, Supertest e Testing Library.
- DevOps local: Docker Compose, Dockerfiles multi-stage e Prisma migrations.

## ▶️ Como executar

Subir tudo em containers:

```bash
docker compose up --build
```

Rodar localmente usando Postgres/Redis do Compose:

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm --filter @flowpay/api prisma:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Se o pnpm estiver disponível apenas via Corepack:

```bash
corepack pnpm install
corepack pnpm dev
```

URLs principais:

- 🌐 Web: `http://localhost:5173`
- 🌐 Web alternativa usada na validação local: `http://localhost:5174`
- 🔌 API: `http://localhost:3333`
- 📚 Swagger: `http://localhost:3333/docs`
- 💚 Health: `http://localhost:3333/health`
- ✅ Readiness: `http://localhost:3333/ready`
- 📈 Prometheus metrics: `http://localhost:3333/metrics`

Para usar a web em `5174`, ajuste `WEB_ORIGIN=http://localhost:5174` e `VITE_API_URL` conforme a porta da API.

## 🔐 Autenticação e RBAC

A autenticação local foi implementada sem integração externa de SSO/OIDC. O login cria uma sessão assinada em cookie HttpOnly, com expiração padrão de 8 horas.

Segurança aplicada:

- senha nunca é salva em texto puro;
- hash bcrypt com salt automático;
- payload validado com Zod;
- mensagem genérica para credenciais inválidas;
- cookie `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção;
- CORS com `credentials: true` e origem configurável por env;
- rate limit específico no endpoint de login;
- logout limpa o cookie de sessão;
- APIs REST internas protegidas por autenticação;
- Socket.io valida o cookie antes de aceitar a conexão.

Papéis disponíveis:

- `ADMIN`: acessa tudo, cria usuários, cria atendentes e altera status de atendentes.
- `SUPERVISOR`: acessa dashboard, filas, atendentes, clientes, relatórios, qualidade e fluxo operacional de atendimentos.

Credenciais demo locais:

```txt
Admin:
admin@nexora.local / Admin@12345

Supervisor:
supervisor@nexora.local / Supervisor@12345
```

Essas credenciais existem apenas para ambiente local/demo e são criadas pelo seed com senha hasheada.

Executar seed:

```bash
pnpm db:seed
```

Variáveis de autenticação:

```env
AUTH_SECRET=change-this-local-secret-at-least-32-chars
AUTH_COOKIE_NAME=nexora_session
AUTH_SESSION_TTL_HOURS=8
WEB_ORIGIN=http://localhost:5174
```

Em produção, `AUTH_SECRET` é obrigatório.

## ⚡ Tour de 30s

1. Abra `http://localhost:5173` ou `http://localhost:5174`.
2. Você será redirecionado para `/login`.
3. Entre com `admin@nexora.local / Admin@12345`.
4. Crie um atendimento com assunto `Problemas com cartão` ou `Contratação de empréstimo`.
5. Observe o roteamento automático para o time correto e a atribuição ao atendente com menor carga.
6. Crie atendimentos até exceder a capacidade do time e veja a fila FIFO entrar em ação.
7. Finalize ou cancele um atendimento em andamento para ver o próximo item da fila ser atribuído.
8. Coloque um atendente offline e acompanhe a reatribuição ou retorno para fila.
9. Saia pelo botão de logout no header e confirme o retorno para `/login`.


## 🧪 Como testar

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Cobertura principal:

- login válido com cookie HttpOnly;
- login inválido com mensagem genérica;
- `/auth/me` com e sem cookie;
- logout limpando cookie;
- rota protegida retornando 401 sem autenticação;
- rota admin retornando 403 para supervisor;
- senha demo armazenada como hash;
- roteamento por assunto;
- menor carga e round-robin;
- limite de capacidade;
- fila FIFO;
- pull automático ao finalizar/cancelar;
- reatribuição offline e retorno para fila sem capacidade;
- endpoints de dashboard, auditoria e métricas;
- renderização do dashboard e formulário de criação.

## 🖥️ Dashboard operacional

A primeira tela é o command center Nexora Pulse:

- sidebar colapsável com áreas de operação, qualidade, relatórios e configurações;
- header com status ao vivo, websocket, busca, refresh, tema, usuário autenticado e logout;
- KPIs compactos para volume, fila, capacidade e tempo médio;
- formulário de criação de atendimento com presets de assunto;
- gráficos de fila por time, carga dos atendentes e distribuição por time;
- painel de auditoria operacional com eventos recentes;
- lista de atendentes com status online/offline, capacidade e alternância de disponibilidade;
- feed de atendimentos recentes com ações de finalizar/cancelar;
- modo claro com tokens próprios, contraste revisado e componentes legíveis;
- code splitting com `React.lazy` e `Suspense` para carregar gráficos e bloco operacional sob demanda.

Rotas disponíveis:

- `/login`
- `/dashboard` ou `/`
- `/attendances`
- `/queues`
- `/attendants`
- `/clients`
- `/reports`
- `/quality`
- `/settings`

Validação visual recomendada:

```txt
http://localhost:5173
1366x768, 1440x900, 1920x1080 e mobile básico
```

## 🔌 API REST v1

Base REST: `/api/v1`

Swagger UI: `/docs`

Endpoints principais:

- Autenticação: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- Usuários: `POST /api/v1/users` somente `ADMIN`
- Times: `GET /api/v1/teams`
- Atendentes: `GET /api/v1/attendants`, `POST /api/v1/attendants`, `PATCH /api/v1/attendants/:id/status`
- Atendimentos: `POST /api/v1/attendances`, `GET /api/v1/attendances`, `GET /api/v1/attendances/:id`
- Ciclo de atendimento: `PATCH /api/v1/attendances/:id/finish`, `PATCH /api/v1/attendances/:id/cancel`
- Dashboard: `GET /api/v1/dashboard/summary`, `/queues`, `/attendants-load`, `/recent-activity`
- Auditoria: `GET /api/v1/audit-events`
- Métricas: `GET /api/v1/metrics`, `GET /metrics`
- Operação: `GET /health`, `GET /ready`

Criar atendimento:

```json
{
  "customerName": "Marina Teixeira",
  "subject": "Problemas com cartão"
}
```

Criar atendente:

```json
{
  "name": "Paula Reis",
  "teamId": "team-id",
  "isOnline": true,
  "maxConcurrentAttendances": 3
}
```

Atualizar disponibilidade:

```json
{
  "isOnline": false
}
```

Filtros úteis:

```txt
GET /api/v1/attendances?status=QUEUED&teamId=team-id&page=1&pageSize=20
GET /api/v1/audit-events?type=ATTENDANCE_REASSIGNED&entityType=ATTENDANCE&page=1&pageSize=20
```

Login:

```json
{
  "email": "admin@nexora.local",
  "password": "Admin@12345"
}
```

Criar usuário como `ADMIN`:

```json
{
  "name": "Nome do Supervisor",
  "email": "supervisor.empresa@nexora.local",
  "password": "SenhaForte@123",
  "role": "SUPERVISOR"
}
```

## 📡 Eventos WebSocket

Socket.io usa `VITE_SOCKET_URL` com path `/socket.io`, envia cookies com `withCredentials` e valida a sessão antes de aceitar a conexão.

Eventos emitidos:

- `attendance.created`
- `attendance.assigned`
- `attendance.queued`
- `attendance.finished`
- `attendance.cancelled`
- `attendance.reassigned`
- `queue.updated`
- `attendant.updated`
- `dashboard.updated`

O frontend invalida queries do TanStack Query ao receber eventos e recarrega dashboard, filas, atendentes, atendimentos e auditoria.

## 🧭 Superfície de decisão

| Cenário | Decisão | Evidência |
| --- | --- | --- |
| Autenticação local | Cookie HttpOnly com JWT assinado | `auth/session.ts`, `routes.ts`, `api.spec.ts` |
| Senhas | bcrypt com salt automático | `auth/password.ts`, `seed.ts` |
| RBAC | `ADMIN` e `SUPERVISOR` com pre-handlers Fastify | `routes.ts`, `api.spec.ts` |
| Concorrência na atribuição | Transação Prisma e `SELECT ... FOR UPDATE` no time e atendentes | `PrismaWorkflow`, testes de workflow |
| Time cheio | Atendimento fica `QUEUED` e preserva FIFO por `queuedAt`/`createdAt` | `workflow.spec.ts` |
| Atendente offline | Reatribui atendimentos ativos ou devolve para a fila sem violar capacidade | `workflow.spec.ts` |
| Observabilidade operacional | Eventos de auditoria e métricas Prometheus | `api.spec.ts`, `/api/v1/audit-events`, `/metrics` |
| Validação de entrada | Zod no shared package e JSON Schema nas rotas Fastify | `packages/shared`, `apps/api/src/http/schemas.ts` |
| Realtime no dashboard | Socket.io publica eventos de domínio e o frontend invalida queries | `use-realtime.ts` |
| Chunk inicial do web | Gráficos e coluna operacional em chunks lazy | build Vite gera `dashboard-charts` e `dashboard-operations-column` |

## 🔐 Observabilidade e segurança

- Logs via Pino/Fastify.
- Request id por requisição.
- `/health` e `/ready`.
- `/metrics` em formato Prometheus.
- Auditoria persistida em `AuditEvent`.
- Helmet, CORS por env e rate limit.
- Validação Zod e JSON Schema.
- Sanitização básica de texto.
- Prisma com queries parametrizadas.
- Error handler global sem stack trace em produção.
- Cookies de autenticação HttpOnly.
- WebSocket autenticado por cookie.

## 🏗️ Arquitetura

```txt
apps/api
  src/auth                   senha, sessão e cookies
  src/domain                 regras puras: roteamento e distribuição
  src/application            contratos e use cases
  src/infrastructure         Prisma, workflows e realtime
  src/http                   rotas, schemas, Swagger e error handler
  prisma                     schema, migrations e seed

apps/web
  src/auth                   AuthProvider e rotas protegidas
  src/components             dashboard, formulário, gráficos e UI
  src/pages                  páginas roteadas do command center
  src/hooks                  websocket e invalidação realtime
  src/lib                    cliente REST, query client e helpers

packages/shared
  schemas Zod, tipos DTO, constantes e eventos compartilhados
```

```mermaid
flowchart LR
  supervisor[Supervisor/Admin] --> web[React / Vite Dashboard]
  web -->|Cookie HttpOnly + REST JSON| api[Fastify API]
  web <-->|Socket.io autenticado| api
  api --> app[Application Use Cases]
  app --> domain[Domain Rules]
  api --> prisma[Prisma Workflow]
  prisma --> postgres[(PostgreSQL)]
  api --> redis[(Redis)]
  api --> metrics[/Prometheus metrics/]
```

Clean Architecture foi aplicada de forma pragmática: rotas validam entrada e chamam use cases; regras de negócio ficam no domínio; Prisma, Redis e Socket.io ficam como adaptadores de infraestrutura.

## ⚖️ Decisões e trade-offs

- A fila foi derivada de `Attendance` para reduzir complexidade e manter FIFO claro.
- Redis ficou dedicado ao realtime via adapter do Socket.io; cache adicional não foi necessário para o core.
- Microsoft Entra/OIDC ficou fora para evitar dependência de tenant, secrets externos e configuração de provedor no desafio local.
- Playwright ficou como melhoria futura porque o projeto não tinha dependência/browser setup instalado; adicionar isso agora aumentaria risco sobre o core.
- O dashboard invalida queries ao receber eventos em vez de manter estado duplicado manualmente.
- Round-robin usa cursor por time para desempate previsível e simples.

## 🗺️ Roadmap futuro

| Item | Motivo |
| --- | --- |
| Microsoft Entra ID / OpenID Connect SSO | Login corporativo real com tenant e provedor externo |
| MFA | Elevar segurança de contas administrativas |
| Recuperação de senha | Fluxo seguro para redefinição controlada |
| Convite de usuários por e-mail | Onboarding operacional sem cadastro público |
| Política granular por organização | Permissões além de `ADMIN` e `SUPERVISOR` |
| Rotação e refresh token avançado | Sessões longas com menor exposição de access token |
| Auditoria avançada de login | Trilha de acesso, IP, user-agent e tentativas inválidas |
| OpenTelemetry distribuído e alertas externos | Aprofundar observabilidade além das métricas atuais |
| Playwright E2E com WebSocket real | Cobrir a jornada completa no navegador |
| Analytics histórico de SLA e abandono de fila | Transformar eventos operacionais em inteligência de gestão |
| Dashboards Grafana versionados | Entregar painéis prontos em cima do endpoint Prometheus |
