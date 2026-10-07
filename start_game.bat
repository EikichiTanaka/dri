@echo off
chcp 65001 > nul
title INITIAL D ARCADE STAGE
cd /d "%~dp0"
python run_game.py
pause
