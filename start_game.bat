@echo off
chcp 65001 > nul
title INITIAL D ARCADE STAGE
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% equ 0 (
    python run_game.py
) else (
    echo [INFO] ブラウザでゲームを直接起動します...
    start "" "index.html"
)
