# TRIAGELOCK Backend Health Check (Windows PowerShell)

$baseUrl = "http://localhost:3000"
$adminEmail = "test.admin@hospital.com"
$adminPassword = "Test123!"
$doctorEmail = "test.doctor@hospital.com"
$doctorPassword = "Test123!"

Write-Host "`n🏥 TRIAGELOCK Backend Health Check" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "✓ Testing health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($health.status -eq "ok") {
        Write-Host "  ✅ PASS: Health OK" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAIL: Unexpected status" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ FAIL: Cannot connect to server" -ForegroundColor Red
    Write-Host "  Make sure the server is running: npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Register Admin
Write-Host "✓ Registering admin user..." -ForegroundColor Cyan
try {
    $adminBody = @{
        email = $adminEmail
        password = $adminPassword
        name = "Test Admin"
        role = "admin"
        hospitalId = 1
    } | ConvertTo-Json

    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $adminBody

    $adminToken = $adminResponse.token
    Write-Host "  ✅ PASS: Admin registered" -ForegroundColor Green
    Write-Host "  Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "  ⚠️  WARN: User already exists, trying login..." -ForegroundColor Yellow
        
        $loginBody = @{
            email = $adminEmail
            password = $adminPassword
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $loginBody

        $adminToken = $loginResponse.token
        Write-Host "  ✅ PASS: Logged in successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Register Doctor
Write-Host "✓ Registering doctor user..." -ForegroundColor Cyan
try {
    $doctorBody = @{
        email = $doctorEmail
        password = $doctorPassword
        name = "Dr. Test"
        role = "doctor"
        hospitalId = 1
    } | ConvertTo-Json

    $doctorResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $doctorBody

    $doctorToken = $doctorResponse.token
    Write-Host "  ✅ PASS: Doctor registered" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "  ⚠️  WARN: User exists, trying login..." -ForegroundColor Yellow
        
        $loginBody = @{
            email = $doctorEmail
            password = $doctorPassword
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $loginBody

        $doctorToken = $loginResponse.token
        Write-Host "  ✅ PASS: Logged in successfully" -ForegroundColor Green
    }
}
Write-Host ""

# Test 4: List Hospitals
Write-Host "✓ Testing hospitals endpoint..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $hospitals = Invoke-RestMethod -Uri "$baseUrl/api/hospitals" `
        -Method Get `
        -Headers $headers

    if ($hospitals.Count -gt 0) {
        Write-Host "  ✅ PASS: $($hospitals.Count) hospitals found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAIL: No hospitals found. Run: npm run seed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Hospital Stats
Write-Host "✓ Testing hospital stats..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/hospitals/1/stats" `
        -Method Get `
        -Headers $headers

    Write-Host "  ✅ PASS: Stats retrieved" -ForegroundColor Green
    Write-Host "    Total Beds: $($stats.totalBeds)" -ForegroundColor Gray
    Write-Host "    Available: $($stats.availableBeds)" -ForegroundColor Gray
    Write-Host "    Waiting Patients: $($stats.waitingPatients)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Register Critical Patient
Write-Host "✓ Registering RED priority patient..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $doctorToken"
        "Content-Type" = "application/json"
    }

    $patientBody = @{
        patientId = "PT-TEST-RED-$(Get-Date -Format 'HHmmss')"
        name = "Critical Patient"
        age = 65
        gender = "male"
        triageInput = @{
            vitalSigns = @{
                heartRate = 145
                respiratoryRate = 32
                systolicBP = 85
                diastolicBP = 50
                oxygenSaturation = 88
                consciousness = "pain"
            }
            symptoms = @(
                @{
                    symptom = "chest pain"
                    severity = "critical"
                }
            )
            riskFactors = @(
                @{
                    factor = "diabetes"
                    category = "chronic"
                }
            )
        }
    } | ConvertTo-Json -Depth 10

    $patient = Invoke-RestMethod -Uri "$baseUrl/api/patients" `
        -Method Post `
        -Headers $headers `
        -Body $patientBody

    if ($patient.triageResult.priority -eq "RED") {
        Write-Host "  ✅ PASS: Patient triaged as RED" -ForegroundColor Green
        Write-Host "    Score: $($patient.triageResult.score)" -ForegroundColor Gray
        Write-Host "    Reasons: $($patient.triageResult.reasons.Count) clinical findings" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ FAIL: Expected RED, got $($patient.triageResult.priority)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Get Emergency Queue
Write-Host "✓ Testing emergency queue..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $doctorToken"
    }
    $queue = Invoke-RestMethod -Uri "$baseUrl/api/patients/queue?status=waiting" `
        -Method Get `
        -Headers $headers

    Write-Host "  ✅ PASS: Queue retrieved" -ForegroundColor Green
    Write-Host "    Total waiting: $($queue.Count)" -ForegroundColor Gray
    
    $redCount = ($queue | Where-Object { $_.priority -eq "RED" }).Count
    $yellowCount = ($queue | Where-Object { $_.priority -eq "YELLOW" }).Count
    $greenCount = ($queue | Where-Object { $_.priority -eq "GREEN" }).Count
    
    Write-Host "    RED: $redCount | YELLOW: $yellowCount | GREEN: $greenCount" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Generate Analytics Report
Write-Host "✓ Generating analytics report..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }

    $reportBody = @{
        date = (Get-Date -Format "yyyy-MM-dd")
    } | ConvertTo-Json

    $report = Invoke-RestMethod -Uri "$baseUrl/api/analytics/reports/generate" `
        -Method Post `
        -Headers $headers `
        -Body $reportBody

    Write-Host "  ✅ PASS: Report generated" -ForegroundColor Green
    Write-Host "    Date: $($report.incident_date)" -ForegroundColor Gray
    Write-Host "    Total Patients: $($report.total_patients)" -ForegroundColor Gray
    Write-Host "    RED: $($report.red_priority_count) | YELLOW: $($report.yellow_priority_count) | GREEN: $($report.green_priority_count)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Green
Write-Host "🎉 Health check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💾 Saved tokens for manual testing:" -ForegroundColor Yellow
Write-Host "`$adminToken = '$adminToken'" -ForegroundColor Gray
Write-Host "`$doctorToken = '$doctorToken'" -ForegroundColor Gray
Write-Host ""
Write-Host "Use these tokens to test other endpoints manually:" -ForegroundColor Yellow
Write-Host "  Invoke-RestMethod -Uri 'http://localhost:3000/api/hospitals/1/stats' -Headers @{'Authorization'='Bearer $adminToken'}" -ForegroundColor Gray
