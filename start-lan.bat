@echo off
title CafePOS (kitchen screen on other devices)
cd /d "%~dp0backend"
if not exist node_modules\express (
  echo First run: installing... internet needed this one time
  call npm install --omit=dev
)
set CAFEPOS_LAN=1
echo.
echo Another device on the same Wi-Fi can open the kitchen address printed below.
echo If Windows asks about the firewall, choose "Private networks" and Allow.
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
node server.js
pause
