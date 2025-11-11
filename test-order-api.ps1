# Order API Testing Script for PowerShell
# Run this script to test the order API endpoints

Write-Host "ORDER API TEST SUITE" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_BASE_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3000" }

Write-Host "API Base URL: $API_BASE_URL" -ForegroundColor Yellow
Write-Host "Start Time: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Initialize
$allOrders = @()

# Test 1: Fetch All Orders
Write-Host "Test 1: Fetch All Orders" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/orders/list" -Method GET -ErrorAction Stop
    
    if ($response.success -eq $true) {
        Write-Host "[PASS] Retrieved $($response.orders.Count) orders" -ForegroundColor Green
        Write-Host "  Total count: $($response.total)" -ForegroundColor Gray
        
        if ($response.orders.Count -gt 0) {
            $sampleOrder = $response.orders[0]
            Write-Host "  Sample Order ID: $($sampleOrder.order_reference)" -ForegroundColor Gray
            Write-Host "  Customer: $($sampleOrder.customer_name)" -ForegroundColor Gray
            Write-Host "  Status: $($sampleOrder.status)" -ForegroundColor Gray
            Write-Host "  Total: KES $($sampleOrder.total_amount)" -ForegroundColor Gray
        }
        
        $allOrders = $response.orders
    } else {
        Write-Host "[FAIL] $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Tip: Make sure your development server is running" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Fetch Orders with Filters
Write-Host "--- Test 2: Fetch Orders with Filters ---" -ForegroundColor Cyan

$testCases = @(
    @{ Status = "pending"; Description = "Pending orders" },
    @{ Status = "confirmed"; Description = "Confirmed orders" },
    @{ Status = "delivered"; Description = "Delivered orders" },
    @{ Limit = "5"; Description = "Limited to 5 orders" }
)

foreach ($testCase in $testCases) {
    try {
        $params = @{}
        if ($testCase.Status) { $params.status = $testCase.Status }
        if ($testCase.Limit) { $params.limit = $testCase.Limit }
        
        $queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
        $url = "$API_BASE_URL/api/orders/list?$queryString"
        
        $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
        
        if ($response.success) {
            Write-Host "✓ $($testCase.Description): $($response.orders.Count) orders" -ForegroundColor Green
        } else {
            Write-Host "✗ $($testCase.Description): $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ $($testCase.Description): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Fetch Specific Order by ID
Write-Host "--- Test 3: Fetch Specific Order by ID ---" -ForegroundColor Cyan

if ($allOrders.Count -gt 0) {
    $testOrderId = $allOrders[0].order_reference
    Write-Host "Testing with order ID: $testOrderId" -ForegroundColor Blue
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/orders/list?search=$testOrderId" -Method GET -ErrorAction Stop
        
        if ($response.success -and $response.orders.Count -gt 0) {
            Write-Host "✓ Success: Found order" -ForegroundColor Green
            $order = $response.orders[0]
            Write-Host "`nOrder Details:" -ForegroundColor Blue
            Write-Host "  Reference: $($order.order_reference)" -ForegroundColor Blue
            Write-Host "  Customer: $($order.customer_name)" -ForegroundColor Blue
            Write-Host "  Email: $($order.customer_email)" -ForegroundColor Blue
            Write-Host "  Phone: $($order.customer_phone)" -ForegroundColor Blue
            Write-Host "  Status: $($order.status)" -ForegroundColor Blue
            Write-Host "  Total: KES $($order.total_amount)" -ForegroundColor Blue
        } else {
            Write-Host "✗ Failed: Order not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ No orders available to test" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Validate Order Structure
Write-Host "--- Test 4: Validate Order Structure ---" -ForegroundColor Cyan

if ($allOrders.Count -gt 0) {
    $sampleOrder = $allOrders[0]
    $requiredFields = @(
        "id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "delivery_method",
        "payment_method",
        "status",
        "total_amount",
        "items"
    )
    
    Write-Host "Checking required fields..." -ForegroundColor Blue
    $allFieldsPresent = $true
    
    foreach ($field in $requiredFields) {
        $fieldExists = $sampleOrder.PSObject.Properties.Name -contains $field
        
        if (-not $fieldExists) {
            # Try snake_case to camelCase conversion
            $camelCase = $field -replace '_(.)', { $_.Groups[1].Value.ToUpper() }
            $fieldExists = $sampleOrder.PSObject.Properties.Name -contains $camelCase
        }
        
        if ($fieldExists) {
            Write-Host "✓ $field : present" -ForegroundColor Green
        } else {
            Write-Host "✗ $field : missing" -ForegroundColor Red
            $allFieldsPresent = $false
        }
    }
    
    if ($allFieldsPresent) {
        Write-Host "`n✓ All required fields present!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Some required fields are missing" -ForegroundColor Red
    }
    
    # Check items array
    if ($sampleOrder.items -and $sampleOrder.items.Count -gt 0) {
        Write-Host "✓ Items array: $($sampleOrder.items.Count) items" -ForegroundColor Green
        Write-Host "`nSample item:" -ForegroundColor Blue
        $sampleItem = $sampleOrder.items[0]
        Write-Host "  Name: $($sampleItem.name)" -ForegroundColor Blue
        Write-Host "  Quantity: $($sampleItem.quantity)" -ForegroundColor Blue
        Write-Host "  Price: KES $($sampleItem.price)" -ForegroundColor Blue
    } else {
        Write-Host "✗ Items array: missing or empty" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ No orders available to test" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Recent Orders (Last 24 Hours)
Write-Host "--- Test 5: Recent Orders (Last 24 Hours) ---" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/orders/list?limit=100" -Method GET -ErrorAction Stop
    
    if ($response.success) {
        $now = Get-Date
        $yesterday = $now.AddDays(-1)
        
        $recentOrders = $response.orders | Where-Object {
            $orderDate = [DateTime]::Parse($_.created_at)
            $orderDate -ge $yesterday
        }
        
        Write-Host "✓ Found $($recentOrders.Count) orders in last 24 hours" -ForegroundColor Green
        
        if ($recentOrders.Count -gt 0) {
            Write-Host "`nRecent order summary:" -ForegroundColor Blue
            $recentOrders | Select-Object -First 5 | ForEach-Object -Begin { $i = 1 } -Process {
                Write-Host "  $i. $($_.order_reference) - $($_.status) - KES $($_.total_amount)" -ForegroundColor Blue
                $i++
            }
        }
    } else {
        Write-Host "✗ Failed to fetch orders" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Order Status Distribution
Write-Host "--- Test 6: Order Status Distribution ---" -ForegroundColor Cyan

if ($allOrders.Count -gt 0) {
    $statusGroups = $allOrders | Group-Object -Property status
    
    Write-Host "Status distribution:" -ForegroundColor Blue
    foreach ($group in $statusGroups) {
        $percentage = [Math]::Round(($group.Count / $allOrders.Count) * 100, 1)
        Write-Host "  $($group.Name): $($group.Count) ($percentage%)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ No orders available to test" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TEST SUITE COMPLETED                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "End Time: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Summary
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total Orders: $($allOrders.Count)" -ForegroundColor White
if ($allOrders.Count -gt 0) {
    $recentCount = ($allOrders | Where-Object {
        $orderDate = [DateTime]::Parse($_.created_at)
        $orderDate -ge (Get-Date).AddDays(-1)
    }).Count
    Write-Host "  Orders (24h): $recentCount" -ForegroundColor White
    
    $totalRevenue = ($allOrders | Measure-Object -Property total_amount -Sum).Sum
    Write-Host "  Total Revenue: KES $totalRevenue" -ForegroundColor White
}
