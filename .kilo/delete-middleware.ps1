Remove-Item -LiteralPath "C:\Users\devra\rentfy\middleware.ts" -Force
if (Test-Path -LiteralPath "C:\Users\devra\rentfy\middleware.ts") { Write-Output "STILL_EXISTS" } else { Write-Output "DELETED" }
