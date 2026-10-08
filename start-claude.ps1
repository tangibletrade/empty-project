Set-Location -LiteralPath $PSScriptRoot
$settings = Get-Content -LiteralPath (Join-Path $PSScriptRoot '.claude\settings.local.json') -Raw | ConvertFrom-Json
$env:ANTHROPIC_API_KEY = $settings.env.ANTHROPIC_API_KEY
& claude @args