$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "hosting-package"
$FrontendDir = Join-Path $Root "frontend"
$BackendDir = Join-Path $Root "backend"

Write-Host "==> Locales Pro - Prepare Hosting Package" -ForegroundColor Cyan

if (-not (Test-Path $FrontendDir)) {
    throw "Folder frontend tidak ditemukan."
}

Push-Location $FrontendDir
Write-Host "==> Build frontend production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Build frontend gagal."
}
Pop-Location

Write-Host "==> Menyiapkan folder hosting-package..." -ForegroundColor Yellow
if (Test-Path $OutDir) {
    Remove-Item $OutDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutDir | Out-Null

Copy-Item -Path (Join-Path $FrontendDir "dist\*") -Destination $OutDir -Recurse -Force

$BackendOut = Join-Path $OutDir "backend"
Copy-Item -Path $BackendDir -Destination $BackendOut -Recurse -Force

$removePatterns = @(
    (Join-Path $BackendOut "logs\*.log"),
    (Join-Path $BackendOut "logs\login_attempts.json"),
    (Join-Path $BackendOut ".env")
)
foreach ($pattern in $removePatterns) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

Copy-Item -Path (Join-Path $Root "hosting\.htaccess") -Destination $OutDir -Force
Copy-Item -Path (Join-Path $BackendDir ".env.example") -Destination (Join-Path $BackendOut ".env.example") -Force
Copy-Item -Path (Join-Path $Root "HOSTING.md") -Destination (Join-Path $OutDir "HOSTING.md") -Force
Copy-Item -Path (Join-Path $Root "DB\locales_db.sql") -Destination (Join-Path $OutDir "locales_db.sql") -Force

Write-Host ""
Write-Host "Selesai! Paket hosting ada di:" -ForegroundColor Green
Write-Host $OutDir
Write-Host ""
Write-Host "Langkah berikutnya:" -ForegroundColor Cyan
Write-Host "1. Upload isi folder hosting-package ke public_html hosting"
Write-Host "2. Salin backend/.env.example menjadi backend/.env lalu isi DB + JWT secret"
Write-Host "3. Import locales_db.sql lewat phpMyAdmin"
Write-Host "4. Buka https://domainanda.com/backend/api/public/health.php untuk cek status"
