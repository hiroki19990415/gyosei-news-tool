@echo off
cd /d "C:\Users\shige\OneDrive\デスクトップ\行政情報収集ツール"

echo ===== 行政ニュース 自動更新開始 =====
echo %date% %time%

call npm run fetch
if errorlevel 1 (
  echo [エラー] 情報取得に失敗しました
  exit /b 1
)

call surge dist zyouhou-shougai.surge.sh
if errorlevel 1 (
  echo [エラー] 公開に失敗しました
  exit /b 1
)

echo ===== 完了 =====
echo %date% %time%
