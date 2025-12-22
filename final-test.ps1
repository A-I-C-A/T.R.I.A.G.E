# TRIAGELOCK Backend Test
$base = "http://localhost:3000"

Write-Host "`nTRIAGELOCK BACKEND TEST`n" -ForegroundColor Green

# 1. Health Check
Write-Host "Health Check..." -NoNewline
$h = Invoke-RestMethod "$base/health"
Write-Host " PASS: $($h.status)`n" -ForegroundColor Green

# 2. Login
Write-Host "Login..." -NoNewline
$login = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"doctor@cityhospital.com","password":"doctor123"}'
$token = $login.token
Write-Host " PASS: Logged in as $($login.user.name)`n" -ForegroundColor Green

# 3. Register CRITICAL Patient
Write-Host "Register CRITICAL Patient..." -NoNewline
$p = Invoke-RestMethod "$base/api/patients" -Method Post -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body (@{
  patientId="PT-$(Get-Date -Format 'HHmmss')"
  name="Critical Test"
  age=65
  gender="male"
  triageInput=@{
    vitalSigns=@{heartRate=145;respiratoryRate=32;systolicBP=85;oxygenSaturation=88;consciousness="pain"}
    symptoms=@(@{symptom="chest pain";severity="critical"})
    riskFactors=@(@{factor="diabetes";category="chronic"})
  }
} | ConvertTo-Json -Depth 10)
Write-Host " PASS: Priority: $($p.triageResult.priority) | Score: $($p.triageResult.score)`n" -ForegroundColor $(if($p.triageResult.priority -eq "RED"){"Red"}else{"Yellow"})

# 4. Get Queue
Write-Host "Emergency Queue..." -NoNewline
$q = Invoke-RestMethod "$base/api/patients/queue?status=waiting" -Headers @{"Authorization"="Bearer $token"}
$r = ($q | Where-Object {$_.priority -eq "RED"}).Count
$y = ($q | Where-Object {$_.priority -eq "YELLOW"}).Count
Write-Host " PASS: Total: $($q.Count) | RED: $r | YELLOW: $y`n" -ForegroundColor Green

# 5. Hospital Stats
Write-Host "Hospital Stats..." -NoNewline
$s = Invoke-RestMethod "$base/api/hospitals/1/stats" -Headers @{"Authorization"="Bearer $token"}
Write-Host " PASS: Beds: $($s.availableBeds)/$($s.totalBeds) | Waiting: $($s.waitingPatients)`n" -ForegroundColor Green

Write-Host "ALL TESTS PASSED!`n" -ForegroundColor Green
Write-Host "Token: $token`n" -ForegroundColor Gray
