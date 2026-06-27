# Nexora Pulse

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-API-000000?logo=fastify&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111111)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

Command center operacional para roteamento, fila e monitoramento em tempo real de atendimentos. O projeto implementa o desafio tecnico FlowPay Attendance Router com uma experiencia visual de produto SaaS fintech: distribuicao automatica por assunto, controle de capacidade por atendente, fila FIFO por time, auditoria, metricas e dashboard reativo via WebSocket.

## Entrega

- Roteamento por assunto para `Time Cartoes`, `Time Emprestimos` e `Time Outros Assuntos`.
- Distribuicao automatica por menor carga, com desempate round-robin deterministico por time.
- Limite de capacidade por atendente e fila `QUEUED` quando o time esta cheio.
- Pull automatico do proximo item FIFO ao finalizar ou cancelar atendimento em andamento.
- Reatribuicao automatica quando um atendente fica offline; sem capacidade disponivel, o atendimento volta para a fila.
- Auditoria operacional persistida para criacao, atribuicao, fila, finalizacao, cancelamento, reatribuicao e status de atendente.
- Metricas em JSON e formato Prometheus.
- Dashboard React com KPIs, graficos, feed de atendimentos, painel de auditoria, status dos atendentes e atualizacao Socket.io.
- Docker Compose com API, web, PostgreSQL e Redis.
- Testes automatizados de dominio, workflow, API e frontend.

## Stack

- Monorepo com pnpm workspaces.
- API: Node.js 22, TypeScript, Fastify, Prisma, PostgreSQL, Redis, Socket.io, Zod, Pino e Swagger/OpenAPI.
- Web: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts e Sonner.
- Testes: Vitest, Supertest e Testing Library.
- DevOps local: Docker Compose, Dockerfiles multi-stage e Prisma migrations.

## Como Executar

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

Se o pnpm estiver disponivel apenas via Corepack:

```bash
corepack pnpm install
corepack pnpm dev
```

URLs principais:

- Web: `http://localhost:5173`
- API: `http://localhost:3333`
- Swagger: `http://localhost:3333/docs`
- Health: `http://localhost:3333/health`
- Readiness: `http://localhost:3333/ready`
- Prometheus metrics: `http://localhost:3333/metrics`

## Tour de 30s

1. Abra `http://localhost:5173`.
2. Crie um atendimento com assunto `Problemas com cartao` ou `Contratacao de emprestimo`.
3. Observe o roteamento automatico para o time correto e a atribuicao ao atendente com menor carga.
4. Crie atendimentos ate exceder a capacidade do time e veja a fila FIFO entrar em acao.
5. Finalize ou cancele um atendimento em andamento para ver o proximo item da fila ser atribuido.
6. Coloque um atendente offline e acompanhe a reatribuicao ou retorno para fila.
7. Consulte o painel de auditoria e o endpoint `/metrics` para verificar os eventos e indicadores.

## Como Testar

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Cobertura principal:

- roteamento por assunto;
- menor carga e round-robin;
- limite de capacidade;
- fila FIFO;
- pull automatico ao finalizar/cancelar;
- reatribuicao offline e retorno para fila sem capacidade;
- endpoints de dashboard, auditoria e metricas;
- renderizacao do dashboard e formulario de criacao.

## Dashboard Operacional

A primeira tela e o command center Nexora Pulse:

- sidebar compacta com areas de operacao, qualidade, relatorios e configuracoes;
- header com status ao vivo, websocket, busca, refresh, tema e perfil de supervisor;
- KPIs compactos para volume, fila, capacidade e tempo medio;
- formulario de criacao de atendimento com presets de assunto;
- graficos de fila por time, carga dos atendentes e distribuicao por time;
- painel de auditoria operacional com eventos recentes;
- lista de atendentes com status online/offline, capacidade e alternancia de disponibilidade;
- feed de atendimentos recentes com acoes de finalizar/cancelar;
- code splitting com `React.lazy` e `Suspense` para carregar graficos e bloco operacional sob demanda.

Validacao visual recomendada:

```txt
http://localhost:5173
1366x768, 1440x900, 1920x1080 e mobile basico
```

## API REST v1

Base REST: `/api/v1`

Swagger UI: `/docs`

Endpoints principais:

- Times: `GET /api/v1/teams`
- Atendentes: `GET /api/v1/attendants`, `POST /api/v1/attendants`, `PATCH /api/v1/attendants/:id/status`
- Atendimentos: `POST /api/v1/attendances`, `GET /api/v1/attendances`, `GET /api/v1/attendances/:id`
- Ciclo de atendimento: `PATCH /api/v1/attendances/:id/finish`, `PATCH /api/v1/attendances/:id/cancel`
- Dashboard: `GET /api/v1/dashboard/summary`, `/queues`, `/attendants-load`, `/recent-activity`
- Auditoria: `GET /api/v1/audit-events`
- Metricas: `GET /api/v1/metrics`, `GET /metrics`
- Operacao: `GET /health`, `GET /ready`

Criar atendimento:

```json
{
  "customerName": "Marina Teixeira",
  "subject": "Problemas com cartao"
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

Filtros uteis:

```txt
GET /api/v1/attendances?status=QUEUED&teamId=team-id&page=1&pageSize=20
GET /api/v1/audit-events?type=ATTENDANCE_REASSIGNED&entityType=ATTENDANCE&page=1&pageSize=20
```

## Eventos WebSocket

Socket.io usa `VITE_SOCKET_URL` com path `/socket.io`.

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

## Superficie de Decisao

| Cenario | Decisao | Evidencia |
| --- | --- | --- |
| Concorrencia na atribuicao | Transacao Prisma e `SELECT ... FOR UPDATE` no time e atendentes | `PrismaWorkflow`, testes de workflow |
| Time cheio | Atendimento fica `QUEUED` e preserva FIFO por `queuedAt`/`createdAt` | `workflow.spec.ts` |
| Atendente offline | Reatribui atendimentos ativos ou devolve para a fila sem violar capacidade | `workflow.spec.ts` |
| Observabilidade operacional | Eventos de auditoria e metricas Prometheus | `api.spec.ts`, `/api/v1/audit-events`, `/metrics` |
| Validacao de entrada | Zod no shared package e JSON Schema nas rotas Fastify | `packages/shared`, `apps/api/src/http/schemas.ts` |
| Realtime no dashboard | Socket.io publica eventos de dominio e o frontend invalida queries | `use-realtime.ts` |
| Chunk inicial do web | Graficos e coluna operacional em chunks lazy | build Vite gera `dashboard-charts` e `dashboard-operations-column` |

## Observabilidade e Seguranca

- Logs via Pino/Fastify.
- Request id por requisicao.
- `/health` e `/ready`.
- `/metrics` em formato Prometheus.
- Auditoria persistida em `AuditEvent`.
- Helmet, CORS por env e rate limit.
- Validacao Zod e JSON Schema.
- Sanitizacao basica de texto.
- Prisma com queries parametrizadas.
- Error handler global sem stack trace em producao.

## Arquitetura

```txt
apps/api
  src/domain                 regras puras: roteamento e distribuicao
  src/application            contratos e use cases
  src/infrastructure         Prisma, workflows e realtime
  src/http                   rotas, schemas, Swagger e error handler
  prisma                     schema, migrations e seed

apps/web
  src/components             dashboard, formulario, graficos e UI
  src/hooks                  websocket e invalidacao realtime
  src/lib                    cliente REST, query client e helpers

packages/shared
  schemas Zod, tipos DTO, constantes e eventos compartilhados
```

```mermaid
flowchart LR
  supervisor[Supervisor] --> web[React / Vite Dashboard]
  web -->|REST JSON| api[Fastify API]
  web <-->|Socket.io| api
  api --> app[Application Use Cases]
  app --> domain[Domain Rules]
  api --> prisma[Prisma Workflow]
  prisma --> postgres[(PostgreSQL)]
  api --> redis[(Redis)]
  api --> metrics[/Prometheus metrics/]
```

Clean Architecture foi aplicada de forma pragmatica: rotas validam entrada e chamam use cases; regras de negocio ficam no dominio; Prisma, Redis e Socket.io ficam como adaptadores de infraestrutura.

## Decisoes e Trade-offs

- A fila foi derivada de `Attendance` para reduzir complexidade e manter FIFO claro.
- Redis ficou dedicado ao realtime via adapter do Socket.io; cache adicional nao foi necessario para o core.
- Autenticacao complexa ficou fora para preservar foco em roteamento, concorrencia, dashboard e testes.
- Playwright ficou como melhoria futura porque o projeto nao tinha dependencia/browser setup instalado; adicionar isso agora aumentaria risco sobre o core.
- O dashboard invalida queries ao receber eventos em vez de manter estado duplicado manualmente.
- Round-robin usa cursor por time para desempate previsivel e simples.

## Roadmap Futuro

| Item | Motivo |
| --- | --- |
| Autenticacao, RBAC e permissoes granulares | Separar operadores, supervisores e administradores |
| OpenTelemetry distribuido e alertas externos | Aprofundar observabilidade alem das metricas atuais |
| Playwright E2E com WebSocket real | Cobrir a jornada completa no navegador |
| Analytics historico de SLA e abandono de fila | Transformar eventos operacionais em inteligencia de gestao |
| Dashboards Grafana versionados | Entregar paineis prontos em cima do endpoint Prometheus |
