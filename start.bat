@echo off
title CafePOS
cd /d "%~dp0backend"
if not exist node_modules\express (
  echo First run: installing... internet needed this one time
  call npm install --omit=dev
)
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
node server.js
pause
