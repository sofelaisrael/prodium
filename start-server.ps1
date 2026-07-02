Get-Process -Id 11856 | Stop-Process -Force -ErrorAction SilentlyContinue

$env:PORT = '3000'
cat server/.env.example | sed 's/^#//' > server/.env

node api/index.js > api.log 2>&1
Write-Host "Server started on port $env:PORT" -ForegroundColor Green