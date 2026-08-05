/* ═══════════════════════════════════════════════════════════════════
   情緒拆彈隊 Emotion Defuser — 純邏輯核心模組(無任何 UI)
   ───────────────────────────────────────────────────────────────────
   內容物:
     1. 語言/注音工具      strip, seg, textOf, segOf
     2. 遊戲文案+關卡資料   STR, EMO, CHOICES, HOTSPOTS
     3. 流程狀態機資料      FLOW, PROGRESS, SPLASH_OF
     4. 語音(Web Speech)  speak, speakPair, stopSpeech
     5. 回應與答案邏輯      pickResponse, answerSummary,
                           generateAnswerCardPNG, downloadAnswerCard
     6. React Hooks        useEmotionDefuser(主狀態機),
                           useDrawingPad(畫板), useCamera(鏡頭)

   依賴:React 18+(僅 Hooks 區用到)、瀏覽器 API(語音/鏡頭/Canvas)。
   在打包專案:直接 import。
   在 CDN + Babel 環境:刪掉下面的 import 行,
     改成 const { useState, useRef, useEffect, useCallback } = React;
   ═══════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════ 1. 語言/注音工具 ═══════════
   zh 字串內嵌注音:每個中文字後面直接跟注音符號(含聲調),
   程式自動配對,例:"情ㄑㄧㄥˊ緒ㄒㄩˋ"。
   lang 三種模式:"zy" 注音版 / "zh" 中文版 / "en" 英文版 */
export const ZY_RE = /[ㄅ-ㄯˉˊˇˋ˙]/;
export const ZY_ALL = /[ㄅ-ㄯˉˊˇˋ˙]/g;

/** 去掉注音,取得純中文 */
export const strip = (s) => (s || "").replace(ZY_ALL, "");

/** 把內嵌注音字串切成 [{c:字, z:注音}];標點的 z 為空字串 */
export function seg(s) {
  const out = [];
  for (const ch of s || "") {
    if (ZY_RE.test(ch) && out.length && out[out.length - 1].c)
      out[out.length - 1].z += ch;
    else out.push(ZY_RE.test(ch) ? { c: "", z: ch } : { c: ch, z: "" });
  }
  return out;
}

/** 取得某語言的「純文字」(給語音、下載、placeholder 用) */
export function textOf(lang, pair) {
  return lang === "en" ? pair.en : strip(pair.zh);
}

/** 取得某語言的「渲染資料」:
    - en / zh 回 { mode:"plain", text }
    - zy      回 { mode:"ruby",  units:[{c,z}] }  → UI 自行輸出 <ruby> */
export function segOf(lang, pair) {
  if (lang === "en") return { mode: "plain", text: pair.en };
  if (lang === "zh") return { mode: "plain", text: strip(pair.zh) };
  return { mode: "ruby", units: seg(pair.zh) };
}

/* ═══════════ 2. 遊戲文案 + 關卡資料 ═══════════ */
export const STR = {
  title:{zh:"情ㄑㄧㄥˊ緒ㄒㄩˋ拆ㄔㄞ彈ㄉㄢˋ隊ㄉㄨㄟˋ",en:"Emotion Defuser"},
  subtitle:{zh:"一ㄧ場ㄔㄤˇ關ㄍㄨㄢ於ㄩˊ同ㄊㄨㄥˊ理ㄌㄧˇ心ㄒㄧㄣ的˙ㄉㄜ小ㄒㄧㄠˇ任ㄖㄣˋ務ㄨˋ",en:"A small mission about empathy"},
  startHint:{zh:"點ㄉㄧㄢˇ一ㄧ下ㄒㄧㄚˋ文ㄨㄣˊ字ㄗˋ可ㄎㄜˇ以ㄧˇ聽ㄊㄧㄥ聲ㄕㄥ音ㄧㄣ",en:"Tap any text to hear it aloud"},
  back:{zh:"上ㄕㄤˋ一ㄧ步ㄅㄨˋ",en:"Back"},
  next:{zh:"下ㄒㄧㄚˋ一ㄧ步ㄅㄨˋ",en:"Next"},
  send:{zh:"送ㄙㄨㄥˋ出ㄔㄨ",en:"Submit"},
  /* 前導漫畫四格 */
  c1:{zh:"我ㄨㄛˇ們˙ㄇㄣ身ㄕㄣ邊ㄅㄧㄢ時ㄕˊ常ㄔㄤˊ會ㄏㄨㄟˋ出ㄔㄨ現ㄒㄧㄢˋ潛ㄑㄧㄢˊ在ㄗㄞˋ的˙ㄉㄜ情ㄑㄧㄥˊ緒ㄒㄩˋ炸ㄓㄚˋ彈ㄉㄢˋ",en:"Emotion bombs often hide around us"},
  c2:{zh:"像ㄒㄧㄤˋ是ㄕˋ朋ㄆㄥˊ友ㄧㄡˇ、同ㄊㄨㄥˊ學ㄒㄩㄝˊ、老ㄌㄠˇ師ㄕ",en:"Like friends, classmates, and teachers"},
  c3:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ沒ㄇㄟˊ有ㄧㄡˇ處ㄔㄨˇ理ㄌㄧˇ好ㄏㄠˇ的˙ㄉㄜ話ㄏㄨㄚˋ,可ㄎㄜˇ能ㄋㄥˊ會ㄏㄨㄟˋ爆ㄅㄠˋ炸ㄓㄚˋ!",en:"If we don't handle them well, they might explode!"},
  c4:{zh:"因ㄧㄣ此ㄘˇ,為ㄨㄟˋ了˙ㄌㄜ日ㄖˋ常ㄔㄤˊ的˙ㄉㄜ和ㄏㄜˊ平ㄆㄧㄥˊ,我ㄨㄛˇ們˙ㄇㄣ需ㄒㄩ要ㄧㄠˋ學ㄒㄩㄝˊ習ㄒㄧˊ如ㄖㄨˊ何ㄏㄜˊ拆ㄔㄞ解ㄐㄧㄝˇ他ㄊㄚ人ㄖㄣˊ的˙ㄉㄜ情ㄑㄧㄥˊ緒ㄒㄩˋ炸ㄓㄚˋ彈ㄉㄢˋ",en:"So, for everyday peace, let's learn how to defuse other people's emotion bombs"},
  ready:{zh:"你ㄋㄧˇ準ㄓㄨㄣˇ備ㄅㄟˋ好ㄏㄠˇ了˙ㄌㄜ嗎˙ㄇㄚ?",en:"Are you ready?"},
  /* 任務 */
  mTitle:{zh:"情ㄑㄧㄥˊ緒ㄒㄩˋ拆ㄔㄞ彈ㄉㄢˋ隊ㄉㄨㄟˋ收ㄕㄡ到ㄉㄠˋ了˙ㄌㄜ任ㄖㄣˋ務ㄨˋ!",en:"The Emotion Defuser squad has a mission!"},
  m1:{zh:"你ㄋㄧˇ身ㄕㄣ邊ㄅㄧㄢ的˙ㄉㄜ同ㄊㄨㄥˊ學ㄒㄩㄝˊ比ㄅㄧˇ賽ㄙㄞˋ輸ㄕㄨ了˙ㄌㄜ",en:"A classmate near you just lost the game"},
  m2:{zh:"他ㄊㄚ失ㄕ落ㄌㄨㄛˋ地˙ㄉㄜ坐ㄗㄨㄛˋ在ㄗㄞˋ位ㄨㄟˋ子˙ㄗ上ㄕㄤˋ…",en:"They sit at their seat, feeling down…"},
  mQ:{zh:"情ㄑㄧㄥˊ緒ㄒㄩˋ拆ㄔㄞ彈ㄉㄢˋ隊ㄉㄨㄟˋ,你ㄋㄧˇ該ㄍㄞ怎ㄗㄣˇ麼˙ㄇㄜ做ㄗㄨㄛˋ呢˙ㄋㄜ?",en:"Emotion Defuser, what should you do?"},
  /* 步驟名(splash 進場字卡) */
  step1:{zh:"Step 1 觀ㄍㄨㄢ察ㄔㄚˊ",en:"Step 1 Observe"},
  step2:{zh:"Step 2 思ㄙ考ㄎㄠˇ",en:"Step 2 Think"},
  step3:{zh:"Step 3 行ㄒㄧㄥˊ動ㄉㄨㄥˋ",en:"Step 3 Act"},
  /* Step 1 觀察 */
  s1Q:{zh:"仔ㄗˇ細ㄒㄧˋ觀ㄍㄨㄢ察ㄔㄚˊ,同ㄊㄨㄥˊ學ㄒㄩㄝˊ現ㄒㄧㄢˋ在ㄗㄞˋ是ㄕˋ甚ㄕㄣˊ麼˙ㄇㄜ心ㄒㄧㄣ情ㄑㄧㄥˊ呢˙ㄋㄜ?",en:"Look closely — how is your classmate feeling right now?"},
  s1Hint:{zh:"把ㄅㄚˇ滑ㄏㄨㄚˊ鼠ㄕㄨˇ移ㄧˊ到ㄉㄠˋ他ㄊㄚ的˙ㄉㄜ眉ㄇㄟˊ毛ㄇㄠˊ、眼ㄧㄢˇ睛ㄐㄧㄥ、嘴ㄗㄨㄟˇ巴˙ㄅㄚ、手ㄕㄡˇ上ㄕㄤˋ看ㄎㄢˋ看˙ㄎㄢ",en:"Move your mouse over the eyebrows, eyes, mouth, and hands"},
  hpBrow:{zh:"看ㄎㄢˋ看˙ㄎㄢ他ㄊㄚ的˙ㄉㄜ眉ㄇㄟˊ毛ㄇㄠˊ是ㄕˋ向ㄒㄧㄤˋ上ㄕㄤˋ↗還ㄏㄞˊ是ㄕˋ向ㄒㄧㄤˋ下ㄒㄧㄚˋ↘呢˙ㄋㄜ?",en:"Are the eyebrows going up ↗ or down ↘?"},
  hpMouth:{zh:"看ㄎㄢˋ看˙ㄎㄢ他ㄊㄚ的˙ㄉㄜ嘴ㄗㄨㄟˇ巴˙ㄅㄚ是ㄕˋ向ㄒㄧㄤˋ上ㄕㄤˋ還ㄏㄞˊ是ㄕˋ向ㄒㄧㄤˋ下ㄒㄧㄚˋ呢˙ㄋㄜ?",en:"Is the mouth turning up or down?"},
  hpHand:{zh:"你ㄋㄧˇ甚ㄕㄣˊ麼˙ㄇㄜ時ㄕˊ候ㄏㄡˋ會ㄏㄨㄟˋ有ㄧㄡˇ這ㄓㄜˋ樣ㄧㄤˋ的˙ㄉㄜ動ㄉㄨㄥˋ作ㄗㄨㄛˋ呢˙ㄋㄜ?",en:"When do you make a pose like this?"},
  s1Me:{zh:"我ㄨㄛˇ覺ㄐㄩㄝˊ得˙ㄉㄜ他ㄊㄚ現ㄒㄧㄢˋ在ㄗㄞˋ是ㄕˋ…",en:"I think they are feeling…"},
  s1Ph:{zh:"我覺得他現在是…",en:"I think they feel…"},
  /* Step 1b 照鏡子+畫表情(句子= s1bA +「所選情緒」+ s1bB + s1bC) */
  s1bA:{zh:"這ㄓㄜˋ樣ㄧㄤˋ啊˙ㄚ,如ㄖㄨˊ果ㄍㄨㄛˇ你ㄋㄧˇ",en:"I see! If YOU felt "},
  s1bB:{zh:"的˙ㄉㄜ話ㄏㄨㄚˋ,你ㄋㄧˇ會ㄏㄨㄟˋ露ㄌㄨˋ出ㄔㄨ甚ㄕㄣˊ麼˙ㄇㄜ樣ㄧㄤˋ的˙ㄉㄜ表ㄅㄧㄠˇ情ㄑㄧㄥˊ呢˙ㄋㄜ?",en:", what would your face look like?"},
  s1bC:{zh:"打ㄉㄚˇ開ㄎㄞ鏡ㄐㄧㄥˋ頭ㄊㄡˊ做ㄗㄨㄛˋ做˙ㄗㄨㄛ看ㄎㄢˋ,並ㄅㄧㄥˋ畫ㄏㄨㄚˋ下ㄒㄧㄚˋ來ㄌㄞˊ吧˙ㄅㄚ!",en:"Turn on the camera, try it, and draw it!"},
  camCap:{zh:"觀ㄍㄨㄢ察ㄔㄚˊ你ㄋㄧˇ的˙ㄉㄜ表ㄅㄧㄠˇ情ㄑㄧㄥˊ",en:"Watch your face"},
  drawCap:{zh:"畫ㄏㄨㄚˋ出ㄔㄨ你ㄋㄧˇ的˙ㄉㄜ表ㄅㄧㄠˇ情ㄑㄧㄥˊ",en:"Draw your face"},
  camOn:{zh:"打ㄉㄚˇ開ㄎㄞ鏡ㄐㄧㄥˋ頭ㄊㄡˊ觀ㄍㄨㄢ察ㄔㄚˊ",en:"Open the camera"},
  camOff:{zh:"關ㄍㄨㄢ閉ㄅㄧˋ鏡ㄐㄧㄥˋ頭ㄊㄡˊ",en:"Close the camera"},
  camFail:{zh:"沒ㄇㄟˊ有ㄧㄡˇ鏡ㄐㄧㄥˋ頭ㄊㄡˊ也ㄧㄝˇ沒ㄇㄟˊ關ㄍㄨㄢ係ㄒㄧˋ,摸ㄇㄛ摸˙ㄇㄛ自ㄗˋ己ㄐㄧˇ的˙ㄉㄜ臉ㄌㄧㄢˇ,感ㄍㄢˇ覺ㄐㄩㄝˊ看ㄎㄢˋ看˙ㄎㄢ!",en:"No camera? No problem — touch your own face and feel it!"},
  s1bHint:{zh:"仔ㄗˇ細ㄒㄧˋ觀ㄍㄨㄢ察ㄔㄚˊ你ㄋㄧˇ的˙ㄉㄜ眉ㄇㄟˊ毛ㄇㄠˊ、眼ㄧㄢˇ睛ㄐㄧㄥ、嘴ㄗㄨㄟˇ巴˙ㄅㄚ有ㄧㄡˇ甚ㄕㄣˊ麼˙ㄇㄜ變ㄅㄧㄢˋ化ㄏㄨㄚˋ?",en:"Look closely: what changed in your eyebrows, eyes, and mouth?"},
  eraser:{zh:"橡ㄒㄧㄤˋ皮ㄆㄧˊ擦ㄘㄚ",en:"Eraser"},
  clearAll:{zh:"全ㄑㄩㄢˊ部ㄅㄨˋ清ㄑㄧㄥ除ㄔㄨˊ",en:"Clear all"},
  /* Step 2 思考(問句= s2Qa +「你」(強調)+ s2Qc) */
  s2Qa:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ",en:"If "},
  s2Qb:{zh:"你ㄋㄧˇ",en:"YOU"},
  s2Qc:{zh:"遇ㄩˋ到ㄉㄠˋ這ㄓㄜˋ樣ㄧㄤˋ的˙ㄉㄜ情ㄑㄧㄥˊ境ㄐㄧㄥˋ,你ㄋㄧˇ會ㄏㄨㄟˋ希ㄒㄧ望ㄨㄤˋ別ㄅㄧㄝˊ人ㄖㄣˊ怎ㄗㄣˇ麼˙ㄇㄜ做ㄗㄨㄛˋ?",en:" were in this situation, what would you want others to do?"},
  n1:{zh:"給ㄍㄟˇ我ㄨㄛˇ一ㄧ點ㄉㄧㄢˇ空ㄎㄨㄥ間ㄐㄧㄢ",en:"Give me some space"},
  n2:{zh:"靜ㄐㄧㄥˋ靜ㄐㄧㄥˋ聽ㄊㄧㄥ我ㄨㄛˇ說ㄕㄨㄛ",en:"Quietly listen to me"},
  n3:{zh:"陪ㄆㄟˊ我ㄨㄛˇ走ㄗㄡˇ一ㄧ走ㄗㄡˇ",en:"Take a walk with me"},
  other:{zh:"其ㄑㄧˊ他ㄊㄚ",en:"Other"},
  s2Ph:{zh:"我希望別人…",en:"I'd want others to…"},
  /* Step 3 行動 */
  s3Qa:{zh:"當ㄉㄤ你ㄋㄧˇ看ㄎㄢˋ到ㄉㄠˋ",en:"When you see "},
  s3Qb:{zh:"別ㄅㄧㄝˊ人ㄖㄣˊ",en:"someone else"},
  s3Qc:{zh:"這ㄓㄜˋ樣ㄧㄤˋ時ㄕˊ,你ㄋㄧˇ會ㄏㄨㄟˋ怎ㄗㄣˇ麼˙ㄇㄜ做ㄗㄨㄛˋ?",en:" like this, what will you do?"},
  a1:{zh:"給ㄍㄟˇ他ㄊㄚ一ㄧ點ㄉㄧㄢˇ空ㄎㄨㄥ間ㄐㄧㄢ",en:"Give them some space"},
  a2:{zh:"靜ㄐㄧㄥˋ靜ㄐㄧㄥˋ聽ㄊㄧㄥ他ㄊㄚ說ㄕㄨㄛ",en:"Quietly listen to them"},
  a3:{zh:"陪ㄆㄟˊ他ㄊㄚ走ㄗㄡˇ一ㄧ走ㄗㄡˇ",en:"Take a walk with them"},
  s3Ph:{zh:"我會…",en:"I would…"},
  /* 同學的回應(依 RESP_MAP 隨機) */
  r1:{zh:"謝ㄒㄧㄝˋ謝˙ㄒㄧㄝ你ㄋㄧˇ,我ㄨㄛˇ現ㄒㄧㄢˋ在ㄗㄞˋ好ㄏㄠˇ多ㄉㄨㄛ了˙ㄌㄜ。",en:"Thank you, I feel much better now."},
  r2:{zh:"謝ㄒㄧㄝˋ謝˙ㄒㄧㄝ你ㄋㄧˇ,可ㄎㄜˇ是ㄕˋ我ㄨㄛˇ現ㄒㄧㄢˋ在ㄗㄞˋ想ㄒㄧㄤˇ一ㄧ個˙ㄍㄜ人ㄖㄣˊ靜ㄐㄧㄥˋ一ㄧ靜ㄐㄧㄥˋ。",en:"Thank you, but right now I'd like to be alone for a bit."},
  r3:{zh:"你ㄋㄧˇ現ㄒㄧㄢˋ在ㄗㄞˋ有ㄧㄡˇ空ㄎㄨㄥˋ嗎˙ㄇㄚ?我ㄨㄛˇ想ㄒㄧㄤˇ和ㄏㄢˋ你ㄋㄧˇ聊ㄌㄧㄠˊ一ㄧ聊ㄌㄧㄠˊ。",en:"Are you free right now? I'd like to talk with you."},
  peersBtn:{zh:"看ㄎㄢˋ看˙ㄎㄢ其ㄑㄧˊ他ㄊㄚ小ㄒㄧㄠˇ朋ㄆㄥˊ友ㄧㄡˇ怎ㄗㄣˇ麼˙ㄇㄜ做ㄗㄨㄛˋ",en:"See what other kids did"},
  /* 結尾:同理心 + 八個同儕示範泡泡 */
  endHeart:{zh:"同ㄊㄨㄥˊ理ㄌㄧˇ心ㄒㄧㄣ",en:"Empathy"},
  endSteps:{zh:"觀ㄍㄨㄢ察ㄔㄚˊ · 思ㄙ考ㄎㄠˇ · 行ㄒㄧㄥˊ動ㄉㄨㄥˋ",en:"Observe · Think · Act"},
  b1:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ我ㄨㄛˇ,我ㄨㄛˇ會ㄏㄨㄟˋ覺ㄐㄩㄝˊ得˙ㄉㄜ生ㄕㄥ氣ㄑㄧˋ。我ㄨㄛˇ希ㄒㄧ望ㄨㄤˋ別ㄅㄧㄝˊ人ㄖㄣˊ不ㄅㄨˊ要ㄧㄠˋ一ㄧ直ㄓˊ講ㄐㄧㄤˇ話ㄏㄨㄚˋ,所ㄙㄨㄛˇ以ㄧˇ我ㄨㄛˇ會ㄏㄨㄟˋ先ㄒㄧㄢ給ㄍㄟˇ他ㄊㄚ一ㄧ點ㄉㄧㄢˇ空ㄎㄨㄥ間ㄐㄧㄢ。",en:"If it were me, I'd feel angry. I'd want others to stop talking, so I'd give them some space first."},
  b2:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ我ㄨㄛˇ,我ㄨㄛˇ會ㄏㄨㄟˋ覺ㄐㄩㄝˊ得˙ㄉㄜ難ㄋㄢˊ過ㄍㄨㄛˋ。我ㄨㄛˇ希ㄒㄧ望ㄨㄤˋ有ㄧㄡˇ人ㄖㄣˊ靜ㄐㄧㄥˋ靜ㄐㄧㄥˋ陪ㄆㄟˊ我ㄨㄛˇ,所ㄙㄨㄛˇ以ㄧˇ我ㄨㄛˇ會ㄏㄨㄟˋ坐ㄗㄨㄛˋ在ㄗㄞˋ他ㄊㄚ旁ㄆㄤˊ邊ㄅㄧㄢ聽ㄊㄧㄥ他ㄊㄚ說ㄕㄨㄛ。",en:"If it were me, I'd feel sad. I'd want someone to quietly stay with me, so I'd sit beside them and listen."},
  b3:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ我ㄨㄛˇ,我ㄨㄛˇ會ㄏㄨㄟˋ覺ㄐㄩㄝˊ得˙ㄉㄜ不ㄅㄨˋ甘ㄍㄢ心ㄒㄧㄣ。我ㄨㄛˇ希ㄒㄧ望ㄨㄤˋ有ㄧㄡˇ人ㄖㄣˊ懂ㄉㄨㄥˇ我ㄨㄛˇ,所ㄙㄨㄛˇ以ㄧˇ我ㄨㄛˇ會ㄏㄨㄟˋ跟ㄍㄣ他ㄊㄚ說ㄕㄨㄛ『下ㄒㄧㄚˋ次ㄘˋ再ㄗㄞˋ一ㄧ起ㄑㄧˇ加ㄐㄧㄚ油ㄧㄡˊ』。",en:"If it were me, I'd feel frustrated. I'd want someone to understand me, so I'd say: let's try again next time!"},
  b4:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ我ㄨㄛˇ,我ㄨㄛˇ會ㄏㄨㄟˋ覺ㄐㄩㄝˊ得˙ㄉㄜ疲ㄆㄧˊ累ㄌㄟˋ。我ㄨㄛˇ希ㄒㄧ望ㄨㄤˋ能ㄋㄥˊ趴ㄆㄚ在ㄗㄞˋ桌ㄓㄨㄛ子˙ㄗ休ㄒㄧㄡ息ㄒㄧˊ,所ㄙㄨㄛˇ以ㄧˇ我ㄨㄛˇ會ㄏㄨㄟˋ先ㄒㄧㄢ給ㄍㄟˇ他ㄊㄚ一ㄧ點ㄉㄧㄢˇ空ㄎㄨㄥ間ㄐㄧㄢ。",en:"If it were me, I'd feel tired. I'd want to rest on my desk, so I'd give them some space first."},
  b5:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ我ㄨㄛˇ,我ㄨㄛˇ會ㄏㄨㄟˋ覺ㄐㄩㄝˊ得˙ㄉㄜ難ㄋㄢˊ過ㄍㄨㄛˋ。我ㄨㄛˇ希ㄒㄧ望ㄨㄤˋ有ㄧㄡˇ人ㄖㄣˊ能ㄋㄥˊ讓ㄖㄤˋ我ㄨㄛˇ轉ㄓㄨㄢˇ換ㄏㄨㄢˋ心ㄒㄧㄣ情ㄑㄧㄥˊ,所ㄙㄨㄛˇ以ㄧˇ我ㄨㄛˇ會ㄏㄨㄟˋ跟ㄍㄣ他ㄊㄚ分ㄈㄣ享ㄒㄧㄤˇ零ㄌㄧㄥˊ食ㄕˊ。",en:"If it were me, I'd feel sad. I'd want someone to cheer me up, so I'd share a snack with them."},
  b6:{zh:"如ㄖㄨˊ果ㄍㄨㄛˇ是ㄕˋ我ㄨㄛˇ,我ㄨㄛˇ會ㄏㄨㄟˋ覺ㄐㄩㄝˊ得˙ㄉㄜ生ㄕㄥ氣ㄑㄧˋ。我ㄨㄛˇ希ㄒㄧ望ㄨㄤˋ有ㄧㄡˇ人ㄖㄣˊ能ㄋㄥˊ開ㄎㄞ導ㄉㄠˇ我ㄨㄛˇ,所ㄙㄨㄛˇ以ㄧˇ我ㄨㄛˇ會ㄏㄨㄟˋ跟ㄍㄣ老ㄌㄠˇ師ㄕ說ㄕㄨㄛ。",en:"If it were me, I'd feel angry. I'd want someone to guide me, so I'd talk to the teacher."},
  b7:{zh:"就ㄐㄧㄡˋ算ㄙㄨㄢˋ用ㄩㄥˋ自ㄗˋ己ㄐㄧˇ希ㄒㄧ望ㄨㄤˋ的˙ㄉㄜ方ㄈㄤ式ㄕˋ安ㄢ慰ㄨㄟˋ,別ㄅㄧㄝˊ人ㄖㄣˊ也ㄧㄝˇ不ㄅㄨˋ一ㄧ定ㄉㄧㄥˋ能ㄋㄥˊ接ㄐㄧㄝ受ㄕㄡˋ呢˙ㄋㄜ。",en:"Even if we comfort others the way WE like, they may not always accept it."},
  b8:{zh:"一ㄧ樣ㄧㄤˋ的˙ㄉㄜ選ㄒㄩㄢˇ擇ㄗㄜˊ背ㄅㄟˋ後ㄏㄡˋ也ㄧㄝˇ會ㄏㄨㄟˋ有ㄧㄡˇ不ㄅㄨˋ同ㄊㄨㄥˊ理ㄌㄧˇ由ㄧㄡˊ呢˙ㄋㄜ。",en:"The same choice can come from different reasons, too."},
  again:{zh:"再ㄗㄞˋ玩ㄨㄢˊ一ㄧ次ㄘˋ",en:"Play again"},
  dl:{zh:"下ㄒㄧㄚˋ載ㄗㄞˋ我ㄨㄛˇ的˙ㄉㄜ答ㄉㄚˊ案ㄢˋ",en:"Download my answers"},
  /* 下載答案卡文案 */
  dlTitle:{zh:"情緒拆彈隊 — 我的答案",en:"Emotion Defuser — My Answers"},
  dlScene:{zh:"任務情境:同學比賽輸了",en:"Mission: a classmate lost the game"},
  dlQ1:{zh:"① 觀察:我覺得他現在是",en:"1. Observe: I think they felt"},
  dlQ2:{zh:"② 思考:如果是我,我希望別人",en:"2. Think: if it were me, I'd want others to"},
  dlQ3:{zh:"③ 行動:我會",en:"3. Act: I would"},
  dlR:{zh:"同學的回應",en:"Their response"},
  dlDraw:{zh:"我畫的表情:",en:"My drawing:"},
  dlDate:{zh:"日期",en:"Date"},
  dlFoot:{zh:"同理心 = 觀察 + 思考 + 行動",en:"Empathy = Observe + Think + Act"},
  dlEmpty:{zh:"(沒有填)",en:"(blank)"},
};

/** Step 1 情緒選項(不含「其他」;其他=自由輸入) */
export const EMO = {
  angry:{zh:"生ㄕㄥ氣ㄑㄧˋ",en:"Angry"},
  sad:{zh:"難ㄋㄢˊ過ㄍㄨㄛˋ",en:"Sad"},
  tired:{zh:"疲ㄆㄧˊ累ㄌㄟˋ",en:"Tired"},
};
export const EMO_KEYS = ["angry","sad","tired"];

/** Step 2 / Step 3 選項:key 是內部值,strKey 對到 STR 文案 */
export const CHOICES = {
  need:[   // Step 2 我希望別人…
    {key:"space", strKey:"n1"},
    {key:"listen",strKey:"n2"},
    {key:"walk",  strKey:"n3"},
  ],
  action:[ // Step 3 我會…
    {key:"space", strKey:"a1"},
    {key:"listen",strKey:"a2"},
    {key:"walk",  strKey:"a3"},
  ],
};

/** Step 1 觀察熱區(關卡資料)。
    x/y/w/h 為場景容器的百分比(相對定位),kind:
    - "tip"  → 顯示 STR[strKey] 氣泡並可發音
    - "lens" → 眼睛局部放大(UI 自行決定放大鏡呈現) */
export const HOTSPOTS = [
  {id:"brow",  kind:"tip",  strKey:"hpBrow",  x:36,y:26,w:28,h:9},
  {id:"eye",   kind:"lens", strKey:null,      x:36,y:36,w:28,h:8},
  {id:"mouth", kind:"tip",  strKey:"hpMouth", x:41,y:45,w:18,h:9},
  {id:"handL", kind:"tip",  strKey:"hpHand",  x:21,y:52,w:17,h:18},
  {id:"handR", kind:"tip",  strKey:"hpHand",  x:62,y:52,w:17,h:18},
];

/** 結尾黑板泡泡的順序(HEART = 中央同理心愛心) */
export const END_ORDER = ["b1","b2","b3","b4","HEART","b5","b6","b7","b8"];

/* ═══════════ 3. 流程狀態機資料 ═══════════
   畫面流程(設計圖):start → comic(前導) → mission(任務)
   → step1(觀察) → step1b(照鏡子+畫) → step2(思考)
   → step3(行動) → resp(同學回應) → end(結尾) */
export const FLOW = {
  start:  {next:"comic",  back:null},
  comic:  {next:"mission",back:"start"},
  mission:{next:"step1",  back:"comic"},
  step1:  {next:"step1b", back:"mission"},
  step1b: {next:"step2",  back:"step1"},
  step2:  {next:"step3",  back:"step1b"},
  step3:  {next:"resp",   back:"step2"},
  resp:   {next:"end",    back:"step3"},
  end:    {next:null,     back:"resp"},
};
/** 進度條百分比 */
export const PROGRESS = {start:0,comic:14,mission:28,step1:42,step1b:56,step2:70,step3:82,resp:92,end:100};
/** 進入這些畫面時要先播步驟字卡(splash),值=步驟編號 */
export const SPLASH_OF = {step1:1,step2:2,step3:3};

/* ═══════════ 4. 語音(Web Speech API) ═══════════ */
export function stopSpeech(){
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
/** 唸一段純文字。lang: "zy"/"zh" → zh-TW,"en" → en-US */
export function speak(lang, txt){
  if (!("speechSynthesis" in window) || !txt) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt);
  u.lang = lang === "en" ? "en-US" : "zh-TW";
  u.rate = 0.95;
  const vs = window.speechSynthesis.getVoices();
  const v = vs.find(v=>v.lang.replace("_","-").startsWith(u.lang))
        || vs.find(v=>v.lang.startsWith(lang==="en"?"en":"zh"));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
/** 唸一個 {zh,en} 文案物件 */
export const speakPair = (lang, pair) => speak(lang, textOf(lang, pair));

/* ═══════════ 5. 回應與答案邏輯 ═══════════ */
/** 設計圖規則:選「給他空間」→ 回應1或3;「聽他說」→ 1或2;
    「陪他走走」→ 1或2;「其他」→ 1、2、3。回傳 0-based index(0..2) */
export const RESP_MAP = {space:[0,2], listen:[0,1], walk:[0,1], other:[0,1,2]};
export function pickResponse(actionKey, rng=Math.random){
  const arr = RESP_MAP[actionKey] || [0,1,2];
  return arr[Math.floor(rng()*arr.length)];
}

/** answers 狀態的初始形狀 */
export const EMPTY_ANSWERS = {
  emotion:null,      // "angry"|"sad"|"tired"|"other"
  emotionText:"",    // 其他:自由輸入
  need:null,         // "space"|"listen"|"walk"|"other"
  needText:"",
  action:null,       // 同上
  actionText:"",
  resp:null,         // 0|1|2 → STR["r"+(resp+1)]
  draw:null,         // 畫板 PNG dataURL
};

/** 把 answers 轉成某語言的純文字摘要(給 UI 顯示或匯出) */
export function answerSummary(lang, ans){
  const need = ans.need==="other" ? (ans.needText||textOf(lang,STR.dlEmpty))
    : ans.need ? textOf(lang, STR[{space:"n1",listen:"n2",walk:"n3"}[ans.need]]) : "—";
  const action = ans.action==="other" ? (ans.actionText||textOf(lang,STR.dlEmpty))
    : ans.action ? textOf(lang, STR[{space:"a1",listen:"a2",walk:"a3"}[ans.action]]) : "—";
  const emotion = ans.emotion==="other" ? (ans.emotionText||"—")
    : ans.emotion ? textOf(lang, EMO[ans.emotion]) : "—";
  const response = ans.resp!=null ? textOf(lang, STR["r"+(ans.resp+1)]) : "—";
  return {emotion, need, action, response};
}

/** 產生答案卡 PNG(回傳 Promise<Blob>)。fontFamily 可依新 UI 換字型 */
export function generateAnswerCardPNG(lang, ans, {fontFamily="'Noto Sans TC',sans-serif"}={}){
  return new Promise(resolve=>{
    const cv=document.createElement("canvas"); cv.width=880; cv.height=1240;
    const ctx=cv.getContext("2d");
    const P=k=>textOf(lang,STR[k]);
    const wrap=(text,x,y,maxW,lh)=>{
      let line="",yy=y;
      for(const ch of text){
        if(ctx.measureText(line+ch).width>maxW){ctx.fillText(line,x,yy);line=ch;yy+=lh;}
        else line+=ch;
      }
      ctx.fillText(line,x,yy); return yy+lh;
    };
    ctx.fillStyle="#FDF9F3"; ctx.fillRect(0,0,880,1240);
    ctx.strokeStyle="#F5B94E"; ctx.lineWidth=12; ctx.strokeRect(12,12,856,1216);
    ctx.fillStyle="#E0524B"; ctx.font="bold 42px "+fontFamily; ctx.textAlign="center";
    ctx.fillText(P("dlTitle"),440,96);
    ctx.fillStyle="#8A7A63"; ctx.font="24px "+fontFamily;
    ctx.fillText(P("dlScene"),440,142);
    ctx.textAlign="left";
    const sum=answerSummary(lang,ans);
    let y=210;
    const item=(label,val)=>{
      ctx.fillStyle="#C98A2E"; ctx.font="bold 26px "+fontFamily;
      y=wrap(label,70,y,740,38);
      ctx.fillStyle="#4A4160"; ctx.font="bold 32px "+fontFamily;
      y=wrap(val,70,y+6,740,46)+26;
    };
    item(P("dlQ1"),sum.emotion);
    item(P("dlQ2"),sum.need);
    item(P("dlQ3"),sum.action);
    item(P("dlR"),sum.response);
    const fin=()=>{
      ctx.fillStyle="#E0524B"; ctx.font="bold 28px "+fontFamily; ctx.textAlign="center";
      ctx.fillText(P("dlFoot"),440,1150);
      ctx.fillStyle="#8A7A63"; ctx.font="22px "+fontFamily;
      ctx.fillText(P("dlDate")+": "+new Date().toLocaleDateString(),440,1190);
      cv.toBlob(resolve);
    };
    if(ans.draw){
      ctx.fillStyle="#C98A2E"; ctx.font="bold 26px "+fontFamily;
      ctx.fillText(P("dlDraw"),70,y);
      const im=new Image();
      im.onload=()=>{
        ctx.fillStyle="#fff"; ctx.fillRect(70,y+14,330,258);
        ctx.drawImage(im,70,y+14,330,258);
        ctx.strokeStyle="#E3D4AD"; ctx.lineWidth=4; ctx.strokeRect(70,y+14,330,258);
        fin();
      };
      im.src=ans.draw;
    } else fin();
  });
}
/** 直接觸發下載答案卡 */
export async function downloadAnswerCard(lang, ans, opts){
  const blob=await generateAnswerCardPNG(lang, ans, opts);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=(lang==="en"?"my_answers_emotion_defuser":"我的答案_情緒拆彈隊")+".png";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/* ═══════════ 6. React Hooks ═══════════ */

/**
 * 主狀態機 Hook:語言、畫面流程、splash、答案。
 * UI 只需要:
 *   const g = useEmotionDefuser();
 *   g.screen          → 目前畫面 key(start/comic/mission/step1/step1b/step2/step3/resp/end)
 *   g.progress        → 進度條 %(自己做動畫)
 *   g.splash          → null 或 {n:1|2|3, out:boolean}(步驟字卡進場/退場)
 *   g.lang/g.setLang  → "zy"|"zh"|"en"
 *   g.answers         → 目前答案(EMPTY_ANSWERS 形狀)
 *   g.next()/g.back()/g.goTo(key)/g.restart()
 *   g.pickEmotion(key)/g.pickEmotionOther(text)   → 選完自動前往 step1b
 *   g.pickNeed(key)/g.pickNeedOther(text)         → 選完自動前往 step3
 *   g.pickAction(key)/g.pickActionOther(text)     → 選完自動擲回應並前往 resp
 *   g.setDrawing(dataURL)                          → 存畫板
 *   g.respKey          → "r1"|"r2"|"r3"|null(給 UI 取回應文案)
 */
export function useEmotionDefuser({
  initialLang="zy",
  splashInMs=1350,    // 字卡停留時間
  splashOutMs=500,    // 字卡退場動畫時間
  autoSpeak=true,     // 換步驟時自動唸步驟名/回應
  advanceDelayMs=350, // 點選項後延遲換頁(讓按壓動畫跑完)
}={}){
  const [lang,setLang]=useState(initialLang);
  const [screen,setScreen]=useState("start");
  const [splash,setSplash]=useState(null);
  const [answers,setAnswers]=useState(EMPTY_ANSWERS);
  const timers=useRef([]);
  const later=(fn,ms)=>{timers.current.push(setTimeout(fn,ms));};
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);stopSpeech();},[]);

  const goTo=useCallback((scr)=>{
    stopSpeech();
    setScreen(scr);
    const n=SPLASH_OF[scr];
    if(n){
      setSplash({n,out:false});
      if(autoSpeak) speakPair(lang, STR["step"+n]);
      later(()=>setSplash(s=>s&&{...s,out:true}),splashInMs);
      later(()=>setSplash(null),splashInMs+splashOutMs);
    }
  },[lang,autoSpeak,splashInMs,splashOutMs]);

  const next=useCallback(()=>{const t=FLOW[screen]?.next;if(t)goTo(t);},[screen,goTo]);
  const back=useCallback(()=>{
    const t=FLOW[screen]?.back;
    if(!t)return;
    if(screen==="resp") setAnswers(a=>({...a,resp:null})); // 回上一步要重擲回應
    goTo(t);
  },[screen,goTo]);
  const restart=useCallback(()=>{setAnswers(EMPTY_ANSWERS);goTo("start");},[goTo]);

  /* Step 1:選情緒 → step1b */
  const pickEmotion=useCallback((key)=>{
    setAnswers(a=>({...a,emotion:key,emotionText:""}));
    if(autoSpeak) speakPair(lang,EMO[key]);
    later(()=>goTo("step1b"),advanceDelayMs);
  },[lang,goTo,autoSpeak,advanceDelayMs]);
  const pickEmotionOther=useCallback((text)=>{
    if(!text?.trim())return false;
    setAnswers(a=>({...a,emotion:"other",emotionText:text.trim()}));
    goTo("step1b"); return true;
  },[goTo]);

  /* Step 2:選需求 → step3 */
  const pickNeed=useCallback((key)=>{
    setAnswers(a=>({...a,need:key,needText:""}));
    if(autoSpeak) speakPair(lang,STR[CHOICES.need.find(c=>c.key===key).strKey]);
    later(()=>goTo("step3"),advanceDelayMs);
  },[lang,goTo,autoSpeak,advanceDelayMs]);
  const pickNeedOther=useCallback((text)=>{
    if(!text?.trim())return false;
    setAnswers(a=>({...a,need:"other",needText:text.trim()}));
    goTo("step3"); return true;
  },[goTo]);

  /* Step 3:選行動 → 擲回應 → resp */
  const commitAction=useCallback((key,text)=>{
    const resp=pickResponse(key);
    setAnswers(a=>({...a,action:key,actionText:text||"",resp}));
    if(autoSpeak) later(()=>speakPair(lang,STR["r"+(resp+1)]),650);
  },[lang,autoSpeak]);
  const pickAction=useCallback((key)=>{
    if(autoSpeak) speakPair(lang,STR[CHOICES.action.find(c=>c.key===key).strKey]);
    commitAction(key,"");
    later(()=>goTo("resp"),advanceDelayMs);
  },[lang,goTo,autoSpeak,advanceDelayMs,commitAction]);
  const pickActionOther=useCallback((text)=>{
    if(!text?.trim())return false;
    commitAction("other",text.trim());
    goTo("resp"); return true;
  },[goTo,commitAction]);

  const setDrawing=useCallback((dataURL)=>setAnswers(a=>({...a,draw:dataURL})),[]);

  return {
    lang,setLang, screen, splash, answers,
    progress: PROGRESS[screen] ?? 0,
    respKey: answers.resp!=null ? "r"+(answers.resp+1) : null,
    goTo, next, back, restart,
    pickEmotion, pickEmotionOther,
    pickNeed, pickNeedOther,
    pickAction, pickActionOther,
    setDrawing,
    /* 便利函式 */
    say:(pairOrKey)=>speakPair(lang, typeof pairOrKey==="string"?STR[pairOrKey]:pairOrKey),
    text:(pairOrKey)=>textOf(lang, typeof pairOrKey==="string"?STR[pairOrKey]:pairOrKey),
    render:(pairOrKey)=>segOf(lang, typeof pairOrKey==="string"?STR[pairOrKey]:pairOrKey),
    summary:()=>answerSummary(lang,answers),
    download:(opts)=>downloadAnswerCard(lang,answers,opts),
  };
}

/**
 * 畫板 Hook(滑鼠+觸控)。UI 只要放一個 <canvas ref={canvasRef}>。
 * 回傳 {color,setColor,erase,setErase,clear} ;
 * 每次筆畫結束會呼叫 onChange(dataURL)(接 g.setDrawing)。
 */
export function useDrawingPad({canvasRef, initialImage=null, onChange,
  penWidth=5, eraserWidth=24, background="#fff"}){
  const [color,setColor]=useState("#4A4160");
  const [erase,setErase]=useState(false);
  const S=useRef({drawing:false,prev:null,color:"#4A4160",erase:false});
  useEffect(()=>{S.current.color=color;S.current.erase=erase;},[color,erase]);
  useEffect(()=>{
    const cv=canvasRef.current; if(!cv)return;
    const ctx=cv.getContext("2d");
    ctx.fillStyle=background; ctx.fillRect(0,0,cv.width,cv.height);
    if(initialImage){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0);im.src=initialImage;}
    ctx.lineCap="round"; ctx.lineJoin="round";
    const pos=e=>{const r=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;
      return{x:(t.clientX-r.left)*(cv.width/r.width),y:(t.clientY-r.top)*(cv.height/r.height)};};
    const st=e=>{S.current.drawing=true;S.current.prev=pos(e);e.preventDefault();};
    const mv=e=>{if(!S.current.drawing)return;const p=pos(e);
      ctx.strokeStyle=S.current.erase?background:S.current.color;
      ctx.lineWidth=S.current.erase?eraserWidth:penWidth;
      ctx.beginPath();ctx.moveTo(S.current.prev.x,S.current.prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();
      S.current.prev=p;e.preventDefault();};
    const en=()=>{if(S.current.drawing){S.current.drawing=false;onChange?.(cv.toDataURL("image/png"));}};
    cv.addEventListener("mousedown",st);cv.addEventListener("mousemove",mv);window.addEventListener("mouseup",en);
    cv.addEventListener("touchstart",st,{passive:false});cv.addEventListener("touchmove",mv,{passive:false});cv.addEventListener("touchend",en);
    return()=>{
      cv.removeEventListener("mousedown",st);cv.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",en);
      cv.removeEventListener("touchstart",st);cv.removeEventListener("touchmove",mv);cv.removeEventListener("touchend",en);
    };
  },[]); // eslint-disable-line
  const clear=useCallback(()=>{
    const cv=canvasRef.current; if(!cv)return;
    const ctx=cv.getContext("2d");
    ctx.fillStyle=background; ctx.fillRect(0,0,cv.width,cv.height);
    onChange?.(null);
  },[background,onChange]);
  return {color,setColor,erase,setErase,clear};
}

/**
 * 鏡頭 Hook(照鏡子)。UI 放 <video ref={videoRef} autoPlay playsInline muted>。
 * 注意:getUserMedia 需要 https 或 localhost。
 */
export function useCamera({videoRef}){
  const [on,setOn]=useState(false);
  const [error,setError]=useState(null);
  const streamRef=useRef(null);
  const stop=useCallback(()=>{
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    setOn(false);
  },[]);
  const toggle=useCallback(async()=>{
    if(streamRef.current){stop();return;}
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:true});
      streamRef.current=s; setOn(true); setError(null);
      requestAnimationFrame(()=>{if(videoRef.current)videoRef.current.srcObject=s;});
    }catch(e){setError(e);}
  },[stop,videoRef]);
  useEffect(()=>stop,[stop]); // 卸載時關鏡頭
  return {on,error,toggle,stop};
}

/* ═══════════ 7. 新 UI 接線範例(僅示意,非 UI 程式碼) ═══════════

import { useEmotionDefuser, useDrawingPad, useCamera,
         STR, EMO_KEYS, EMO, CHOICES, HOTSPOTS, END_ORDER } from "./emotion-defuser-core";

function Game(){
  const g = useEmotionDefuser();

  // 文字渲染(三種語言模式):
  //   const r = g.render("s1Q");
  //   r.mode==="plain" → 直接輸出 r.text
  //   r.mode==="ruby"  → r.units.map(u => u.z ? <ruby>{u.c}<rt>{u.z}</rt></ruby> : u.c)

  // 進度條:width = g.progress + "%"(過渡動畫由 UI 決定)
  // 步驟字卡:g.splash && <大字卡 n={g.splash.n} 退場={g.splash.out}/>
  // 畫面切換:switch(g.screen){ case "start": ... case "comic": ... }

  // Step1 熱區:HOTSPOTS.map(h => 依 h.x/h.y/h.w/h.h 放透明層;
  //   h.kind==="tip" 顯示 g.render(h.strKey) 氣泡,點擊可 g.say(h.strKey))
  // Step1 情緒:EMO_KEYS.map(k => <按鈕 onClick={()=>g.pickEmotion(k)}>)
  // Step1b 句子:g.render("s1bA") + 所選情緒 + g.render("s1bB") + g.render("s1bC")
  // Step2/3:CHOICES.need / CHOICES.action.map(c =>
  //   <卡片 onClick={()=>g.pickNeed(c.key) 或 g.pickAction(c.key)}>)
  // 回應:g.respKey && g.render(g.respKey)
  // 結尾:END_ORDER.map(k => k==="HEART" ? <愛心/> : <泡泡>{g.render(k)}</泡泡>)
  // 下載:<按鈕 onClick={()=>g.download()}>;重玩:g.restart()
}
═══════════════════════════════════════════════════════════════════ */
