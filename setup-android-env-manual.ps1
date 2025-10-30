# Manual Android SDK path setup
param(
    [Parameter(Mandatory=$true)]
    [string]$SdkPath
)

Write-Host "`n=== Manual Android Environment Setup ===" -ForegroundColor Cyan

# Validate path
if (-not (Test-Path $SdkPath)) {
    Write-Host "ERROR: Path does not exist: $SdkPath" -ForegroundColor Red
    exit 1
}

# Check if it looks like an SDK
if (-not (Test-Path "$SdkPath\platform-tools")) {
    Write-Host "WARNING: This doesn't look like an Android SDK (no platform-tools folder)" -ForegroundColor Yellow
    Write-Host "Path: $SdkPath" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

Write-Host "Using SDK path: $SdkPath" -ForegroundColor Green

# Set ANDROID_HOME
Write-Host "`nSetting ANDROID_HOME..." -ForegroundColor Yellow
try {
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $SdkPath, "User")
    [System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $SdkPath, "User")
    Write-Host "OK ANDROID_HOME = $SdkPath" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to set ANDROID_HOME" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Update PATH
Write-Host "`nUpdating PATH..." -ForegroundColor Yellow
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

$pathsToAdd = @(
    "$SdkPath\platform-tools",
    "$SdkPath\cmdline-tools\latest\bin",
    "$SdkPath\emulator"
)

$pathUpdated = $false
foreach ($pathToAdd in $pathsToAdd) {
    if (Test-Path $pathToAdd) {
        if ($currentPath -notlike "*$pathToAdd*") {
            $currentPath = "$currentPath;$pathToAdd"
            $pathUpdated = $true
            Write-Host "Added: $pathToAdd" -ForegroundColor Green
        } else {
            Write-Host "Already in PATH: $pathToAdd" -ForegroundColor Gray
        }
    } else {
        Write-Host "WARNING: Does not exist: $pathToAdd" -ForegroundColor Yellow
    }
}

if ($pathUpdated) {
    try {
        [System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
        Write-Host "OK PATH updated" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to update PATH" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nIMPORTANT: Restart PowerShell/Terminal!" -ForegroundColor Yellow
Write-Host "`nThen run: npm run check:android" -ForegroundColor Cyan
Write-Host ""



