@echo off
cd /d "%~dp0"
echo Aangan TV running at http://localhost:8000  (close this window to stop)
start "" http://localhost:8000
python -m http.server 8000
