# TRIAGELOCK COMPREHENSIVE BACKEND TEST SUITE
# Tests ALL endpoints, data accuracy, and edge cases

$base = "http://localhost:3000"
$failed = 0
$passed = 0

function Test-Endpoint {
    param($name, $scriptblock)
    Write-Host "`n[$($passed + $failed + 1)] $name" -ForegroundColor Cyan
    try {
        & $scriptblock
        $script:passed++
        Write-Host "   PASS" -ForegroundColor Green
        return $true
    } catch {
        $script:failed++
        Write-Host "   FAIL: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n================================" -ForegroundColor Yellow
Write-Host "TRIAGELOCK COMPREHENSIVE TEST" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Yellow

# ========================================
# AUTHENTICATION TESTS
# ========================================
Write-Host "`n=== AUTHENTICATION ===" -ForegroundColor Magenta

Test-Endpoint "Health Check" {
    $h = Invoke-RestMethod "$base/health"
    if ($h.status -ne "ok") { throw "Health status not ok" }
}

$adminToken = $null
Test-Endpoint "Register/Login Admin User" {
    try {
        $body = @{
            email = "test.comprehensive.admin@test.com"
            password = "Test123!"
            name = "Test Admin"
            role = "admin"
            hospitalId = 1
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $body
        $script:adminToken = $r.token
    } catch {
        # User exists, try login
        $body = @{
            email = "test.comprehensive.admin@test.com"
            password = "Test123!"
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body
        $script:adminToken = $r.token
    }
    
    if (!$script:adminToken) { throw "Failed to get admin token" }
}

$doctorToken = $null
Test-Endpoint "Register/Login Doctor User" {
    try {
        $body = @{
            email = "test.comprehensive.doctor@test.com"
            password = "Test123!"
            name = "Dr. Test"
            role = "doctor"
            hospitalId = 1
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $body
        $script:doctorToken = $r.token
    } catch {
        # User exists, try login
        $body = @{
            email = "test.comprehensive.doctor@test.com"
            password = "Test123!"
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body
        $script:doctorToken = $r.token
    }
    
    if (!$script:doctorToken) { throw "Failed to get doctor token" }
}

$nurseToken = $null
Test-Endpoint "Register/Login Nurse User" {
    try {
        $body = @{
            email = "test.comprehensive.nurse@test.com"
            password = "Test123!"
            name = "Nurse Test"
            role = "nurse"
            hospitalId = 1
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $body
        $script:nurseToken = $r.token
    } catch {
        # User exists, try login
        $body = @{
            email = "test.comprehensive.nurse@test.com"
            password = "Test123!"
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body
        $script:nurseToken = $r.token
    }
    
    if (!$script:nurseToken) { throw "Failed to get nurse token" }
}

$govToken = $null
Test-Endpoint "Register/Login Government User" {
    try {
        $body = @{
            email = "test.comprehensive.gov@test.com"
            password = "Test123!"
            name = "Gov Official"
            role = "government"
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $body
        $script:govToken = $r.token
    } catch {
        # User exists, try login
        $body = @{
            email = "test.comprehensive.gov@test.com"
            password = "Test123!"
        } | ConvertTo-Json
        
        $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body
        $script:govToken = $r.token
    }
    
    if (!$script:govToken) { throw "Failed to get gov token" }
}

Test-Endpoint "Login with Existing User" {
    $body = @{
        email = "doctor@cityhospital.com"
        password = "doctor123"
    } | ConvertTo-Json
    
    $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    if (!$r.token) { throw "No token returned" }
    if ($r.user.email -ne "doctor@cityhospital.com") { throw "Wrong user returned" }
}

Test-Endpoint "Get User Profile" {
    $r = Invoke-RestMethod "$base/api/auth/profile" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($r.email -ne "test.comprehensive.admin@test.com") { throw "Wrong profile returned" }
}

Test-Endpoint "Reject Invalid Token" {
    try {
        Invoke-RestMethod "$base/api/auth/profile" -Headers @{"Authorization"="Bearer invalid.token.here"}
        throw "Should have rejected invalid token"
    } catch {
        if ($_.Exception.Response.StatusCode -ne 401) { throw "Should return 401 for invalid token" }
    }
}

# ========================================
# HOSPITAL TESTS
# ========================================
Write-Host "`n=== HOSPITALS ===" -ForegroundColor Magenta

Test-Endpoint "List All Hospitals" {
    $r = Invoke-RestMethod "$base/api/hospitals" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($r.Count -lt 3) { throw "Should have at least 3 seeded hospitals" }
    if (!$r[0].name) { throw "Hospital missing name field" }
}

Test-Endpoint "Get Hospital Stats" {
    $r = Invoke-RestMethod "$base/api/hospitals/1/stats" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($null -eq $r.totalBeds) { throw "Missing totalBeds" }
    if ($null -eq $r.availableBeds) { throw "Missing availableBeds" }
    if ($null -eq $r.waitingPatients) { throw "Missing waitingPatients" }
    if ($r.totalBeds -ne 200) { throw "Wrong total beds from seed data" }
}

Test-Endpoint "Update Bed Availability" {
    $body = @{
        availableBeds = 140
        availableIcuBeds = 18
    } | ConvertTo-Json
    
    $r = Invoke-RestMethod "$base/api/hospitals/1/beds" -Method Put -Headers @{"Authorization"="Bearer $adminToken";"Content-Type"="application/json"} -Body $body
    if ($r.available_beds -ne 140) { throw "Beds not updated correctly" }
    if ($r.available_icu_beds -ne 18) { throw "ICU beds not updated correctly" }
}

Test-Endpoint "Update Staff Availability" {
    $body = @{
        role = "doctor"
        availableCount = 10
        totalCount = 20
    } | ConvertTo-Json
    
    $r = Invoke-RestMethod "$base/api/hospitals/1/staff" -Method Put -Headers @{"Authorization"="Bearer $adminToken";"Content-Type"="application/json"} -Body $body
    if ($r.availableCount -ne 10) { throw "Staff count not updated" }
    if ($r.availabilityRate -ne 50) { throw "Availability rate calculation wrong (should be 50%)" }
}

Test-Endpoint "Check Hospital Overload Status" {
    $r = Invoke-RestMethod "$base/api/hospitals/1/overload" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($null -eq $r.isOverloaded) { throw "Missing isOverloaded field" }
    if ($null -eq $r.bedUtilization) { throw "Missing bedUtilization field" }
}

# ========================================
# TRIAGE ENGINE TESTS (CRITICAL!)
# ========================================
Write-Host "`n=== TRIAGE ENGINE ===" -ForegroundColor Magenta

$redPatientId = $null
Test-Endpoint "Triage RED Patient (Critical Vitals)" {
    $body = @{
        patientId = "TEST-RED-001"
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
            symptoms = @(@{symptom="chest pain";severity="critical"})
            riskFactors = @(@{factor="diabetes";category="chronic"})
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.triageResult.priority -ne "RED") { throw "Should be RED priority, got $($r.triageResult.priority)" }
    if ($r.triageResult.score -lt 80) { throw "RED score should be >= 80, got $($r.triageResult.score)" }
    if ($r.triageResult.reasons.Count -eq 0) { throw "Should have clinical reasons" }
    $script:redPatientId = $r.patient.id
}

$yellowPatientId = $null
Test-Endpoint "Triage YELLOW Patient (Urgent)" {
    $body = @{
        patientId = "TEST-YELLOW-001"
        name = "Urgent Patient"
        age = 45
        gender = "female"
        triageInput = @{
            vitalSigns = @{
                heartRate = 115
                respiratoryRate = 24
                systolicBP = 155
                oxygenSaturation = 93
                consciousness = "alert"
            }
            symptoms = @(@{symptom="severe abdominal pain";severity="severe"})
            riskFactors = @()
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.triageResult.priority -ne "YELLOW") { throw "Should be YELLOW priority, got $($r.triageResult.priority)" }
    if ($r.triageResult.score -lt 50 -or $r.triageResult.score -ge 80) { throw "YELLOW score should be 50-79, got $($r.triageResult.score)" }
    $script:yellowPatientId = $r.patient.id
}

$greenPatientId = $null
Test-Endpoint "Triage GREEN Patient (Standard)" {
    $body = @{
        patientId = "TEST-GREEN-001"
        name = "Standard Patient"
        age = 30
        gender = "male"
        triageInput = @{
            vitalSigns = @{
                heartRate = 95
                respiratoryRate = 18
                systolicBP = 145
                oxygenSaturation = 96
                consciousness = "alert"
            }
            symptoms = @(@{symptom="moderate pain";severity="moderate"})
            riskFactors = @()
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.triageResult.priority -ne "GREEN") { throw "Should be GREEN priority, got $($r.triageResult.priority)" }
    if ($r.triageResult.score -lt 20 -or $r.triageResult.score -ge 50) { throw "GREEN score should be 20-49, got $($r.triageResult.score)" }
    $script:greenPatientId = $r.patient.id
}

$bluePatientId = $null
Test-Endpoint "Triage BLUE Patient (Minor)" {
    $body = @{
        patientId = "TEST-BLUE-001"
        name = "Minor Patient"
        age = 25
        gender = "female"
        triageInput = @{
            vitalSigns = @{
                heartRate = 75
                respiratoryRate = 16
                systolicBP = 120
                oxygenSaturation = 98
                consciousness = "alert"
            }
            symptoms = @(@{symptom="minor cut";severity="mild"})
            riskFactors = @()
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.triageResult.priority -ne "BLUE") { throw "Should be BLUE priority, got $($r.triageResult.priority)" }
    if ($r.triageResult.score -ge 20) { throw "BLUE score should be < 20, got $($r.triageResult.score)" }
    $script:bluePatientId = $r.patient.id
}

# ========================================
# QUEUE TESTS
# ========================================
Write-Host "`n=== EMERGENCY QUEUE ===" -ForegroundColor Magenta

Test-Endpoint "Get Emergency Queue (Sorted by Priority)" {
    $r = Invoke-RestMethod "$base/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $doctorToken"}
    if ($r.Count -lt 4) { throw "Should have at least 4 test patients" }
    
    # Check priority sorting
    $priorities = $r | Select-Object -ExpandProperty priority
    $redIndex = [array]::IndexOf($priorities, "RED")
    $blueIndex = [array]::IndexOf($priorities, "BLUE")
    if ($blueIndex -lt $redIndex) { throw "Queue not sorted correctly - BLUE before RED" }
}

Test-Endpoint "Queue Shows Waiting Times" {
    $r = Invoke-RestMethod "$base/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $doctorToken"}
    $patient = $r[0]
    if ($null -eq $patient.waiting_time_minutes) { throw "Missing waiting_time_minutes" }
    if ($patient.waiting_time_minutes -lt 0) { throw "Invalid waiting time" }
}

Test-Endpoint "Queue Shows Latest Vitals" {
    $r = Invoke-RestMethod "$base/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $doctorToken"}
    $patient = $r | Where-Object { $_.patient_id -eq "TEST-RED-001" }
    if (!$patient.latest_vitals) { throw "Missing latest_vitals" }
    if ($patient.latest_vitals.heart_rate -ne 145) { throw "Vital signs not matching registration data" }
}

# ========================================
# PATIENT MANAGEMENT TESTS
# ========================================
Write-Host "`n=== PATIENT MANAGEMENT ===" -ForegroundColor Magenta

Test-Endpoint "Update Patient Vitals" {
    $body = @{
        vitalSigns = @{
            heartRate = 120
            respiratoryRate = 22
            systolicBP = 140
            oxygenSaturation = 94
            consciousness = "alert"
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients/$greenPatientId/vitals" -Method Put -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    # Should not escalate (vitals improved)
    if ($r.shouldEscalate -eq $true) { throw "Should not escalate with improved vitals" }
}

Test-Endpoint "Vitals Deterioration Triggers Escalation" {
    $body = @{
        vitalSigns = @{
            heartRate = 150
            respiratoryRate = 35
            systolicBP = 80
            oxygenSaturation = 85
            consciousness = "verbal"
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients/$greenPatientId/vitals" -Method Put -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.shouldEscalate -ne $true) { throw "Should escalate with critical vitals" }
    if ($r.newPriority -ne "RED") { throw "Should escalate to RED, got $($r.newPriority)" }
}

Test-Endpoint "Update Patient Status to In Treatment" {
    $body = @{status = "in_treatment"} | ConvertTo-Json
    $r = Invoke-RestMethod "$base/api/patients/$redPatientId/status" -Method Put -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.status -ne "in_treatment") { throw "Status not updated" }
    if (!$r.treatment_start_time) { throw "Missing treatment_start_time" }
}

Test-Endpoint "Update Patient Status to Discharged" {
    $body = @{status = "discharged"} | ConvertTo-Json
    $r = Invoke-RestMethod "$base/api/patients/$bluePatientId/status" -Method Put -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    if ($r.status -ne "discharged") { throw "Status not updated" }
    if (!$r.discharge_time) { throw "Missing discharge_time" }
}

# ========================================
# ANALYTICS TESTS
# ========================================
Write-Host "`n=== ANALYTICS ===" -ForegroundColor Magenta

Test-Endpoint "Generate Daily Report" {
    $body = @{date = (Get-Date -Format "yyyy-MM-dd")} | ConvertTo-Json
    $r = Invoke-RestMethod "$base/api/analytics/reports/generate" -Method Post -Headers @{"Authorization"="Bearer $adminToken";"Content-Type"="application/json"} -Body $body
    if ($null -eq $r.total_patients) { throw "Missing total_patients" }
    if ($r.total_patients -lt 4) { throw "Should count test patients" }
    if ($null -eq $r.red_priority_count) { throw "Missing red_priority_count" }
}

Test-Endpoint "Get Reports" {
    $r = Invoke-RestMethod "$base/api/analytics/reports?hospitalId=1" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($r.Count -eq 0) { throw "Should have generated reports" }
}

Test-Endpoint "Government Dashboard" {
    $r = Invoke-RestMethod "$base/api/analytics/government/dashboard" -Headers @{"Authorization"="Bearer $govToken"}
    if ($null -eq $r.overall) { throw "Missing overall stats" }
    if ($null -eq $r.byHospital) { throw "Missing byHospital stats" }
    if ($r.byHospital.Count -eq 0) { throw "Should have hospital data" }
}

Test-Endpoint "Crowd Surge Monitoring" {
    $r = Invoke-RestMethod "$base/api/analytics/crowd-surge" -Headers @{"Authorization"="Bearer $govToken"}
    if ($null -eq $r.allHospitals) { throw "Missing allHospitals" }
    if ($null -eq $r.totalSurges) { throw "Missing totalSurges" }
}

# ========================================
# ALERTS TESTS
# ========================================
Write-Host "`n=== ALERTS ===" -ForegroundColor Magenta

Test-Endpoint "Get Hospital Alerts" {
    $r = Invoke-RestMethod "$base/api/hospitals/1/alerts?acknowledged=false" -Headers @{"Authorization"="Bearer $adminToken"}
    # May be empty or have alerts
    if ($null -eq $r) { throw "Should return array (even if empty)" }
}

Test-Endpoint "Create Alert by Low Bed Availability" {
    # Set beds very low to trigger alert
    $body = @{availableBeds = 2; availableIcuBeds = 0} | ConvertTo-Json
    Invoke-RestMethod "$base/api/hospitals/1/beds" -Method Put -Headers @{"Authorization"="Bearer $adminToken";"Content-Type"="application/json"} -Body $body | Out-Null
    
    Start-Sleep -Seconds 1
    
    $alerts = Invoke-RestMethod "$base/api/hospitals/1/alerts?acknowledged=false" -Headers @{"Authorization"="Bearer $adminToken"}
    $bedAlert = $alerts | Where-Object { $_.type -eq "bed_shortage" }
    if (!$bedAlert) { throw "Should create bed_shortage alert when beds < 5" }
}

$alertId = $null
Test-Endpoint "Acknowledge Alert" {
    $alerts = Invoke-RestMethod "$base/api/hospitals/1/alerts?acknowledged=false" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($alerts.Count -gt 0) {
        $script:alertId = $alerts[0].id
        $r = Invoke-RestMethod "$base/api/hospitals/alerts/$alertId/acknowledge" -Method Put -Headers @{"Authorization"="Bearer $adminToken"}
        if ($r.acknowledged -ne $true) { throw "Alert not acknowledged" }
        if (!$r.acknowledged_at) { throw "Missing acknowledged_at timestamp" }
    }
}

# ========================================
# AUTHORIZATION TESTS
# ========================================
Write-Host "`n=== AUTHORIZATION ===" -ForegroundColor Magenta

Test-Endpoint "Nurse Cannot Update Bed Availability" {
    try {
        $body = @{availableBeds = 100} | ConvertTo-Json
        Invoke-RestMethod "$base/api/hospitals/1/beds" -Method Put -Headers @{"Authorization"="Bearer $nurseToken";"Content-Type"="application/json"} -Body $body
        throw "Nurse should not be able to update beds"
    } catch {
        if ($_.Exception.Response.StatusCode -ne 403) { throw "Should return 403 Forbidden" }
    }
}

Test-Endpoint "Doctor Cannot Access Government Dashboard" {
    try {
        Invoke-RestMethod "$base/api/analytics/government/dashboard" -Headers @{"Authorization"="Bearer $doctorToken"}
        throw "Doctor should not access government dashboard"
    } catch {
        if ($_.Exception.Response.StatusCode -ne 403) { throw "Should return 403 Forbidden" }
    }
}

Test-Endpoint "Nurse Can Register Patients" {
    $body = @{
        patientId = "TEST-NURSE-001"
        name = "Nurse Registered"
        age = 40
        gender = "male"
        triageInput = @{
            vitalSigns = @{heartRate=80;respiratoryRate=16;systolicBP=120;oxygenSaturation=98;consciousness="alert"}
            symptoms = @(@{symptom="minor";severity="mild"})
            riskFactors = @()
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $nurseToken";"Content-Type"="application/json"} -Body $body
    if (!$r.patient.id) { throw "Nurse should be able to register patients" }
}

# ========================================
# DATA ACCURACY TESTS
# ========================================
Write-Host "`n=== DATA ACCURACY ===" -ForegroundColor Magenta

Test-Endpoint "Hospital Stats Match Database" {
    $stats = Invoke-RestMethod "$base/api/hospitals/1/stats" -Headers @{"Authorization"="Bearer $adminToken"}
    $queue = Invoke-RestMethod "$base/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $doctorToken"}
    
    $actualWaiting = $queue.Count
    if ($stats.waitingPatients -ne $actualWaiting) {
        throw "Stats show $($stats.waitingPatients) waiting, but queue has $actualWaiting"
    }
}

Test-Endpoint "Priority Counts Are Accurate" {
    $queue = Invoke-RestMethod "$base/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $doctorToken"}
    $redCount = ($queue | Where-Object {$_.priority -eq "RED"}).Count
    
    $stats = Invoke-RestMethod "$base/api/hospitals/1/stats" -Headers @{"Authorization"="Bearer $adminToken"}
    if ($stats.criticalCases -ne $redCount) {
        throw "Stats show $($stats.criticalCases) critical cases, but queue has $redCount RED patients"
    }
}

Test-Endpoint "Triage Score Calculation Matches Algorithm" {
    # Test known scenario: Critical vitals should give specific score
    $body = @{
        patientId = "TEST-SCORE-VALIDATION"
        name = "Score Test"
        age = 75
        gender = "male"
        triageInput = @{
            vitalSigns = @{
                heartRate = 35  # Critical: +30
                respiratoryRate = 6  # Critical: +30
                systolicBP = 200  # Critical: +30
                oxygenSaturation = 88  # Critical: +30
                consciousness = "unresponsive"  # Critical: +40
            }
            symptoms = @()
            riskFactors = @()
        }
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $doctorToken";"Content-Type"="application/json"} -Body $body
    
    # Expected: 30+30+30+30+40+10(age>65) = 170
    if ($r.triageResult.score -lt 160 -or $r.triageResult.score -gt 180) {
        throw "Score calculation incorrect. Expected ~170, got $($r.triageResult.score)"
    }
}

# ========================================
# RESULTS
# ========================================
Write-Host "`n================================" -ForegroundColor Yellow
Write-Host "TEST RESULTS" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host "PASSED: $passed" -ForegroundColor Green
Write-Host "FAILED: $failed" -ForegroundColor Red
Write-Host "TOTAL:  $($passed + $failed)" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`nALL TESTS PASSED - BACKEND IS FULLY FUNCTIONAL" -ForegroundColor Green
} else {
    Write-Host "`nSOME TESTS FAILED - REVIEW ERRORS ABOVE" -ForegroundColor Red
}

Write-Host "`n================================`n" -ForegroundColor Yellow
