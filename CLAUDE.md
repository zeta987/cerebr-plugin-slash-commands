# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案定位

這個 repo 是 Cerebr 瀏覽器擴充套件的獨立外掛倉庫，實作名為 `slash-commands` 的 **shell script 外掛**（`plugin.json` 的 `kind: "script"`、`scope: "shell"`）。倉庫根目錄本身就是 sideload 目標——Cerebr 開發者模式會把根目錄當成外掛資料夾載入，因此所有 plugin payload 都放在根目錄（`plugin.json`、`shell.js`、`helpers/`、`locales/`、`seed-prompts.json`）而非巢狀包裝。

相依版本：Cerebr `>=2.4.84 <3.0.0`（`plugin.json` → `compatibility.versionRange`）。

## 核心架構：host-native 而非自建 DOM

這是本 repo 最容易違反的設計邊界。整個 UI 層都委託給 Cerebr 主程式，外掛只負責資料與事件：

- 斜線選擇器 UI：呼叫 `api.shell.setSlashCommands(descriptors, { emptyText })` 把指令列表交給 Cerebr 原生 picker，Cerebr 擁有鍵盤導覽、IME、篩選邏輯。
- 管理頁面：呼叫 `api.shell.openPage({ view })` / `api.shell.updatePage(...)`，`view` 是由 `sections` + `kind: card/form/list/actions/stats` 組成的宣告式描述，Cerebr 算繪為原生頁面。外掛不注入任何 CSS / DOM。
- 選單項目：`api.shell.setMenuItems([...])` 提供入口按鈕。

歷史選擇的背景：`ref/legacy/zeta_lite-slash-commands/shell.js` 是舊版實作，用 `createPickerRoot`、`inputContainer.appendChild`、注入 style tag 的方式自建 picker。那條路線沒有 scroll-to-top bug（目前 Cerebr host picker 有此缺陷），但會讓外掛與 Cerebr 的視覺語言脫節、綁死 DOM 結構。**現行決策是等 Cerebr upstream 修好 scroll 問題，不退回自建 DOM 方案**。修改 `shell.js` 時不要引入自訂 DOM/CSS 作為 workaround。

## 資料流

狀態以「envelope」形式存在 `api.storage` 的 key `cerebr_plugin_lite_slash_commands_v1` 下。envelope 結構：

```
{ schemaVersion, seedVersion, commands: [...], meta: { initializedAt, lastResetAt, userManagedAt } }
```

關鍵函式（全部在 `shell.js`）：

- `normalizeEnvelope` / `serializeEnvelope`：讀寫時的正規化邊界，任何外部輸入都要先過 normalize。
- `loadInitialEnvelope`：首次啟用或空 envelope 時，從 `seed-prompts.json` + 當前 locale 的 `seed_commands` metadata 重建 4 個預設指令（key 順序由 `SEED_ORDER` 固定）。
- `refreshSeedCommandsForLocale`：語系切換時，只改寫 `seedKey` 存在的指令的 name/label/description，使用者手動改過的自訂指令不受影響。
- `persistEnvelope`：寫入 → 設 `meta.userManagedAt` → 同步 `setSlashCommands`。這是唯一的寫入路徑，不要繞過它。
- `buildSlashCommandDescriptors`：把儲存的 command 轉換成 picker descriptor 時，`prompt` 會透過 `expandLanguagePlaceholders` 將 `{{lang}}` 替換為當前 `getLocaleLabel()`。替換發生在「送進 picker」的那一刻，不是儲存時。

頁面事件進入點是 `handlePageEvent`，依 `runtimeState.pageMode`（`manage` / `import` / `export`）分派到 `handleManageAction` / `handleImportAction` / `handleExportAction`。`pageViewRevision` 是強制 Cerebr 重建 view state 的計數器，改動列表或切換 mode 時要遞增。

## i18n

`helpers/plugin-i18n.js` 把 `locales/en.json`、`zh_CN.json`、`zh_TW.json` 以 JSON module import（`with { type: 'json' }`）bundle 進來，**不使用 runtime `fetch(import.meta.url)`**——這是 Cerebr 本地 sideload 沙箱的硬性要求。新增語系時要同步更新 `LOCALE_MAP`、`SUPPORTED_LOCALES` 與 `normalizeLocaleCode` 的分支邏輯。

每個 locale JSON 必須提供 `language_label`、`ui.*` 必填 key、`seed_commands.{explain,translate,summarize,code_explain}.{name,label,description}`——schema 由 `helpers/__selftest__.mjs` 強制檢查，缺 key 會讓 `npm run selftest` 失敗。

`seed-prompts.json` 的四個 prompt 字串**必須**包含 `{{lang}}` token，selftest 也會檢查這點。

## 常用指令

```bash
npm run check      # 驗證 plugin.json 符合 manifest schema（scripts/check-manifests.mjs）
npm run selftest   # 零依賴 Node 測試：語言佔位符 + locale/seed JSON schema
```

直接對單一 manifest 跑驗證：

```bash
node ./scripts/check-manifests.mjs ./plugin.json
```

CI（`.github/workflows/ci.yml`）就是這兩條命令；push tag `v*.*.*` 會觸發 `release-package.yml`。

### 本機打包

跨平台、零依賴的 Node 腳本（`scripts/package-plugin.mjs`，git 追蹤，所有開發者都有）：

```bash
npm run package
```

會依序跑 check + selftest，然後把 `plugin.json`、`shell.js`、`seed-prompts.json`、`helpers/`、`locales/` 複製到 `dist/lite-slash-commands/`。**產物是資料夾而非 zip——Cerebr 外掛管理只接受資料夾**。release workflow 在 CI 端產出的 zip 解開後仍須得到同名資料夾才能 sideload。

另有一份 `scripts/package-lite-slash-commands.ps1` 是 repo 擁有者本地的 PowerShell 版本，在 `.git/info/exclude` 被忽略，其他 clone 出的 repo **不會**有這個檔案。若需要 Windows 專用的 pwsh 打包流程，優先使用 `npm run package`；若一定要 pwsh 版本，可請擁有者分享或自行基於 Node 版翻譯。

## 手動驗證流程

Cerebr 開發者模式 → sideload 這個 repo 根目錄（或 `dist/lite-slash-commands/`）→ 實際走過：指令管理 CRUD、`{{lang}}` 替換（切換 Cerebr 語系後重新選指令）、JSON 匯入/匯出、`All commands` 命令面板。沒有無頭測試可以取代這一步。

## ref/ 是唯讀參考資料（本地個人資源，不在 git 追蹤內）

`ref/` 整個目錄在 repo 擁有者的 `.git/info/exclude` 被忽略，**並不會**出現在 fresh clone 裡。開始處理外掛行為、host API 或歷史架構對照之前，先檢查 `ref/` 是否存在；不存在時，視需要從下列 upstream 補齊（放回 `ref/<對應名稱>/` 即可，不會污染 git 狀態，因為整個 `ref/` 被 exclude）：

- `ref/Cerebr/` ← https://github.com/yym68686/Cerebr — Cerebr 主程式原始碼。查詢 host API 實際行為、picker 內部 DOM、或確認某個 bug 是 host 端還是 plugin 端時必備。
- `ref/template-starter/` ← https://github.com/yym68686/cerebr-plugin-template — 官方外掛模板與文件。`docs/api-reference.md`（完整 `api.*` 契約）、`docs/permissions-and-slots.md`（permission → API 對照）、`docs/runtime-architecture.md`（plugin kind / activation）是主要權威，若 upstream 有 schema 更新這裡最先反映。
- `ref/legacy/zeta_lite-slash-commands/` — 本外掛還住在 Cerebr 主 repo 內時的舊版自建 DOM 實作。**只作歷史對照，不要把裡面的 `definePlugin` + 絕對路徑 import（如 `/src/utils/i18n.js`）模式搬回來**——現行 runtime 拒絕 bare specifier 與絕對路徑 import。這份沒有對應的公開 upstream，擁有者保留在本地；若缺少且任務需要對照它，先向使用者確認是否能提供，不要假設它存在。

判斷邏輯建議：要引用 `ref/` 裡的檔案前，先用 Glob / Bash `ls` 確認存在。不存在時，若是前兩者就提示要不要 clone 對應 upstream；若是 legacy 就回報缺失並繼續用其他資訊完成任務。**不要修改 `ref/` 下的任何檔案**——這是參考副本，修改後也不會被 git 追蹤，但會讓本地與 upstream 脫鉤，造成誤導。

## 會踩雷的幾件事

- `plugin.json` 的 `script.entry` 必須是相對路徑（`./shell.js`）。legacy 的 `/statics/dev-plugins/...` 絕對路徑在獨立 sideload 場景會被 runtime 拒絕。
- `dist/` 在 `.gitignore` 內，不要 commit 打包輸出。
- `permissions` 欄位使用的是舊版 namespace（`shell:input`、`shell:menu`、`shell:page`、`storage:read`、`storage:write`）。新增 API 呼叫時，對照 `ref/template-starter/docs/permissions-and-slots.md` 決定要不要加資源級 permission（如 `shell:input:slash-commands`）；runtime 仍向後相容舊 namespace。
- `setup(api)` 回傳的 async cleanup function 會在外掛卸載時呼叫，務必 `clearSlashCommands` + `clearMenuItems` + `closePage`，否則熱重載時會殘留 UI。
- 新增 seed command 時要同時改動：`SEED_ORDER`、`seed-prompts.json`、三份 `locales/*.json` 的 `seed_commands` 區塊、`helpers/__selftest__.mjs` 的 `REQUIRED_SEED_KEYS`。
