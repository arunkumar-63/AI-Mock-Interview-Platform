@echo off
echo Stopping any existing Node.js processes...
taskkill /F /IM node.exe 2>nul
echo.
echo Starting the server...
cd backend
npm run dev
