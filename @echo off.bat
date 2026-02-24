@echo off
cd /d "%~dp0"
start node app.js
timeout /t 2 >nul
start http://localhost:3000/index.html