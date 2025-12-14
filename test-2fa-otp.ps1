# Test 2FA OTP (with push notification)
# This tests the 2FA flow - requires a valid JWT token

# You need to get a fresh JWT token by logging in first
# Get this from browser DevTools > Application > Local Storage > supabase.auth.token

$jwtToken = Read-Host "Enter your JWT access token (from browser login)"

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYnlvd2Z6c2JxYWt6cmZ5ZHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODkxMjAsImV4cCI6MjA3OTQ2NTEyMH0.UdRcpLL2p8n_OyM-vQHKjcVk1FGZCczLommvXE9Htcs"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "Sending 2FA OTP request..." -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://yebyowfzsbqakzrfydxr.supabase.co/functions/v1/send-2fa-otp" -Method POST -Headers $headers -Body "{}"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:"
    $response | ConvertTo-Json
    Write-Host ""
    Write-Host "Check your phone for push notification with the 2FA code!" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
