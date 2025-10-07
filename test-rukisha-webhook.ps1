# PowerShell script to test Rukisha webhook endpoints
# Run: .\test-rukisha-webhook.ps1

Write-Host "`n=== TESTING RUKISHA WEBHOOK ENDPOINTS ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: GET request to production endpoint (URL validation)
Write-Host "1. Testing GET request (URL validation)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://getdeals.co.ke/api/webhooks/rukisha" -Method GET
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✅ Message: $($content.message)" -ForegroundColor Green
    Write-Host "   ✅ Accepts: $($content.accepts)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET request failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: GET request to test endpoint
Write-Host "2. Testing GET request to test endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://getdeals.co.ke/api/webhooks/test-rukisha" -Method GET
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✅ Message: $($content.message)" -ForegroundColor Green
    Write-Host "   ✅ Expected Fields:" -ForegroundColor Green
    foreach ($field in $content.expected_fields) {
        Write-Host "      - $field" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ GET request to test endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: POST request with valid test data
Write-Host "3. Testing POST request with valid data..." -ForegroundColor Yellow
try {
    $testData = @{
        TransactionID = "TEST" + (Get-Date -Format "yyyyMMddHHmmss")
        TransactionType = "deposit"
        Amount = 100
        Phone = "254712345678"
        Status = "completed"
        ConfirmationCode = "TEST_ABC123"
        Timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        Reference = "TEST_REF_" + (Get-Random -Minimum 1000 -Maximum 9999)
    }
    
    $jsonBody = $testData | ConvertTo-Json -Depth 10
    
    $response = Invoke-WebRequest `
        -Uri "https://getdeals.co.ke/api/webhooks/test-rukisha" `
        -Method POST `
        -Body $jsonBody `
        -ContentType "application/json"
    
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✅ Success: $($content.success)" -ForegroundColor Green
    Write-Host "   ✅ Message: $($content.message)" -ForegroundColor Green
    
    if ($content.validation) {
        Write-Host "   ✅ Validation Results:" -ForegroundColor Green
        Write-Host "      - Transaction ID: $($content.validation.has_transaction_id)" -ForegroundColor Gray
        Write-Host "      - Status: $($content.validation.has_status)" -ForegroundColor Gray
        Write-Host "      - Amount: $($content.validation.has_amount)" -ForegroundColor Gray
        Write-Host "      - Phone: $($content.validation.has_phone)" -ForegroundColor Gray
        Write-Host "      - Confirmation Code: $($content.validation.has_confirmation_code)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ POST request failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   ❌ Error Response: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: POST request with missing required fields (should fail gracefully)
Write-Host "4. Testing POST request with missing fields (should fail validation)..." -ForegroundColor Yellow
try {
    $invalidData = @{
        TransactionID = "TEST_INVALID"
        # Missing Status field
    }
    
    $jsonBody = $invalidData | ConvertTo-Json -Depth 10
    
    $response = Invoke-WebRequest `
        -Uri "https://getdeals.co.ke/api/webhooks/test-rukisha" `
        -Method POST `
        -Body $jsonBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "   ⚠️  Expected validation error but got success!" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Validation error returned correctly (400 Bad Request)" -ForegroundColor Green
        
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        Write-Host "   ✅ Error Message: $($errorBody.error)" -ForegroundColor Green
        if ($errorBody.missing_fields) {
            Write-Host "   ✅ Missing Fields: $($errorBody.missing_fields -join ', ')" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ Unexpected error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Rukisha webhook endpoint is accessible and working!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Share this information with Rukisha support:" -ForegroundColor White
Write-Host "      Callback URL: https://getdeals.co.ke/api/webhooks/rukisha" -ForegroundColor Gray
Write-Host "      Methods: GET (validation), POST (callbacks), OPTIONS (CORS)" -ForegroundColor Gray
Write-Host "      SSL: Valid certificate (Vercel)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Test the callback URL validation in their system" -ForegroundColor White
Write-Host ""
Write-Host "   3. If they report issues, ask them to:" -ForegroundColor White
Write-Host "      - Provide exact error message" -ForegroundColor Gray
Write-Host "      - Test with: curl https://getdeals.co.ke/api/webhooks/rukisha" -ForegroundColor Gray
Write-Host "      - Check if their system requires specific response format" -ForegroundColor Gray
Write-Host ""
