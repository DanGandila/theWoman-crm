# theWoman CRM

CRM for thewoman.ro — first draft covering **users**, **projects** and **tasks**.

- `backend/` — NestJS (Fastify) + Prisma + PostgreSQL, JWT auth
- `frontend/` — React + Vite + Tailwind PWA, TanStack Query, Zustand

Local development runs against a Dockerised Postgres; production uses NeonDB.

## Local setup

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Create the backend env file (defaults point at the local Docker DB)
cp backend/.env.example backend/.env

# 3. Start Postgres
npm run db:up

# 4. Create tables + seed the first admin
npm run db:migrate
npm run db:seed

# 5. Start backend (terminal 1)
npm run backend

# 6. Start frontend (terminal 2)
npm run frontend
```

Open http://localhost:5173 and log in with the seeded account:

```
admin@thewoman.ro / password123
```

The API is served under http://localhost:3000/api/v1.

The Postgres container publishes **host port 5433** (not 5432) so it can run at the same
time as the `rotb-crm` database container. `npm run db:down` stops it; add `-v` to wipe
the volume.

## Deployment

**Backend → Railway.** `backend/railway.toml` points at `backend/Dockerfile`, which runs
`prisma migrate deploy` before booting. Set these service variables:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon connection string (pooled) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | long random strings |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` / `30d` |
| `FRONTEND_URL` | the Cloudflare Pages origin, for CORS |
| `PORT` | Railway injects this |

If `prisma migrate` ever rejects Neon's pooled URL, run the migration with the direct
(non-pooled) connection string instead.

**Frontend → Cloudflare Pages.** Build command `npm run build`, output directory `dist`,
root directory `frontend`. Set `VITE_API_URL` to the Railway backend, including the
prefix: `https://<service>.up.railway.app/api/v1`. `public/_redirects` already handles
SPA fallback and the service-worker files.

## Scope of this draft

Intentionally left out (present in the sibling `rotb-crm` app, to be ported as needed):
activity log, email notifications, file attachments, comments, subtasks, sales pipeline,
Gantt view, contacts and suppliers. The UI is deliberately plain — styling comes next.
