@echo off
setlocal EnableExtensions EnableDelayedExpansion

title FeedingProgram Setup

echo.
echo ============================================================
echo  FeedingProgram - One-Click Setup
echo ============================================================
echo.

REM ------------------------------------------------------------
REM Project root is the folder where this batch file is located
REM ------------------------------------------------------------
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo [INFO] Project root: "%ROOT_DIR%"
echo.

REM ------------------------------------------------------------
REM 1) Detect frontend and backend folders from project structure
REM    - Frontend: folder containing package.json
REM    - Backend : folder containing requirements.txt
REM ------------------------------------------------------------
set "FRONTEND_DIR="
set "BACKEND_DIR="

for /d %%D in ("%ROOT_DIR%\*") do (
    if exist "%%~fD\package.json" (
        if not defined FRONTEND_DIR set "FRONTEND_DIR=%%~fD"
    )
    if exist "%%~fD\requirements.txt" (
        if not defined BACKEND_DIR set "BACKEND_DIR=%%~fD"
    )
)

if not defined FRONTEND_DIR (
    echo [ERROR] Frontend folder not found. Could not locate package.json.
    goto :FAIL
)

if not defined BACKEND_DIR (
    echo [ERROR] Backend folder not found. Could not locate requirements.txt.
    goto :FAIL
)

echo [OK] Frontend folder: "%FRONTEND_DIR%"
echo [OK] Backend folder : "%BACKEND_DIR%"
echo.

REM ------------------------------------------------------------
REM 2) Check required tools: node, npm, python (or py launcher)
REM ------------------------------------------------------------
echo [STEP] Checking required tools...

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not available in PATH.
    goto :FAIL
)

echo [OK] node detected

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available in PATH.
    goto :FAIL
)

echo [OK] npm detected

set "PYTHON_EXE="
set "PYTHON_ARGS="

where python >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_EXE=python"
)

if not defined PYTHON_EXE (
    where py >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_EXE=py"
        set "PYTHON_ARGS=-3"
    )
)

if not defined PYTHON_EXE (
    echo [ERROR] Python is not available in PATH.
    goto :FAIL
)

echo [OK] Python detected via "%PYTHON_EXE% %PYTHON_ARGS%"
echo.

REM ------------------------------------------------------------
REM 3) Install frontend dependencies (npm install)
REM ------------------------------------------------------------
echo [STEP] Installing frontend dependencies...
pushd "%FRONTEND_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to open frontend directory.
    goto :FAIL
)

call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed in frontend.
    popd
    goto :FAIL
)

popd
echo [OK] Frontend dependencies installed.
echo.

REM ------------------------------------------------------------
REM 4) Create backend virtual environment if missing
REM 5) Activate virtual environment
REM 6) Install backend dependencies from requirements.txt
REM ------------------------------------------------------------
echo [STEP] Setting up backend virtual environment...
pushd "%BACKEND_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to open backend directory.
    goto :FAIL
)

if not exist ".venv\Scripts\activate.bat" (
    echo [INFO] .venv not found. Creating virtual environment...
    call %PYTHON_EXE% %PYTHON_ARGS% -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment.
        popd
        goto :FAIL
    )
    echo [OK] Virtual environment created.
) else (
    echo [OK] Existing virtual environment found.
)

echo [STEP] Activating virtual environment...
call ".venv\Scripts\activate.bat"
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment.
    popd
    goto :FAIL
)

echo [STEP] Installing backend dependencies...
call python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] pip install failed in backend.
    popd
    goto :FAIL
)

echo [OK] Backend dependencies installed.

REM Optional cleanup of activated environment for current script process
call deactivate >nul 2>&1

popd
echo.
echo ============================================================
echo [SUCCESS] Setup completed successfully!
echo ============================================================
echo.
pause
exit /b 0

:FAIL
echo.
echo ============================================================
echo [FAILED] Setup did not complete.
echo Please read the error message above, then try again.
echo ============================================================
echo.
pause
exit /b 1
