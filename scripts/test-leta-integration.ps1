#!/usr/bin/env pwsh
# Leta API Integration Test - Curl Version
# Run this to test if order data reaches Leta APIs

param(
    [string]$OrderId = "",
    [string]$TestMode = "full"
)

# Colors for output
$SuccessColor = 'Green'
$FailureColor = 'Red'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

function Write-Header {
    param([string]$Message)
    Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    Write-Host "  $Message" -ForegroundColor $InfoColor
    Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor $InfoColor
}

function Write-Test {
    param([string]$Name, [string]$Status, [string]$Details)
    
    $Icon = switch($Status) {
        'PASS' { '✅' }
        'FAIL' { '❌' }
        'WARN' { '⚠️ ' }
        default { 'ℹ️ ' }
    }
    
    $Color = switch($Status) {
        'PASS' { $SuccessColor }
        'FAIL' { $FailureColor }
        'WARN' { $WarningColor }
        default { $InfoColor }
    }
    
    Write-Host "$Icon $Name" -ForegroundColor $Color
    Write-Host "   $Details`n" -ForegroundColor $Color
}

# ==================== TEST 1: Environment Check ====================
Write-Header "TEST 1: Environment & Credentials Check"

$envVars = @{
    'SUPABASE_URL' = $env:SUPABASE_URL -or $env:VITE_SUPABASE_URL
    'SUPABASE_SERVICE_KEY' = $env:SUPABASE_SERVICE_ROLE_KEY -or $env:VITE_SUPABASE_SERVICE_ROLE_KEY
    'LETA_API_URL' = $env:VITE_LETA_API_URL -or 'https://integrations.leta.ai'
    'LETA_API_TOKEN' = $env:LETA_API_TOKEN -or $env:VITE_LETA_TOKEN
}

foreach ($key in $envVars.Keys) {
    $status = $envVars[$key] ? 'PASS' : 'FAIL'
    Write-Test $key $status "Configured: $(if($envVars[$key]){'Yes'}else{'No'})"
}

# ==================== TEST 2: Request to Frontend ====================
Write-Header "TEST 2: Frontend Health Check"

$frontendUrl = $env:FRONTEND_URL -or "https://getdeals.co.ke"
Write-Host "Testing frontend at: $frontendUrl`n" -ForegroundColor $InfoColor

try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Test "Frontend Health" "PASS" "Frontend is responding ($($response.StatusCode))"
} catch {
    Write-Test "Frontend Health" "WARN" "Health endpoint not available (this is OK if not implemented)"
}

# ==================== TEST 3: Direct Endpoint Test ====================
Write-Header "TEST 3: Order Creation Endpoint"

if ($OrderId) {
    Write-Host "Testing with provided Order ID: $OrderId`n" -ForegroundColor $InfoColor
    
    try {
        $response = Invoke-WebRequest -Uri "$frontendUrl/api/orders/$OrderId/tracking" -Method GET -TimeoutSec 5
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Test "Tracking Endpoint" "PASS" "Successfully retrieved tracking data"
            Write-Host "Order Status: $($data.tracking.status)" -ForegroundColor $SuccessColor
            Write-Host "Leta Order ID: $($data.tracking.letaOrderId)" -ForegroundColor $SuccessColor
        } else {
            Write-Test "Tracking Endpoint" "FAIL" $data.error
        }
    } catch {
        Write-Test "Tracking Endpoint" "FAIL" $_.Exception.Message
    }
}

# ==================== TEST 4: Sample Payload Validation ====================
Write-Header "TEST 4: Sample Order Payload Validation"

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
        name = "Test Location, Nairobi"
    }
    products = @(
        @{
            code = "TEST-001"
            quantity = 1
            price = 100
        }
    )
    payment_method = "prepaid"
    special_instruction = "Test Order - Do Not Deliver"
    cargo_description = "1x Test Product"
}

$requiredFields = @('reference', 'customer', 'depot_code', 'dropoff', 'products', 'payment_method')
$missingFields = @()

foreach ($field in $requiredFields) {
    if ($payload.$field) {
        Write-Host "✅ $field" -ForegroundColor $SuccessColor
    } else {
        Write-Host "❌ $field" -ForegroundColor $FailureColor
        $missingFields += $field
    }
}

if ($missingFields.Count -eq 0) {
    Write-Test "Payload Validation" "PASS" "All required fields present"
} else {
    Write-Test "Payload Validation" "FAIL" "Missing fields: $($missingFields -join ', ')"
}

# ==================== TEST 5: Simulated Leta API Call ====================
Write-Header "TEST 5: Simulated Leta API Call"

$letaUrl = $env:VITE_LETA_API_URL -or "https://integrations.leta.ai"
$letaToken = $env:LETA_API_TOKEN -or $env:VITE_LETA_TOKEN

if (-not $letaToken) {
    Write-Test "Leta API Token" "WARN" "LETA_API_TOKEN not configured - cannot test actual API"
} else {
    Write-Host "Endpoint: $letaUrl/orders/add`n" -ForegroundColor $InfoColor
    Write-Host "Testing with payload:`n" -ForegroundColor $InfoColor
    
    $payloadJson = $payload | ConvertTo-Json
    Write-Host $payloadJson -ForegroundColor $WarningColor
    
    Write-Host "`nSending request...`n" -ForegroundColor $InfoColor
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$letaUrl/orders/add" `
            -Method POST `
            -Headers @{
                'Content-Type' = 'application/json'
                'Authorization' = "Bearer $letaToken"
            } `
            -Body $payloadJson `
            -TimeoutSec 10
        
        $data = $response.Content | ConvertFrom-Json
        Write-Test "Leta API Connection" "PASS" "Order accepted by Leta API"
        Write-Host "Response:" -ForegroundColor $SuccessColor
        Write-Host ($data | ConvertTo-Json) -ForegroundColor $SuccessColor
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Test "Leta API Connection" "FAIL" "API rejected request (HTTP $statusCode)"
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor $FailureColor
    }
}

# ==================== TEST 6: Database Query ====================
Write-Header "TEST 6: Database Integration Check"

if ($env:SUPABASE_URL -and $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Checking recent orders in database...`n" -ForegroundColor $InfoColor
    
    # This would require a server-side script, showing information instead
    Write-Host "To check database orders, run this in Supabase SQL Editor:" -ForegroundColor $InfoColor
    Write-Host @"
    SELECT 
      order_reference, 
      status, 
      delivery_method,
      leta_order_id,
      leta_status,
      created_at
    FROM orders
    WHERE delivery_method = 'speedy'
    ORDER BY created_at DESC
    LIMIT 10;
"@ -ForegroundColor $WarningColor
    
} else {
    Write-Test "Database Check" "WARN" "Supabase credentials not available"
}

# ==================== SUMMARY ====================
Write-Header "Test Summary"

Write-Host @"
✅ Tests completed!

📋 What was tested:
  1. Environment variables and credentials
  2. Frontend health and connectivity
  3. Tracking endpoint (if order ID provided)
  4. Order payload structure validation
  5. Leta API connection and response handling
  6. Database integration information

🔍 Key Things to Verify:

  1. Check Lei token is correct:
     echo $('$env:LETA_API_TOKEN')

  2. Verify order was created with Leta reference:
     - Check Supabase: orders table
     - Look for 'leta_order_id' field populated

  3. Test a real order:
     $script:Test-LetaIntegration.ps1 -OrderId "YOUR_ORDER_ID"

  4. Check logs:
     - Supabase logs for errors
     - Frontend console for API errors

📚 Documentation:
  - RLS_FIX_SUMMARY.md - Quick reference
  - RLS_FIX_GUIDE.md - Detailed guide
  - api/orders/create.ts - Order creation logic
  - api/orders/[orderId]/tracking.ts - Tracking retrieval

"@ -ForegroundColor $InfoColor

Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor $InfoColor
