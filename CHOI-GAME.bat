@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang mo game tai http://localhost:8000 ...
echo Dong cua so nay de tat game.
start "" http://localhost:8000
python -m http.server 8000 2>nul || py -m http.server 8000
pause
