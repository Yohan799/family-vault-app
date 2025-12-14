# Test Password Reset OTP (with push notification)
# This tests the forgot password flow - no auth needed

$email = Read-Host "Enter your email address"

$body = @{
    email = $email
} | ConvertTo-Json

$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYnlvd2Z6c2JxYWt6cmZ5ZHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODkxMjAsImV4cCI6MjA3OTQ2NTEyMH0.UdRcpLL2p8n_OyM-vQHKjcVk1FGZCczLommvXE9Htcs"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "Sending password reset OTP to: $email" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://yebyowfzsbqakzrfydxr.supabase.co/functions/v1/send-password-reset-otp" -Method POST -Headers $headers -Body $body
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:"
    $response | ConvertTo-Json
    Write-Host ""
    Write-Host "Check your phone for push notification with the OTP code!" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
