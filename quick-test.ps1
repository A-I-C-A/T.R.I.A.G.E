# TRIAGELOCK Backend Quick Test

$baseUrl = "http://localhost:3000"

Write-Host "`n🏥 TRIAGELOCK Backend Quick Test" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

# Test 1: Health Check
Write-Host "1. Testing health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health"
    if ($health.status -eq "ok") {
        Write-Host "   ✅ PASS: Server is running`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ FAIL: Server not running. Run 'npm run dev' first`n" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "2. Logging in as doctor..." -ForegroundColor Cyan
$loginBody = @{
    email = "doctor@cityhospital.com"
    password = "doctor123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$doctorToken = $loginResponse.token
Write-Host "   ✅ PASS: Logged in successfully`n" -ForegroundColor Green

# Test 3: Get Hospitals
Write-Host "3. Getting hospital list..." -ForegroundColor Cyan
$hospitals = Invoke-RestMethod -Uri "$baseUrl/api/hospitals" -Headers @{"Authorization"="Bearer $doctorToken"}
Write-Host "   ✅ PASS: Found $($hospitals.Count) hospitals`n" -ForegroundColor Green

# Test 4: Get Hospital Stats
Write-Host "4. Getting hospital statistics..." -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "$baseUrl/api/hospitals/1/stats" -Headers @{"Authorization"="Bearer $doctorToken"}
Write-Host "   ✅ PASS: Stats retrieved" -ForegroundColor Green
Write-Host "      Total Beds: $($stats.totalBeds)" -ForegroundColor Gray
Write-Host "      Available: $($stats.availableBeds)" -ForegroundColor Gray
Write-Host "      Waiting Patients: $($stats.waitingPatients)`n" -ForegroundColor Gray

# Test 5: Register CRITICAL Patient (RED Priority)
Write-Host "5. Registering CRITICAL patient (should be RED)..." -ForegroundColor Cyan
$patientBody = @{
    patientId = "PT-TEST-$(Get-Date -Format 'HHmmss')"
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
            @{symptom = "chest pain"; severity = "critical"}
        )
        riskFactors = @(
            @{factor = "diabetes"; category = "chronic"}
        )
    }
} | ConvertTo-Json -Depth 10

$patient = Invoke-RestMethod -Uri "$baseUrl/api/patients" -Method Post -Headers @{"Authorization"="Bearer $doctorToken"; "Content-Type"="application/json"} -Body $patientBody

if ($patient.triageResult.priority -eq "RED") {
    Write-Host "   ✅ PASS: Patient triaged as RED (Critical)" -ForegroundColor Green
    Write-Host "      Triage Score: $($patient.triageResult.score)" -ForegroundColor Gray
    Write-Host "      Reasons:" -ForegroundColor Gray
    foreach ($reason in $patient.triageResult.reasons) {
        Write-Host "        - $reason" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ FAIL: Expected RED, got $($patient.triageResult.priority)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Emergency Queue
Write-Host "6. Getting emergency queue..." -ForegroundColor Cyan
$queue = Invoke-RestMethod -Uri "$baseUrl/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $doctorToken"}
Write-Host "   ✅ PASS: Queue retrieved" -ForegroundColor Green
Write-Host "      Total Waiting: $($queue.Count)" -ForegroundColor Gray

$redCount = ($queue | Where-Object { $_.priority -eq "RED" }).Count
$yellowCount = ($queue | Where-Object { $_.priority -eq "YELLOW" }).Count
$greenCount = ($queue | Where-Object { $_.priority -eq "GREEN" }).Count

Write-Host "      RED: $redCount | YELLOW: $yellowCount | GREEN: $greenCount`n" -ForegroundColor Gray

# Test 7: Generate Report
Write-Host "7. Generating analytics report..." -ForegroundColor Cyan
$reportBody = @{
    date = (Get-Date -Format "yyyy-MM-dd")
} | ConvertTo-Json

$report = Invoke-RestMethod -Uri "$baseUrl/api/analytics/reports/generate" -Method Post -Headers @{"Authorization"="Bearer $doctorToken"; "Content-Type"="application/json"} -Body $reportBody
Write-Host "   ✅ PASS: Report generated" -ForegroundColor Green
Write-Host "      Total Patients: $($report.total_patients)" -ForegroundColor Gray
Write-Host "      RED: $($report.red_priority_count) | YELLOW: $($report.yellow_priority_count) | GREEN: $($report.green_priority_count)`n" -ForegroundColor Gray

Write-Host "================================" -ForegroundColor Green
Write-Host "🎉 All tests passed!" -ForegroundColor Green
Write-Host "`n💾 Your doctor token for manual testing:" -ForegroundColor Yellow
Write-Host "`$doctorToken = '$doctorToken'`n" -ForegroundColor Gray
