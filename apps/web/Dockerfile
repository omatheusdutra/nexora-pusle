FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

ARG VITE_API_URL=http://localhost:3333/api/v1
ARG VITE_SOCKET_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY . .

RUN pnpm install --prod=false --frozen-lockfile

RUN pnpm --filter @flowpay/web build

EXPOSE 5173
CMD ["pnpm", "--filter", "@flowpay/web", "preview", "--host", "0.0.0.0", "--port", "5173"]
