#!/usr/bin/env pwsh
# Quick Leta Test - Minimal test to check if data reaches Leta API
# Usage: .\test-leta-quick.ps1 -OrderId "ORD-123456"

param(
    [string]$OrderId = "",
    [switch]$SendTestOrder,
    [switch]$CheckDatabase
)

$LetaUrl = $env:VITE_LETA_API_URL -or "https://integrations.leta.ai"
$LetaToken = $env:LETA_API_TOKEN -or $env:VITE_LETA_TOKEN
$FrontendUrl = $env:FRONTEND_URL -or "https://getdeals.co.ke"

Write-Host "🧪 LETA API Quick Test`n" -ForegroundColor Cyan

# ============== TEST 1: Check Credentials ==============
Write-Host "1️⃣  Checking credentials..." -ForegroundColor Yellow

if ($LetaToken) {
    Write-Host "   ✅ LETA_API_TOKEN configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ LETA_API_TOKEN NOT configured" -ForegroundColor Red
    Write-Host "   Set: `$env:LETA_API_TOKEN = 'your-token'" -ForegroundColor Yellow
}

# ============== TEST 2: Check Order ==============
if ($OrderId) {
    Write-Host "`n2️⃣  Testing tracking endpoint for order: $OrderId" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$FrontendUrl/api/orders/$OrderId/tracking" `
            -Method GET `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "   ✅ Tracking data retrieved" -ForegroundColor Green
            Write-Host "   Status: $($data.tracking.letaStatus)" -ForegroundColor Green
            Write-Host "   Leta ID: $($data.tracking.letaOrderId)" -ForegroundColor Green
            
            if ($data.tracking.rider) {
                Write-Host "   Rider: $($data.tracking.rider.name)" -ForegroundColor Green
            }
        } else {
            Write-Host "   ❌ Error: $($data.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============== TEST 3: Send Test Order ==============
if ($SendTestOrder -and $LetaToken) {
    Write-Host "`n3️⃣  Sending test order to Leta API..." -ForegroundColor Yellow
    
    $payload = @{
        reference = "GD-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
        customer = @{
            phone_number = "254712345678"
            email = "test@getdeals.co.ke"
            name = "Test Customer"
        }
        depot_code = "getdeals-nairobi"
        dropoff = @{
            latitude = -1.2860273
            longitude = 36.8079678
            name = "Test Location"
        }
        products = @(@{
            code = "TEST-001"
            quantity = 1
            price = 100
        })
        payment_method = "prepaid"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$LetaUrl/orders/add" `
            -Method POST `
            -Headers @{
                'Content-Type' = 'application/json'
                'Authorization' = "Bearer $LetaToken"
            } `
            -Body $payload `
            -TimeoutSec 10 `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Test order accepted by Leta" -ForegroundColor Green
        Write-Host "   Order ID: $($data.id)" -ForegroundColor Green
        Write-Host "   Reference: $($data.reference)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============== TEST 4: Query Database ==============
if ($CheckDatabase) {
    Write-Host "`n4️⃣  Database check instructions:" -ForegroundColor Yellow
    Write-Host "   Run in Supabase SQL Editor:" -ForegroundColor Cyan
    Write-Host @"
   SELECT 
     order_reference, 
     leta_order_id, 
     leta_status,
     delivery_method,
     created_at
   FROM orders
   WHERE delivery_method = 'speedy'
   ORDER BY created_at DESC
   LIMIT 10;
"@ -ForegroundColor Gray
}

Write-Host "`n✅ Test complete!`n" -ForegroundColor Green

Write-Host "📚 Usage examples:" -ForegroundColor Cyan
Write-Host "   # Test specific order" -ForegroundColor Gray
Write-Host "   .\test-leta-quick.ps1 -OrderId 'ORD-123456'" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Send test order to Leta" -ForegroundColor Gray
Write-Host "   .\test-leta-quick.ps1 -SendTestOrder" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Get database check query" -ForegroundColor Gray
Write-Host "   .\test-leta-quick.ps1 -CheckDatabase" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Full test" -ForegroundColor Gray
Write-Host "   .\test-leta-quick.ps1 -OrderId 'ORD-123456' -SendTestOrder -CheckDatabase" -ForegroundColor Gray
