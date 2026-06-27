# Nexora Pulse

AI Operations Command Center para distribuicao e monitoramento em tempo real de atendimentos. Este projeto implementa o desafio tecnico FlowPay Attendance Router, mas a experiencia visual do produto foi apresentada como Nexora Pulse, um command center SaaS fintech com foco em operacao, roteamento inteligente e acompanhamento de capacidade em tempo real.

O produto roteia atendimentos por assunto, respeita capacidade maxima por atendente, usa fila FIFO por time quando a capacidade esta cheia e atualiza o dashboard via WebSocket sem refresh.

## Stack

- Monorepo: pnpm workspaces
- API: Node.js, TypeScript, Fastify, Prisma, PostgreSQL, Redis, Socket.io, Zod, Pino, Swagger/OpenAPI
- Web: React, Vite, TypeScript, Tailwind CSS, componentes estilo shadcn/ui, TanStack Query, React Hook Form, Zod, Recharts, Sonner
- Testes: Vitest, Supertest, Testing Library
- DevOps: Docker Compose com api, web, postgres e redis

## Arquitetura

```txt
apps/api
  src/domain                 regras puras: roteamento e distribuicao
  src/application            contratos e use cases
  src/infrastructure         Prisma, workflows, realtime
  src/http                   rotas, schemas, Swagger, error handler
  prisma                     schema, migration e seed

apps/web
  src/components             dashboard, formulario, graficos e UI
  src/hooks                  websocket e invalidacao em tempo real
  src/lib                    cliente REST, query client e helpers

packages/shared
  schemas Zod, tipos DTO, constantes e eventos compartilhados
```

Clean Architecture foi aplicada de forma pragmatica: controllers validam entrada e chamam use cases; regra de negocio fica fora das rotas; Prisma e WebSocket ficam como adaptadores de infraestrutura.

## Regras implementadas

- `Problemas com cartao` vai para `Time Cartoes`.
- `Contratacao de emprestimo` vai para `Time Emprestimos`.
- Qualquer outro assunto vai para `Time Outros Assuntos`.
- Cada atendente atende no maximo 3 clientes simultaneos por padrao.
- A distribuicao escolhe menor carga atual.
- Empate usa cursor round-robin deterministico por time.
- Se todos estiverem cheios, o atendimento fica `QUEUED`.
- Ao finalizar ou cancelar atendimento em andamento, o proximo item FIFO do time e atribuido automaticamente.
- Mudancas publicam eventos Socket.io para o dashboard.

## Concorrencia

O fluxo critico de atribuicao usa transacao Prisma com PostgreSQL e bloqueia a linha do time e os atendentes do time via `SELECT ... FOR UPDATE`. Isso serializa atribuicoes concorrentes no mesmo time, recalcula carga dentro da transacao e evita passar do limite por atendente.

A fila e derivada de `Attendance` com `status = QUEUED`, ordenada por `queuedAt` e `createdAt`. Isso evita uma tabela extra sem perder robustez para o escopo do desafio.

## Como rodar localmente

Requisitos:

- Node.js 22+
- pnpm 9+
- Docker, para Postgres e Redis locais

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm --filter @flowpay/api prisma:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

URLs:

- Web: http://localhost:5173
- API: http://localhost:3333
- Swagger: http://localhost:3333/docs
- Health: http://localhost:3333/health
- Ready: http://localhost:3333/ready

## Como rodar com Docker

```bash
docker compose up --build
```

O container da API executa migrations e seed antes de subir o servidor. O seed cria os 3 times, atendentes iniciais e uma amostra profissional de atendimentos de demo. Ele tambem remove registros antigos claramente genericos, como `Cliente Docker`, `Cliente Socket` e `Cliente Test`.

## Variaveis de ambiente

Veja `.env.example`.

Principais:

- `DATABASE_URL`: conexao PostgreSQL usada pelo Prisma.
- `REDIS_URL`: Redis usado pelo adapter do Socket.io e readiness.
- `CORS_ORIGIN`: origem permitida para web e websocket.
- `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW`: rate limit do Fastify.
- `VITE_API_URL`: URL REST consumida pelo frontend.
- `VITE_SOCKET_URL`: URL Socket.io consumida pelo frontend.

## Scripts

```bash
pnpm dev          # api e web em modo desenvolvimento
pnpm build        # build de todos os pacotes
pnpm lint         # ESLint
pnpm typecheck    # TypeScript sem emitir arquivos
pnpm test         # testes automatizados
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # seed de times e atendentes
```

Se o pnpm estiver disponivel apenas via Corepack:

```bash
corepack pnpm install
corepack pnpm test
```

## Dados demo locais

Para atualizar a massa demo profissional local:

```bash
pnpm db:seed
```

O seed e idempotente para o ambiente de desafio/demo: ele recria os atendimentos profissionais da Nexora Pulse quando a amostra esta incompleta e remove nomes genericos de seeds antigos.

Para um reset completo local, apagando volumes do Postgres de desenvolvimento, use apenas em ambiente local/demo:

```bash
docker compose down -v
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
```

## Endpoints principais

Base REST: `/api/v1`

- `GET /health`
- `GET /ready`
- `GET /api/v1/teams`
- `GET /api/v1/attendants`
- `POST /api/v1/attendants`
- `PATCH /api/v1/attendants/:id/status`
- `POST /api/v1/attendances`
- `GET /api/v1/attendances`
- `GET /api/v1/attendances/:id`
- `PATCH /api/v1/attendances/:id/finish`
- `PATCH /api/v1/attendances/:id/cancel`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/queues`
- `GET /api/v1/dashboard/attendants-load`
- `GET /api/v1/dashboard/recent-activity`

## Exemplos de payload

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

Atualizar status do atendente:

```json
{
  "isOnline": false
}
```

Filtros de atendimentos:

```txt
GET /api/v1/attendances?status=QUEUED&teamId=team-id&page=1&pageSize=20
```

## Eventos WebSocket

Socket.io em `VITE_SOCKET_URL` com path `/socket.io`.

Eventos emitidos:

- `attendance.created`
- `attendance.assigned`
- `attendance.queued`
- `attendance.finished`
- `attendance.cancelled`
- `queue.updated`
- `attendant.updated`
- `dashboard.updated`

O frontend invalida as queries do TanStack Query ao receber eventos e recarrega metricas, filas, atendentes e atividade recente.

## Dashboard

A primeira tela e o command center operacional Nexora Pulse:

- sidebar compacta com BrandMark, areas de operacao, qualidade, relatorios e configuracoes
- header com status ao vivo, websocket, busca global, refresh, notificacoes, tema e perfil de supervisor
- KPIs compactos com iconografia, bordas luminosas, micro trends e glassmorphism
- modulo de criacao de atendimento com presets de rota e feedback de roteamento
- fila por time com ring/radar permanente, mesmo quando a fila esta zerada
- carga dos atendentes com barras HUD e cores por nivel de ocupacao
- painel de distribuicao por time com donut e legenda
- lista de atendentes com avatar, status, alerta de lotacao e barra de capacidade
- feed de atendimentos recentes com avatares, badges, acoes e scroll interno
- indicador de conexao WebSocket, loading states, empty states, toasts e dark mode padrao

Validacao visual recomendada:

```txt
http://localhost:5173
1366x768, 1440x900, 1920x1080 e mobile basico
```

Em 1366x768, a primeira dobra deve mostrar sidebar, header, KPIs, entrada assistida, fila por time, carga dos atendentes e o inicio dos modulos inferiores.

## Testes

Cobertura principal:

- roteamento por assunto
- capacidade maxima
- menor carga e round-robin
- fila FIFO
- pull automatico ao finalizar
- criacao/finalizacao/dashboard/validacao da API
- renderizacao do dashboard e formulario no frontend

```bash
pnpm test
```

## Observabilidade e seguranca

- Pino via logger do Fastify
- request id por request
- `/health` e `/ready`
- Helmet
- CORS configurado por env
- rate limit
- validacao Zod e JSON Schema
- sanitizacao basica de texto
- Prisma para queries parametrizadas
- error handler global sem stack trace em producao

## Decisoes e trade-offs

- A fila foi derivada de `Attendance` para reduzir complexidade e manter FIFO claro.
- Redis foi usado como infraestrutura de realtime via adapter do Socket.io; cache adicional ficou fora do escopo por nao agregar ao core.
- Sem autenticacao complexa para preservar foco no roteamento, concorrencia, dashboard e testes.
- O dashboard invalida queries ao receber eventos em vez de manter estado duplicado manualmente.
- Round-robin usa cursor por time para desempate previsivel e simples.

## Melhorias futuras

- Autenticacao e RBAC para supervisores.
- Auditoria detalhada de eventos.
- Metricas Prometheus/OpenTelemetry.
- Reatribuicao automatica quando atendente fica offline.
- Code splitting do dashboard para reduzir chunk inicial.
- Teste end-to-end com Playwright cobrindo WebSocket real.
