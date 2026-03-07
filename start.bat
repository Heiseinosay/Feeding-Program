@echo off
title Feeding Program Runner

echo Starting server...
start "Feeding Program Server" cmd /k "cd /d %~dp0server && call .venv\Scripts\activate && python server.py"

echo Starting client...
start "Feeding Program Client" cmd /k "cd /d %~dp0client && npm start"

echo Both client and server are starting...
pause