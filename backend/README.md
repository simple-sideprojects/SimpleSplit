# Backend

## Enviroment File

For local development you would have to use the host "localhost". But in the docker environment itself you should use "postgres" as a host.

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/postgres
```

## Database

### Migration

Create upgrade:  
`alembic revision --autogenerate -m "First migration"`

Upgrade:  
`alembic upgrade head`

