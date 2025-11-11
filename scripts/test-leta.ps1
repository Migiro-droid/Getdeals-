# Leta Integration Test Runner
# Runs the comprehensive Leta API integration test

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Leta API Integration Test" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your Leta credentials" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Write-Host "📋 Loading environment variables..." -ForegroundColor Gray
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

# Check Node version
Write-Host "🔍 Checking Node.js version..." -ForegroundColor Gray
$nodeVersion = node -v
Write-Host "   Node.js: $nodeVersion" -ForegroundColor Gray

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🚀 Starting Leta integration test..." -ForegroundColor Green
Write-Host ""

# Run the test script
npx tsx scripts/test-leta-integration.ts

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Test failed with exit code: $exitCode" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
