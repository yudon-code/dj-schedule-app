@echo off
echo ========================================
echo   DJ Schedule App - GitHub Deploy Tool
echo ========================================
echo.

echo [1/3] Adding changes...
git add .

echo.
echo [2/3] Committing changes...
set /p msg="Enter commit message (default: Update UI/UX): "
if "%msg%"=="" set msg=Update UI/UX
git commit -m "%msg%"

echo.
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   Deploy Complete! Vercel will update soon.
echo ========================================
pause
