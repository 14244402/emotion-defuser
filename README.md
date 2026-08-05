# 情緒拆彈隊 Emotion Defuser

國小同理心課程的互動遊戲。學生跟著「觀察 → 思考 → 行動」三個步驟，練習辨識別人的情緒、想想對方需要什麼、再決定自己要怎麼做。

## 遊戲流程

START → 前導四格漫畫 → 任務（同學比賽輸了）→ Step 1 觀察（熱區＋鏡頭＋畫板）→ Step 2 思考 → Step 3 行動 → 同學的回應 → 結尾黑板（看看其他小朋友怎麼做）→ 下載我的答案／再玩一次

## 功能

- **三種語言版本**：注音（預設呈現直式注音在字的右側）／中文／英文，右上角可隨時切換
- **點字發音**：點任何一段文字就會唸出來（瀏覽器內建 Web Speech API）
- **鏡頭觀察**：Step 1 可以打開鏡頭看自己的表情，旁邊畫板可以畫下來
- **下載答案卡**：結尾可以把學生的所有回答＋畫的表情輸出成一張 PNG

## 檔案結構

```
index.html              遊戲本體（單一檔案，內含 UI 與邏輯）
emotion-defuser-core.js 純邏輯模組（文案、狀態機、hooks），index.html 內嵌同一份
lib/                    離線化的 React / Tailwind / Babel / lucide-react
defuser-img/            8 張插圖（comic1-4、mission1-2、step1、resp）
```

`index.html`、`lib/`、`defuser-img/` 三者必須放在一起，缺一個就跑不起來。

## 本機開啟

直接用瀏覽器打開 `index.html` 就可以玩。

只有「打開鏡頭」需要 `https` 或 `localhost` 才能用（瀏覽器安全限制）。要在本機測鏡頭的話：

```bash
python -m http.server 8123
```

然後開 http://localhost:8123

## 修改與更新

改 `index.html` 存檔後，推上來就會更新線上版本：

```bash
git add -A && git commit -m "調整內容" && git push
```

推完約 1 分鐘 GitHub Pages 會重新建置，網址不變。

## 注意事項

- 字體走 Google Fonts（Huninn／Noto Sans TC）。載不到會自動退回系統字體，不影響遊戲運作。
- 插圖是 800×500（`resp.jpg` 是 1024×576）。要換圖的話沿用同樣尺寸與檔名覆蓋即可。
