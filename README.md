# Medication Inventory

Full-stack application for tracking medication inventory in a healthcare facility. Nurses check out controlled substances, use some amount, and return the remainder. Every transaction must be witnessed and logged for audit.

## Stack

### Backend
- **Runtime:** Node.js 25 + TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL 18 + Prisma ORM
- **Validation:** Zod
- **Testing:** Vitest + Supertest

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Routing:** React Router 7

### Infrastructure
- **Containerization:** Docker + Docker Compose

## Quick Start

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |

The database is automatically migrated and seeded on startup.

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/medications` | Browse and create medications |
| `/medications/:slug` | Medication detail with transaction history |
| `/transactions` | Browse and create transactions |
| `/audit-log` | View audit log entries |

### Seeded Data

**Users:**
| Name | Email | Role |
|------|-------|------|
| Jane Smith | nurse@hospital.com | NURSE |
| John Doe | witness@hospital.com | WITNESS |
| Alice Johnson | admin@hospital.com | ADMIN |

**Medications:** Morphine Sulfate (Schedule II), Fentanyl (Schedule II), Codeine (Schedule III), Diazepam (Schedule IV), Pregabalin (Schedule V)

## API Endpoints

All endpoints prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/medications | List medications (filter: `?schedule=II`, pagination: `?page=1&limit=20`) |
| GET | /api/medications/:id | Get medication with transaction history |
| POST | /api/medications | Create a medication |
| GET | /api/transactions | List transactions (filter: `?type=CHECKOUT&medicationId=`) |
| POST | /api/transactions | Create a transaction (checkout, return, or waste) |
| GET | /api/audit-log | List audit log entries (filter: `?entityType=Transaction`) |

### Create Transaction Example

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "medicationId": "<medication-uuid>",
    "nurseId": "<nurse-uuid>",
    "witnessId": "<witness-uuid>",
    "type": "CHECKOUT",
    "quantity": 50
  }'
```

### Transaction Rules

- **CHECKOUT** decreases medication stock. Rejected if insufficient stock.
- **RETURN** increases medication stock.
- **WASTE** does not change stock. Requires `notes` field.
- `witnessId` must differ from `nurseId`.
- Every transaction automatically creates an audit log entry.

### Create Medication Example

```bash
curl -X POST http://localhost:3000/api/medications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morphine Sulfate",
    "schedule": "II",
    "unit": "mg",
    "stockQuantity": 100,
    "slug": "morphine-sulfate"
  }'
```

## Running Tests

Tests use Vitest with Supertest and a mocked Prisma client (no database required).

```bash
cd backend
npm install
npm test
```

## Development (without Docker)

**Backend:**
```bash
cd backend
npm install
# Set up DATABASE_URL in .env pointing to a running PostgreSQL instance
npx prisma migrate dev
npx prisma db seed
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so the backend must be running first.

## Design Decisions

- **Express app/server separation:** `app.ts` exports the Express app without calling `.listen()`, while `server.ts` starts the server. This allows Supertest to import the app directly without opening a port, avoiding socket conflicts in tests.
- **Prisma interactive transactions:** The transaction creation endpoint uses `prisma.$transaction()` with a callback to ensure stock updates and transaction/audit-log creation are atomic. If any step fails, everything rolls back.
- **Zod refinements for business rules:** Rules like "witness must differ from nurse" and "WASTE requires notes" are encoded as Zod refinements, keeping validation co-located with the schema and producing consistent error responses.
- **Pagination on all list endpoints:** Every list endpoint supports `?page=` and `?limit=` query params with sensible defaults (page 1, limit 20) as a bonus feature.
- **Float for stockQuantity:** Uses float to support fractional doses (e.g., 2.5 ml), matching real-world medication dispensing.
- **Docker entrypoint script:** A shell script waits for PostgreSQL readiness, runs migrations, seeds the database, then starts the app, all with one command (`docker compose up --build`).
- **Docker volumes:** Volumes are used so data persists when running docker compose down. Source directories (`backend/src`, `frontend/src`) are mounted for hot reload during development.
- **npx prisma migrate deploy:** always runs through the docker-entrypoint.sh file in case of doing a pull request and new sql files are pulled
- **Vite proxy:** The frontend proxies `/api` requests to the backend. In Docker, the proxy target is set via `VITE_API_URL` environment variable (`http://api:3000`), falling back to `http://localhost:3000` for local development.
- **globalThis:** the reason for this design decision (singleton pattern) is so we don't reach the limit of connections our database has (https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient)
- **CHOKIDAR_USEPOLLING:** I was testing on windows and linux and on windows hot reload doesn't work without this environment variable set