# Simple Order API Test Script
# Usage: .\test-orders-simple.ps1

$API_URL = "http://localhost:3000"

Write-Host "`n=== ORDER API TESTS ===" -ForegroundColor Cyan
Write-Host "API: $API_URL`n" -ForegroundColor Yellow

# Test 1: Get all orders
Write-Host "[1] Fetching all orders..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$API_URL/api/orders/list" -Method GET
    Write-Host "SUCCESS: Found $($result.orders.Count) orders" -ForegroundColor Green
    
    if ($result.orders.Count -gt 0) {
        $order = $result.orders[0]
        Write-Host "  Sample: $($order.order_reference) - $($order.customer_name) - KES $($order.total_amount)`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Get pending orders  
Write-Host "[2] Fetching pending orders..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$API_URL/api/orders/list?status=pending" -Method GET
    Write-Host "SUCCESS: Found $($result.orders.Count) pending orders`n" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Get recent orders (limited)
Write-Host "[3] Fetching last 5 orders..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$API_URL/api/orders/list?limit=5" -Method GET
    Write-Host "SUCCESS: Retrieved $($result.orders.Count) orders" -ForegroundColor Green
    
    foreach ($order in $result.orders) {
        Write-Host "  - $($order.order_reference) | $($order.status) | KES $($order.total_amount)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Search orders
Write-Host "[4] Testing search..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$API_URL/api/orders/list?search=ORD" -Method GET
    Write-Host "SUCCESS: Found $($result.orders.Count) matching orders`n" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "=== TESTS COMPLETE ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)`n" -ForegroundColor Yellow
