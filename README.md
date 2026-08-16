# Community OS

Production-oriented SaaS foundation for managing Telegram communities.

## Stack

- TypeScript / Node.js
- Fastify API
- grammY Telegram adapter
- PostgreSQL + Drizzle ORM
- Redis + BullMQ
- Next.js dashboard
- Docker Compose for local infrastructure

## Architecture

This repository is a modular monolith. API, Telegram ingestion, workers and web UI are separate applications, while domain and database packages remain shared. Business authorization is server-side and community-scoped.

## Local development

Requirements: Node.js 22+, pnpm 10+ and Docker.

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm typecheck
pnpm test
```

The initial local infrastructure exposes PostgreSQL on `5432` and Redis on `6379`.

## Telegram webhook

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` and `PUBLIC_API_URL` in `.env`. The bot application exposes its webhook endpoint at `/telegram/webhook` on its configured listener.

Never commit `.env` or real Telegram credentials.

## Current implementation phase

Phase 0 foundation and the initial Phase 1 application skeleton are being implemented on `feat/community-os-foundation` before production features are layered on top.
