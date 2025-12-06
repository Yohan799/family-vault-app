$body = @{
    user_id = "93061cc3-beee-4f86-bbfb-e8277e76b6a3"
    title = "Test Notification"
    body = "This is a test at $(Get-Date -Format 'HH:mm:ss')"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYnlvd2Z6c2JxYWt6cmZ5ZHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODkxMjAsImV4cCI6MjA3OTQ2NTEyMH0.UdRcpLL2p8n_OyM-vQHKjcVk1FGZCczLommvXE9Htcs"
    "Content-Type" = "application/json"
}

Write-Host "Sending push notification..."
Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')"

$response = Invoke-RestMethod -Uri "https://yebyowfzsbqakzrfydxr.supabase.co/functions/v1/send-push-notification" -Method POST -Headers $headers -Body $body

Write-Host "Response:"
$response | ConvertTo-Json
