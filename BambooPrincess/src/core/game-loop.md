# Game Loop（引擎無關）

- `Boot`：載入資源、初始化資料表
- `Stage`：60 秒關卡循環（背景層、敵機波次、天氣變化）
- `BossWarning`：警告聲 + 紅燈閃動
- `BossFight`：Boss 生命/進度追蹤
- `Result`
  - 若 Boss 消滅進度 < 70%：回到 `Stage` 並顯示字幕提醒
  - 否則進入下一關（或關卡結束）

