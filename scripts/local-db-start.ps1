$ErrorActionPreference = "Stop"

$databaseUrl = "postgresql://wallet:wallet_local_password@localhost:5432/telegram_wallet"

Write-Host "Starting local PostgreSQL storage..."
docker compose -p telegram-wallet -f docker-compose.local.yml up -d postgres

Write-Host "Waiting for PostgreSQL to become healthy..."
for ($attempt = 1; $attempt -le 60; $attempt++) {
  $status = docker inspect --format "{{.State.Health.Status}}" telegram-wallet-postgres 2>$null
  if ($status -eq "healthy") {
    break
  }
  Start-Sleep -Seconds 2
}

$finalStatus = docker inspect --format "{{.State.Health.Status}}" telegram-wallet-postgres 2>$null
if ($finalStatus -ne "healthy") {
  throw "PostgreSQL did not become healthy. Current status: $finalStatus"
}

$env:DATABASE_URL = $databaseUrl
Write-Host "Applying Prisma migrations..."
npm run prisma:deploy

Write-Host ""
Write-Host "Local storage is ready:"
Write-Host "DATABASE_URL=$databaseUrl"
Write-Host ""
Write-Host "Run backend with:"
Write-Host '$env:DATABASE_URL="postgresql://wallet:wallet_local_password@localhost:5432/telegram_wallet"; npm run dev:backend'
