# Android SDK Setup Check Script
Write-Host "`n=== Android SDK Setup Check ===" -ForegroundColor Cyan

# Check ANDROID_HOME
Write-Host "`n1. Checking ANDROID_HOME variable..." -ForegroundColor Yellow
if ($env:ANDROID_HOME) {
    Write-Host "   OK ANDROID_HOME is set: $env:ANDROID_HOME" -ForegroundColor Green
    
    if (Test-Path $env:ANDROID_HOME) {
        Write-Host "   OK Directory exists" -ForegroundColor Green
    } else {
        Write-Host "   ERROR Directory does NOT exist!" -ForegroundColor Red
        Write-Host "   Check your Android SDK path" -ForegroundColor Red
    }
} else {
    Write-Host "   ERROR ANDROID_HOME is not set!" -ForegroundColor Red
    Write-Host "   Set ANDROID_HOME environment variable" -ForegroundColor Red
    
    # Try to find Android SDK
    $possiblePath = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $possiblePath) {
        Write-Host "   INFO Android SDK found at: $possiblePath" -ForegroundColor Yellow
        Write-Host "   Use this command:" -ForegroundColor Yellow
        Write-Host "   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', '$possiblePath', 'User')" -ForegroundColor Cyan
    }
}

# Check adb
Write-Host "`n2. Checking Android Debug Bridge (adb)..." -ForegroundColor Yellow
try {
    $adbVersion = adb --version 2>&1
    Write-Host "   OK adb is installed: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR adb not found in PATH!" -ForegroundColor Red
    Write-Host "   Add %ANDROID_HOME%\platform-tools to PATH" -ForegroundColor Red
}

# Check Java
Write-Host "`n3. Checking Java (JDK)..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "   OK Java is installed: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR Java not found!" -ForegroundColor Red
    Write-Host "   Install JDK 17 or higher" -ForegroundColor Red
}

# Check Gradle
Write-Host "`n4. Checking Gradle..." -ForegroundColor Yellow
try {
    $gradleVersion = gradle --version 2>&1 | Select-Object -First 1
    Write-Host "   OK Gradle is installed: $gradleVersion" -ForegroundColor Green
} catch {
    Write-Host "   WARNING Gradle not found (not critical, Android Studio will install it)" -ForegroundColor Yellow
}

# Check Android Studio
Write-Host "`n5. Checking Android Studio..." -ForegroundColor Yellow
$androidStudioPaths = @(
    "$env:ProgramFiles\Android\Android Studio",
    "${env:ProgramFiles(x86)}\Android\Android Studio",
    "$env:LOCALAPPDATA\Programs\Android Studio"
)

$found = $false
foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        Write-Host "   OK Android Studio found: $path" -ForegroundColor Green
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "   ERROR Android Studio not found!" -ForegroundColor Red
    Write-Host "   Download from: https://developer.android.com/studio" -ForegroundColor Yellow
}

# Check Capacitor Android project
Write-Host "`n6. Checking Capacitor Android project..." -ForegroundColor Yellow
if (Test-Path ".\android") {
    Write-Host "   OK Android project exists" -ForegroundColor Green
} else {
    Write-Host "   WARNING Android project not created yet" -ForegroundColor Yellow
    Write-Host "   Run: npm run cap:add:android" -ForegroundColor Cyan
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    Write-Host "OK Main components are installed!" -ForegroundColor Green
    Write-Host "`nYou can run: npm run android" -ForegroundColor Green
} else {
    Write-Host "ERROR Android SDK installation required" -ForegroundColor Red
    Write-Host "`nSee ANDROID_SETUP.md for detailed instructions" -ForegroundColor Yellow
}

Write-Host ""
