# ══════════════════════════════════════════════════════════════════════════
# Frontend deploy: stop service, pull latest, install deps, build, restart,
# health-check. Stops immediately on any failure.
# Usage: open PowerShell in this folder on the server and run: .\deploy.ps1
# ══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$serviceName = 'ClinicSaaSFrontend'
$healthUrl = 'http://localhost:4173'

function Step($msg) { Write-Host "`n== $msg ==" -ForegroundColor Cyan }

Step "Stopping service"
Stop-Service $serviceName -Force -ErrorAction SilentlyContinue

Step "Pulling latest code from main"
Set-Location $root
git pull origin main

Step "Installing packages (if changed)"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nnpm install FAILED - stopping here." -ForegroundColor Red
    exit 1
}

Step "Building"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBUILD FAILED - stopping here on purpose." -ForegroundColor Red
    exit 1
}

Step "Starting service"
Start-Service $serviceName
Start-Sleep -Seconds 2

Step "Health check"
try {
    $resp = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 8 -UseBasicParsing
    Write-Host "OK - frontend is up (HTTP $($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "FAILED - frontend did not respond at $healthUrl. Check it manually." -ForegroundColor Red
    exit 1
}
