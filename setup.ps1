# setup.ps1 - Rodar como Administrador

Write-Host ""
Write-Host "=== Setup do Shello ===" -ForegroundColor Cyan
Write-Host ""

# Verifica prerequisitos
$errors = @()

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    $errors += "Docker nao encontrado. Instale em: https://www.docker.com/products/docker-desktop/"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $errors += "Node.js nao encontrado. Instale em: https://nodejs.org/"
}
if ($errors.Count -gt 0) {
    Write-Host "Prerequisitos faltando:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    exit 1
}

$nodeVersion = (node --version) -replace 'v', ''
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 18) {
    Write-Host "Node.js v$nodeVersion encontrado. Requer v18+." -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisitos OK (Docker + Node.js v$nodeVersion)" -ForegroundColor Green
Write-Host ""

# [1/4] Instala make
Write-Host "[1/4] Instalando make..." -ForegroundColor Yellow
$makeExists = Get-Command make -ErrorAction SilentlyContinue
if ($makeExists) {
    Write-Host "      make ja instalado, pulando." -ForegroundColor Gray
} else {
    winget install GnuWin32.Make --silent
    [Environment]::SetEnvironmentVariable(
        "Path",
        [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files (x86)\GnuWin32\bin",
        "Machine"
    )
    $env:PATH += ";C:\Program Files (x86)\GnuWin32\bin"
    Write-Host "      make instalado!" -ForegroundColor Green
}

# [2/4] Dependencias do frontend
Write-Host ""
Write-Host "[2/4] Instalando dependencias do frontend..." -ForegroundColor Yellow
Push-Location frontend
npm install
Pop-Location
Write-Host "      Dependencias instaladas!" -ForegroundColor Green

# [3/4] eas-cli global
Write-Host ""
Write-Host "[3/4] Instalando eas-cli..." -ForegroundColor Yellow
$easExists = Get-Command eas -ErrorAction SilentlyContinue
if ($easExists) {
    Write-Host "      eas-cli ja instalado, pulando." -ForegroundColor Gray
} else {
    npm install -g eas-cli
    Write-Host "      eas-cli instalado!" -ForegroundColor Green
}

# [4/4] Cria backend/.env se nao existir
Write-Host ""
Write-Host "[4/4] Configurando backend/.env..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "      backend\.env ja existe, pulando." -ForegroundColor Gray
} else {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "      backend\.env criado a partir do .env.example." -ForegroundColor Green
    Write-Host "      IMPORTANTE: preencha as variaveis em backend\.env antes de rodar!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup concluido! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host "  1. Feche e reabra o terminal (para o make funcionar no PATH)" -ForegroundColor Gray
Write-Host "  2. Preencha as variaveis em backend\.env" -ForegroundColor Gray
Write-Host "  3. Para rodar o projeto:  make dev" -ForegroundColor Gray
Write-Host "  4. Para gerar APK:        make apk  (requer 'eas login' na primeira vez)" -ForegroundColor Gray
Write-Host ""
