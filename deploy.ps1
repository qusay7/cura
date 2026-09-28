# ══════════════════════════════════════════════════════════════════════════
# نشر الفرونت اند: إيقاف الـ service، سحب آخر كود، تثبيت الحزم، بناء،
# وإعادة التشغيل — مع توقف فوري عند أول خطأ
# الاستخدام: افتح PowerShell بمجلد الفرونت اند على السيرفر وشغّل: .\deploy.ps1
# ══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$serviceName = 'ClinicSaaSFrontend'
$healthUrl = 'http://localhost:4173'

function Step($msg) { Write-Host "`n== $msg ==" -ForegroundColor Cyan }

Step "إيقاف الـ service"
Stop-Service $serviceName -Force -ErrorAction SilentlyContinue

Step "سحب آخر كود من main"
Set-Location $root
git pull origin main

Step "تثبيت الحزم (لو تغيّرت)"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ فشل npm install — توقفنا هون." -ForegroundColor Red
    exit 1
}

Step "بناء المشروع"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ فشل البناء — توقفنا هون عمداً." -ForegroundColor Red
    exit 1
}

Step "تشغيل الـ service"
Start-Service $serviceName
Start-Sleep -Seconds 2

Step "فحص الصحة"
try {
    $resp = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 8 -UseBasicParsing
    Write-Host "✅ الفرونت اند شغال (HTTP $($resp.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ الفرونت اند ما رد على $healthUrl — افحصه يدوياً." -ForegroundColor Red
    exit 1
}
