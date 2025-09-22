# MWS Production Build Script
# This script automates the production build process

param(
    [string]$BuildType = "release",
    [string]$KeystorePath = "keystore/release.keystore",
    [string]$KeystorePassword = "",
    [string]$KeyAlias = "",
    [string]$KeyPassword = "",
    [switch]$Clean,
    [switch]$Test,
    [switch]$Help
)

# Display help information
if ($Help) {
    Write-Host @"
MWS Production Build Script

Usage: .\build-production.ps1 [options]

Options:
    -BuildType <type>        Build type: debug, release (default: release)
    -KeystorePath <path>     Path to keystore file (default: keystore/release.keystore)
    -KeystorePassword <pwd>  Keystore password
    -KeyAlias <alias>        Key alias
    -KeyPassword <pwd>       Key password
    -Clean                   Clean build before building
    -Test                    Run tests before building
    -Help                    Show this help message

Examples:
    .\build-production.ps1 -BuildType release -Clean
    .\build-production.ps1 -BuildType debug -Test
"@
    exit 0
}

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to validate environment
function Test-Environment {
    Write-ColorOutput "Checking build environment..." "Yellow"
    
    # Check if we're in the correct directory
    if (-not (Test-Path "app/build.gradle.kts")) {
        Write-ColorOutput "Error: Not in MWS project directory. Please run this script from the project root." "Red"
        exit 1
    }
    
    # Check if Java is available
    if (-not (Test-Command "java")) {
        Write-ColorOutput "Error: Java is not available. Please install Java and set JAVA_HOME." "Red"
        exit 1
    }
    
    # Check if Gradle wrapper exists
    if (-not (Test-Path "gradlew.bat")) {
        Write-ColorOutput "Error: Gradle wrapper not found. Please ensure gradlew.bat exists." "Red"
        exit 1
    }
    
    Write-ColorOutput "Environment check passed." "Green"
}

# Function to set environment variables
function Set-BuildEnvironment {
    Write-ColorOutput "Setting build environment variables..." "Yellow"
    
    if ($KeystorePassword) {
        $env:KEYSTORE_PASSWORD = $KeystorePassword
    }
    
    if ($KeyAlias) {
        $env:KEY_ALIAS = $KeyAlias
    }
    
    if ($KeyPassword) {
        $env:KEY_PASSWORD = $KeyPassword
    }
    
    Write-ColorOutput "Environment variables set." "Green"
}

# Function to clean build
function Invoke-CleanBuild {
    if ($Clean) {
        Write-ColorOutput "Cleaning build..." "Yellow"
        try {
            & .\gradlew.bat clean
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "Clean completed successfully." "Green"
            } else {
                Write-ColorOutput "Clean failed with exit code: $LASTEXITCODE" "Red"
                exit $LASTEXITCODE
            }
        } catch {
            Write-ColorOutput "Error during clean: $_" "Red"
            exit 1
        }
    }
}

# Function to run tests
function Invoke-Tests {
    if ($Test) {
        Write-ColorOutput "Running tests..." "Yellow"
        try {
            & .\gradlew.bat :app:testDebugUnitTest
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "Tests passed successfully." "Green"
            } else {
                Write-ColorOutput "Tests failed with exit code: $LASTEXITCODE" "Red"
                exit $LASTEXITCODE
            }
        } catch {
            Write-ColorOutput "Error during tests: $_" "Red"
            exit 1
        }
    }
}

# Function to build APK
function Invoke-Build {
    Write-ColorOutput "Building $BuildType APK..." "Yellow"
    
    try {
        $buildCommand = ".\gradlew.bat :app:assemble$($BuildType.capitalize())"
        Write-ColorOutput "Executing: $buildCommand" "Cyan"
        
        & .\gradlew.bat ":app:assemble$($BuildType.capitalize())"
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "Build completed successfully!" "Green"
            Show-BuildResults
        } else {
            Write-ColorOutput "Build failed with exit code: $LASTEXITCODE" "Red"
            exit $LASTEXITCODE
        }
    } catch {
        Write-ColorOutput "Error during build: $_" "Red"
        exit 1
    }
}

# Function to show build results
function Show-BuildResults {
    Write-ColorOutput "`nBuild Results:" "Yellow"
    
    $apkPath = "app/build/outputs/apk/$BuildType"
    if (Test-Path $apkPath) {
        $apkFiles = Get-ChildItem $apkPath -Filter "*.apk"
        
        if ($apkFiles.Count -gt 0) {
            Write-ColorOutput "APK files generated:" "Green"
            foreach ($apk in $apkFiles) {
                $size = [math]::Round($apk.Length / 1MB, 2)
                Write-ColorOutput "  $($apk.Name) ($size MB)" "White"
            }
            
            Write-ColorOutput "`nAPK location: $((Get-Item $apkPath).FullName)" "Cyan"
        } else {
            Write-ColorOutput "No APK files found in output directory." "Red"
        }
    } else {
        Write-ColorOutput "Output directory not found: $apkPath" "Red"
    }
}

# Function to validate keystore
function Test-Keystore {
    if ($BuildType -eq "release") {
        Write-ColorOutput "Validating keystore configuration..." "Yellow"
        
        if (-not (Test-Path $KeystorePath)) {
            Write-ColorOutput "Warning: Keystore file not found at: $KeystorePath" "Yellow"
            Write-ColorOutput "Please ensure the keystore file exists or update the path." "Yellow"
        }
        
        if (-not $KeystorePassword -or -not $KeyAlias -or -not $KeyPassword) {
            Write-ColorOutput "Warning: Keystore credentials not provided." "Yellow"
            Write-ColorOutput "Please provide keystore password, key alias, and key password." "Yellow"
        }
    }
}

# Function to show build summary
function Show-BuildSummary {
    Write-ColorOutput "`nBuild Summary:" "Yellow"
    Write-ColorOutput "  Build Type: $BuildType" "White"
    Write-ColorOutput "  Clean Build: $Clean" "White"
    Write-ColorOutput "  Run Tests: $Test" "White"
    Write-ColorOutput "  Keystore: $KeystorePath" "White"
    
    if ($BuildType -eq "release") {
        Write-ColorOutput "  Signing: Enabled" "Green"
    } else {
        Write-ColorOutput "  Signing: Disabled (debug build)" "Yellow"
    }
}

# Main execution
try {
    Write-ColorOutput "=== MWS Production Build Script ===" "Cyan"
    Write-ColorOutput "Starting build process..." "White"
    
    # Show build summary
    Show-BuildSummary
    
    # Validate environment
    Test-Environment
    
    # Validate keystore for release builds
    Test-Keystore
    
    # Set environment variables
    Set-BuildEnvironment
    
    # Clean build if requested
    Invoke-CleanBuild
    
    # Run tests if requested
    Invoke-Tests
    
    # Build APK
    Invoke-Build
    
    Write-ColorOutput "`nBuild process completed successfully!" "Green"
    
} catch {
    Write-ColorOutput "`nBuild process failed: $_" "Red"
    exit 1
} finally {
    # Clean up environment variables
    if ($env:KEYSTORE_PASSWORD) { Remove-Item Env:KEYSTORE_PASSWORD }
    if ($env:KEY_ALIAS) { Remove-Item Env:KEY_ALIAS }
    if ($env:KEY_PASSWORD) { Remove-Item Env:KEY_PASSWORD }
}
