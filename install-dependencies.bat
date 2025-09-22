@echo off
REM Drawing Test Dependencies Installation Script
REM This script installs all necessary dependencies for the drawing test feature

echo 🎨 Installing Drawing Test Dependencies...
echo ========================================

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install Node.js and npm first.
    pause
    exit /b 1
)

REM Install main dependencies
echo 📦 Installing main dependencies...
npm install

REM Install specific drawing test dependencies
echo 🎯 Installing drawing test specific dependencies...
npm install konva@^9.3.22 react-konva@^18.2.14
npm install framer-motion@^12.23.12
npm install cloudinary@^1.41.0
npm install react-use@^17.4.2
npm install react-hotkeys-hook@^4.4.1
npm install react-use-gesture@^9.1.3

echo ✅ All dependencies installed successfully!
echo.
echo 🚀 Drawing Test Feature Dependencies:
echo   • Konva.js - 2D canvas drawing library
echo   • React-Konva - React wrapper for Konva
echo   • Framer Motion - Animations and transitions
echo   • Cloudinary - Image upload and storage
echo   • React Use - Additional React hooks
echo   • React Hotkeys Hook - Keyboard shortcuts
echo   • React Use Gesture - Touch and mouse gestures
echo.
echo 🎉 Ready to use the drawing test feature!
pause
