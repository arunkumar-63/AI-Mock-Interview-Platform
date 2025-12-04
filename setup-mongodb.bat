@echo off
echo Setting up MongoDB for AI Mock Interview Platform...
echo.

echo Step 1: Installing Chocolatey (if not already installed)...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

echo.
echo Step 2: Installing MongoDB...
choco install mongodb -y

echo.
echo Step 3: Creating MongoDB data directory...
if not exist "C:\data\db" mkdir "C:\data\db"

echo.
echo Step 4: Starting MongoDB service...
net start MongoDB

echo.
echo MongoDB setup complete!
echo You can now start your server with: npm run dev
echo.
pause
