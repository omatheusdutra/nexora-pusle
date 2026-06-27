FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

COPY . .

RUN pnpm install --prod=false --frozen-lockfile

RUN pnpm --filter @flowpay/api prisma:generate
RUN pnpm --filter @flowpay/api build

EXPOSE 3333
CMD ["pnpm", "--filter", "@flowpay/api", "start:migrate"]
