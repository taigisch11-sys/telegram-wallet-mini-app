$ErrorActionPreference = "Stop"

Write-Host "This will delete all local wallet data stored on this PC."
$answer = Read-Host "Type DELETE to continue"

if ($answer -ne "DELETE") {
  Write-Host "Cancelled."
  exit 0
}

docker compose -p telegram-wallet -f docker-compose.local.yml down -v
Write-Host "Local PostgreSQL data was deleted."
