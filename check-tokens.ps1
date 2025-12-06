$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYnlvd2Z6c2JxYWt6cmZ5ZHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODkxMjAsImV4cCI6MjA3OTQ2NTEyMH0.UdRcpLL2p8n_OyM-vQHKjcVk1FGZCczLommvXE9Htcs"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYnlvd2Z6c2JxYWt6cmZ5ZHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODkxMjAsImV4cCI6MjA3OTQ2NTEyMH0.UdRcpLL2p8n_OyM-vQHKjcVk1FGZCczLommvXE9Htcs"
}

$response = Invoke-RestMethod -Uri "https://yebyowfzsbqakzrfydxr.supabase.co/rest/v1/device_tokens?user_id=eq.93061cc3-beee-4f86-bbfb-e8277e76b6a3&select=*" -Method GET -Headers $headers

Write-Host "Device tokens for user:"
$response | ConvertTo-Json -Depth 5
