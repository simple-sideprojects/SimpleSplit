# Docker Development Setup

This setup provides a complete development environment for SimpleSplit with hot reload for both backend and frontend.

## Services

- **PostgreSQL**: Database server (port 5432)
- **Backend**: FastAPI application (port 8000)
- **Frontend**: SvelteKit application (port 5173)

## Prerequisites

- Docker
- Docker Compose

## Quick Start

**Start all services:**
```bash
docker compose up -d
```

**Stop services:**
```bash
docker compose down
```

That's it! Your development environment is ready.

**View logs:**
```bash
docker compose logs -f
```

**Stop and clean (removes database data):**
```bash
docker compose down -v
```

## Accessing the Applications

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Backend API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
  - User: postgres
  - Password: postgres
  - Database: simplesplit

## Development Features

### Hot Reload

Both backend and frontend support hot reload:

- **Backend**: Changes to Python files in `backend/app/` will automatically restart the server
- **Frontend**: Changes to files in `frontend/src/` will automatically trigger HMR (Hot Module Replacement)

### Volume Mounts

The following directories are mounted for live development:

**Backend:**
- `./backend/app` → `/app/app`
- `./backend/alembic` → `/app/alembic`

**Frontend:**
- `./frontend/src` → `/app/src`
- `./frontend/static` → `/app/static`
- `./frontend/messages` → `/app/messages`

### Environment Variables

Default development environment variables are configured in `docker-compose.yml`. For production, create a `.env` file with appropriate values.

**Backend Environment:**
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time
- `PROD`: Set to false for development

**Frontend Environment:**
- `NODE_ENV`: Set to development
- `PUBLIC_API_URL`: Backend API URL

## Common Commands

### Backend

Run migrations:
```bash
docker compose exec backend alembic upgrade head
```

Create a new migration:
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
```

Access backend shell:
```bash
docker compose exec backend sh
```

### Frontend

Install new package:
```bash
docker compose exec frontend pnpm add package-name
```

Run linter:
```bash
docker compose exec frontend pnpm lint
```

Access frontend shell:
```bash
docker compose exec frontend sh
```

### Database

Access PostgreSQL CLI:
```bash
docker compose exec postgres psql -U postgres -d simplesplit
```

## Rebuilding Services

If you modify dependencies or Dockerfile.dev:

```bash
# Rebuild all services
docker compose build

# Rebuild specific service
docker compose build backend
docker compose build frontend

# Rebuild and restart
docker compose up --build
```

## Troubleshooting

### Backend not connecting to database

Wait a few seconds for PostgreSQL to be ready. The backend has a health check dependency on PostgreSQL.

### Frontend can't reach backend

Ensure the backend is running and check `PUBLIC_API_URL` environment variable in docker-compose.yml.

### Port conflicts

If ports 5432, 8000, or 5173 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

For example, to use port 3000 for the frontend:
```yaml
ports:
  - "3000:5173"
```

### Changes not reflecting

1. Check volume mounts are correct
2. Verify files are being saved
3. Check service logs: `docker compose logs -f [service-name]`
4. Restart the specific service: `docker compose restart [service-name]`

### Clean start

Remove all containers, volumes, and images:
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Production Deployment

This setup is for **development only**. For production:

- Use the production Dockerfiles (`Dockerfile` without `.dev`)
- Set appropriate environment variables
- Use production-grade secret management
- Configure proper networking and security
- Use production database with backups
- Enable HTTPS/TLS

## Architecture

```
┌─────────────────┐
│   Frontend      │  Port 5173
│   (SvelteKit)   │  Hot Reload: ✓
└────────┬────────┘
         │
         │ HTTP
         │
┌────────▼────────┐
│   Backend       │  Port 8000
│   (FastAPI)     │  Hot Reload: ✓
└────────┬────────┘
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│   PostgreSQL    │  Port 5432
│   Database      │  Persistent: ✓
└─────────────────┘
```

