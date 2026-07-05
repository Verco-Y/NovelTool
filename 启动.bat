@echo off
chcp 65001 >nul
title 大荒天道档案馆
echo.
echo   ╔══════════════════════════════╗
echo   ║    🏯 大荒天道档案馆       ║
echo   ║    仙侠人物与剧情线管理系统  ║
echo   ╚══════════════════════════════╝
echo.
echo   正在启动开发服务器...
echo.
cd /d "%~dp0"
call npm run dev
pause