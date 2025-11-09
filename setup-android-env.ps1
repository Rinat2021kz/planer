# Script to setup Android environment variables
Write-Host "`n=== Android Environment Setup ===" -ForegroundColor Cyan

# Find Android SDK
Write-Host "`nSearching for Android SDK..." -ForegroundColor Yellow

$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "$env:ProgramFiles\Android\Sdk",
    "${env:ProgramFiles(x86)}\Android\Sdk"
)

$sdkPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Green
        break
    }
}

if (-not $sdkPath) {
    Write-Host "ERROR: Android SDK not found!" -ForegroundColor Red
    Write-Host "Please install Android SDK through Android Studio:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "2. Go to: More Actions -> SDK Manager" -ForegroundColor Yellow
    Write-Host "3. Install Android SDK" -ForegroundColor Yellow
    exit 1
}

# Set ANDROID_HOME
Write-Host "`nSetting ANDROID_HOME..." -ForegroundColor Yellow
try {
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
    [System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkPath, "User")
    Write-Host "OK ANDROID_HOME set to: $sdkPath" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to set ANDROID_HOME" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Update PATH
Write-Host "`nUpdating PATH..." -ForegroundColor Yellow
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

$pathsToAdd = @(
    "$sdkPath\platform-tools",
    "$sdkPath\cmdline-tools\latest\bin",
    "$sdkPath\emulator"
)

$pathUpdated = $false
foreach ($pathToAdd in $pathsToAdd) {
    if (Test-Path $pathToAdd) {
        if ($currentPath -notlike "*$pathToAdd*") {
            $currentPath = "$currentPath;$pathToAdd"
            $pathUpdated = $true
            Write-Host "Added to PATH: $pathToAdd" -ForegroundColor Green
        } else {
            Write-Host "Already in PATH: $pathToAdd" -ForegroundColor Gray
        }
    } else {
        Write-Host "WARNING: Path does not exist: $pathToAdd" -ForegroundColor Yellow
    }
}

if ($pathUpdated) {
    try {
        [System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
        Write-Host "OK PATH updated successfully" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to update PATH" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# Reload environment for current session
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:Path = "$env:Path;$sdkPath\platform-tools;$sdkPath\cmdline-tools\latest\bin;$sdkPath\emulator"

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nIMPORTANT: Close and reopen PowerShell/Terminal for changes to take effect" -ForegroundColor Yellow
Write-Host "`nAfter restarting terminal, run:" -ForegroundColor Cyan
Write-Host "  npm run check:android" -ForegroundColor White
Write-Host "`nThen you can run:" -ForegroundColor Cyan
Write-Host "  npm run android" -ForegroundColor White
Write-Host ""








