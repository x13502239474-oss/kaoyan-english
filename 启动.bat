@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 考研英语二 · 自学工作台
echo.
echo   ============================================
echo     考研英语二 自学工作台  正在启动...
echo   ============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo   [提示] 未检测到 Node.js。
  echo   请先到 https://nodejs.org 下载并安装 LTS 版本，然后重新双击本文件。
  echo.
  pause
  exit /b 1
)
node server.js
echo.
echo   服务已停止。
pause
