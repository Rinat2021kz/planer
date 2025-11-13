# Find Android SDK on the system
Write-Host "=== Searching for Android SDK ===" -ForegroundColor Cyan
Write-Host ""

$searchPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:APPDATA\Android\Sdk",
    "C:\Android\Sdk",
    "D:\Android\Sdk",
    "$env:ProgramFiles\Android\Sdk",
    "${env:ProgramFiles(x86)}\Android\Sdk",
    "$env:LOCALAPPDATA\Android\android-sdk",
    "C:\Android\android-sdk"
)

Write-Host "Checking common locations..." -ForegroundColor Yellow
$found = $false

foreach ($path in $searchPaths) {
    Write-Host "  Checking: $path" -ForegroundColor Gray
    if (Test-Path $path) {
        Write-Host "  >> FOUND: $path" -ForegroundColor Green
        
        # Check if it has platform-tools
        if (Test-Path "$path\platform-tools") {
            Write-Host "     Contains platform-tools: YES" -ForegroundColor Green
            $found = $true
        } else {
            Write-Host "     Contains platform-tools: NO (might be incomplete)" -ForegroundColor Yellow
        }
        
        # Check if it has adb
        if (Test-Path "$path\platform-tools\adb.exe") {
            Write-Host "     Contains adb.exe: YES" -ForegroundColor Green
        }
        
        Write-Host ""
    }
}

if (-not $found) {
    Write-Host "Android SDK not found in common locations!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check Android Studio SDK Manager:" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor White
    Write-Host "  2. More Actions -> SDK Manager" -ForegroundColor White
    Write-Host "  3. Look at 'Android SDK Location' at the top" -ForegroundColor White
    Write-Host "  4. If empty - click 'Edit' and install SDK" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "If you found your SDK path above, run this command:" -ForegroundColor Cyan
    Write-Host '  npm run setup:android:manual "YOUR_SDK_PATH"' -ForegroundColor White
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Gray
    Write-Host '  npm run setup:android:manual "C:\Users\7\AppData\Local\Android\Sdk"' -ForegroundColor Gray
}

Write-Host ""









