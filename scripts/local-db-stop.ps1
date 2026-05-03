$ErrorActionPreference = "Stop"

Write-Host "Stopping local PostgreSQL storage..."
docker compose -p telegram-wallet -f docker-compose.local.yml stop postgres

Write-Host "Stopped. Data is preserved in Docker volume: telegram-wallet-postgres-data"
